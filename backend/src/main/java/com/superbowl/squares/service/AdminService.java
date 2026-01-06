package com.superbowl.squares.service;

import com.superbowl.squares.model.User;
import com.superbowl.squares.model.Winner;
import com.superbowl.squares.repository.UserRepository;
import com.superbowl.squares.repository.WinnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private WinnerRepository winnerRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Winner> getWinnersByPool(Long poolId) {
        return winnerRepository.findByPoolId(poolId);
    }

    public List<Map<String, Object>> getWinnersWithPaymentInfo() {
        List<Winner> winners = winnerRepository.findAll();

        return winners.stream().map(winner -> {
            Map<String, Object> winnerInfo = new HashMap<>();
            winnerInfo.put("winnerId", winner.getId());
            winnerInfo.put("poolId", winner.getPool().getId());
            winnerInfo.put("poolName", winner.getPool().getPoolName());
            winnerInfo.put("profileName", winner.getProfile().getFullName());
            winnerInfo.put("quarter", winner.getQuarter());
            winnerInfo.put("payoutAmount", winner.getPayoutAmount());
            winnerInfo.put("afcScore", winner.getAfcScore());
            winnerInfo.put("nfcScore", winner.getNfcScore());

            User user = winner.getProfile().getUser();
            winnerInfo.put("email", user.getEmail());

            if (!user.getPaymentInfos().isEmpty()) {
                var paymentInfo = user.getPaymentInfos().get(0);
                winnerInfo.put("paymentMethod", paymentInfo.getPaymentMethod());
                winnerInfo.put("paymentAccount", paymentInfo.getAccountIdentifier());
            }

            return winnerInfo;
        }).collect(Collectors.toList());
    }

    public List<Winner> getAllWinnersWithDetails() {
        return winnerRepository.findAll();
    }
}
