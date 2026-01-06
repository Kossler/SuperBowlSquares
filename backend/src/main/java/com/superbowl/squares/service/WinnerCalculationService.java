package com.superbowl.squares.service;

import com.superbowl.squares.model.*;
import com.superbowl.squares.repository.PoolRepository;
import com.superbowl.squares.repository.SquareRepository;
import com.superbowl.squares.repository.WinnerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class WinnerCalculationService {

    private static final Logger logger = LoggerFactory.getLogger(WinnerCalculationService.class);

    @Autowired
    private PoolRepository poolRepository;

    @Autowired
    private SquareRepository squareRepository;

    @Autowired
    private WinnerRepository winnerRepository;

    /**
     * Calculate and award winners for a given quarter
     */
    @Transactional
    public void calculateQuarterWinners(int afcScore, int nfcScore, String quarter) {
        logger.info("Calculating winners for {} - AFC {} (last digit: {}) vs NFC {} (last digit: {})",
                   quarter, afcScore, afcScore % 10, nfcScore, nfcScore % 10);

        int afcLastDigit = afcScore % 10;
        int nfcLastDigit = nfcScore % 10;

        // Get all active pools
        List<Pool> pools = poolRepository.findAll();

        for (Pool pool : pools) {
            if (!pool.getIsActive()) {
                continue;
            }

            // Find the winning square for this pool
            List<Square> winningSquares = squareRepository.findByPoolIdAndRowPositionAndColPosition(
                    pool.getId(), nfcLastDigit, afcLastDigit);

            if (winningSquares.isEmpty()) {
                logger.warn("No winning square found in pool {} for position ({}, {})",
                           pool.getId(), nfcLastDigit, afcLastDigit);
                continue;
            }

            // Get the payout amount for this quarter
            BigDecimal payoutAmount = getPayoutAmount(pool, quarter);

            for (Square winningSquare : winningSquares) {
                if (winningSquare.getProfile() == null) {
                    logger.warn("Winning square {} in pool {} is unclaimed", winningSquare.getId(), pool.getId());
                    continue;
                }

                // Check if winner already exists (avoid duplicates)
                Optional<Winner> existingWinner = winnerRepository.findBySquareIdAndQuarter(
                        winningSquare.getId(), Winner.QuarterType.valueOf(mapQuarterName(quarter)));

                if (existingWinner.isPresent()) {
                    logger.info("Winner already exists for square {} in quarter {}", winningSquare.getId(), quarter);
                    continue;
                }

                // Create winner record
                Winner winner = new Winner();
                winner.setPool(pool);
                winner.setSquare(winningSquare);
                winner.setProfile(winningSquare.getProfile());
                winner.setQuarter(Winner.QuarterType.valueOf(mapQuarterName(quarter)));
                winner.setPayoutAmount(payoutAmount);
                winner.setAfcScore(afcLastDigit);
                winner.setNfcScore(nfcLastDigit);

                winnerRepository.save(winner);
                logger.info("Created winner: Profile {} won ${} for square {} in pool {} for quarter {}",
                           winningSquare.getProfile().getFullName(),
                           payoutAmount,
                           winningSquare.getId(),
                           pool.getPoolName(),
                           quarter);

                // TODO: Award touching squares as well
                awardTouchingSquares(pool, winningSquare, afcLastDigit, nfcLastDigit, quarter, payoutAmount);
            }
        }
    }

    /**
     * Award "touching squares" - squares adjacent to the winning square
     */
    private void awardTouchingSquares(Pool pool, Square winningSquare, int afcDigit, int nfcDigit,
                                     String quarter, BigDecimal winningPayoutAmount) {
        // Touch payout is typically 10% of the main payout
        BigDecimal touchPayout = winningPayoutAmount.multiply(BigDecimal.valueOf(0.1));

        int row = winningSquare.getRowPosition();
        int col = winningSquare.getColPosition();

        // Find adjacent squares (up, down, left, right)
        int[] rowOffsets = {-1, 1, 0, 0};
        int[] colOffsets = {0, 0, -1, 1};

        for (int i = 0; i < 4; i++) {
            int adjRow = row + rowOffsets[i];
            int adjCol = col + colOffsets[i];

            // Check bounds
            if (adjRow < 0 || adjRow > 9 || adjCol < 0 || adjCol > 9) {
                continue;
            }

            List<Square> touchingSquares = squareRepository.findByPoolIdAndRowPositionAndColPosition(
                    pool.getId(), adjRow, adjCol);

            for (Square touchSquare : touchingSquares) {
                if (touchSquare.getProfile() == null) {
                    continue;
                }

                // Check if touch winner already exists
                Optional<Winner> existingTouch = winnerRepository.findBySquareIdAndQuarter(
                        touchSquare.getId(), Winner.QuarterType.valueOf(mapQuarterName(quarter)));

                if (existingTouch.isPresent()) {
                    continue;
                }

                Winner touchWinner = new Winner();
                touchWinner.setPool(pool);
                touchWinner.setSquare(touchSquare);
                touchWinner.setProfile(touchSquare.getProfile());
                touchWinner.setQuarter(Winner.QuarterType.valueOf(mapQuarterName(quarter)));
                touchWinner.setPayoutAmount(touchPayout);
                touchWinner.setAfcScore(afcDigit);
                touchWinner.setNfcScore(nfcDigit);

                winnerRepository.save(touchWinner);
                logger.info("Created touch winner: Profile {} won ${} (touch) for square {} in pool {} for quarter {}",
                           touchSquare.getProfile().getFullName(),
                           touchPayout,
                           touchSquare.getId(),
                           pool.getPoolName(),
                           quarter);
            }
        }
    }

    /**
     * Map quarter string to QuarterType enum
     */
    private String mapQuarterName(String quarter) {
        return switch (quarter) {
            case "Q1" -> "Q1";
            case "Q2" -> "Q2";
            case "Q3" -> "Q3";
            case "FINAL" -> "FINAL";
            default -> quarter;
        };
    }

    /**
     * Get the payout amount for a specific quarter from the pool
     */
    private BigDecimal getPayoutAmount(Pool pool, String quarter) {
        return switch (quarter) {
            case "Q1" -> pool.getQuarter1Payout();
            case "Q2" -> pool.getHalfTimePayout();
            case "Q3" -> pool.getQuarter3Payout();
            case "FINAL" -> pool.getFinalScorePayout();
            default -> BigDecimal.ZERO;
        };
    }
}
