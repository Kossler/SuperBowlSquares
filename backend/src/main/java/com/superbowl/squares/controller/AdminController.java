package com.superbowl.squares.controller;

import com.superbowl.squares.dto.CreatePoolRequest;
import com.superbowl.squares.dto.UpdateScoreRequest;
import com.superbowl.squares.model.GameScore;
import com.superbowl.squares.model.Pool;
import com.superbowl.squares.model.Winner;
import com.superbowl.squares.service.AdminService;
import com.superbowl.squares.service.GameScoreService;
import com.superbowl.squares.service.PoolService;
import com.superbowl.squares.service.ScoreFetchService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private PoolService poolService;

    @Autowired
    private GameScoreService gameScoreService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private ScoreFetchService scoreFetchService;

    @PostMapping("/pools")
    public ResponseEntity<Pool> createPool(@Valid @RequestBody CreatePoolRequest request) {
        try {
            Pool pool = poolService.createPool(request);
            return ResponseEntity.ok(pool);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/pools")
    public ResponseEntity<List<Pool>> getAllPools() {
        return ResponseEntity.ok(poolService.getAllPools());
    }

    @PatchMapping("/pools/{id}/toggle")
    public ResponseEntity<Pool> togglePoolStatus(@PathVariable Long id) {
        try {
            Pool pool = poolService.togglePoolStatus(id);
            return ResponseEntity.ok(pool);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/pools/{id}")
    public ResponseEntity<Pool> updatePool(@PathVariable Long id, @Valid @RequestBody CreatePoolRequest request) {
        try {
            Pool pool = poolService.updatePool(id, request);
            return ResponseEntity.ok(pool);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/pools/{id}")
    public ResponseEntity<Void> deletePool(@PathVariable Long id) {
        try {
            poolService.deletePool(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/scores")
    public ResponseEntity<GameScore> updateScore(@Valid @RequestBody UpdateScoreRequest request) {
        try {
            GameScore score = gameScoreService.updateScore(request);
            return ResponseEntity.ok(score);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/winners/pool/{poolId}")
    public ResponseEntity<List<Winner>> getWinnersByPool(@PathVariable Long poolId) {
        return ResponseEntity.ok(adminService.getWinnersByPool(poolId));
    }

    @GetMapping("/winners/payment-info")
    public ResponseEntity<List<Map<String, Object>>> getWinnersWithPaymentInfo() {
        return ResponseEntity.ok(adminService.getWinnersWithPaymentInfo());
    }

    @GetMapping("/winners/recent")
    public ResponseEntity<List<Winner>> getRecentWinners() {
        return ResponseEntity.ok(adminService.getAllWinnersWithDetails());
    }

    @PostMapping("/scores/refresh")
    public ResponseEntity<String> refreshScores() {
        try {
            scoreFetchService.manualRefresh();
            return ResponseEntity.ok("Scores refreshed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to refresh scores: " + e.getMessage());
        }
    }
}
