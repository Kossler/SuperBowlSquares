package com.superbowl.squares.service;

import com.superbowl.squares.dto.ClaimSquareRequest;
import com.superbowl.squares.model.Profile;
import com.superbowl.squares.model.Square;
import com.superbowl.squares.model.User;
import com.superbowl.squares.repository.ProfileRepository;
import com.superbowl.squares.repository.SquareRepository;
import com.superbowl.squares.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SquareService {

    @Autowired
    private SquareRepository squareRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Square> getSquaresByPool(Long poolId) {
        return squareRepository.findByPoolId(poolId);
    }

    @Transactional
    public Square claimSquare(ClaimSquareRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Profile profile = profileRepository.findById(request.getProfileId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (!profile.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Profile does not belong to user");
        }

        Square square = squareRepository.findByPoolIdAndRowPositionAndColPosition(
                        request.getPoolId(), request.getRowPosition(), request.getColPosition())
                .orElseThrow(() -> new RuntimeException("Square not found"));

        if (square.getProfile() != null) {
            throw new RuntimeException("Square is already claimed");
        }

        square.setProfile(profile);
        square.setProfileName(profile.getFullName());
        square.setClaimedAt(LocalDateTime.now());

        return squareRepository.save(square);
    }

    @Transactional
    public Square unclaimSquare(Long poolId, Integer rowPosition, Integer colPosition) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Square square = squareRepository.findByPoolIdAndRowPositionAndColPosition(poolId, rowPosition, colPosition)
                .orElseThrow(() -> new RuntimeException("Square not found"));

        if (square.getProfile() == null) {
            throw new RuntimeException("Square is not claimed");
        }

        if (!square.getProfile().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only unclaim your own squares");
        }

        square.setProfile(null);
        square.setProfileName(null);
        square.setClaimedAt(null);

        return squareRepository.save(square);
    }

    public long getClaimedCount(Long poolId) {
        return squareRepository.countByPoolIdAndProfileIdIsNotNull(poolId);
    }

    public List<Square> getAvailableSquares(Long poolId) {
        return squareRepository.findByPoolIdAndProfileIdIsNull(poolId);
    }
}
