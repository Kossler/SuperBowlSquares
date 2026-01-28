package com.superbowl.squares.controller;

import com.fasterxml.jackson.annotation.JsonView;
import com.superbowl.squares.dto.CreatePoolRequest;
import com.superbowl.squares.dto.PaymentInfoRequest;
import com.superbowl.squares.dto.ProfileRequest;
import com.superbowl.squares.dto.UpdateScoreRequest;
import com.superbowl.squares.dto.UpdateUserRequest;
import com.superbowl.squares.model.GameScore;
import com.superbowl.squares.model.PaymentInfo;
import com.superbowl.squares.model.Pool;
import com.superbowl.squares.model.Profile;
import com.superbowl.squares.model.User;
import com.superbowl.squares.model.Winner;
import com.superbowl.squares.service.AdminService;
import com.superbowl.squares.service.GameScoreService;
import com.superbowl.squares.service.PoolService;
import com.superbowl.squares.view.View;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private PoolService poolService;

    @Autowired
    private GameScoreService gameScoreService;

    @Autowired
    private AdminService adminService;

    // Get all profiles with user email for admin assignment
    @GetMapping("/profiles")
    public ResponseEntity<List<Map<String, Object>>> getAllProfiles() {
        List<Map<String, Object>> profiles = adminService.getAllProfilesWithUserEmail();
        return ResponseEntity.ok(profiles);
    }

    @PostMapping("/pools")
    public ResponseEntity<Pool> createPool(@Valid @RequestBody CreatePoolRequest request) {
        Pool pool = poolService.createPool(request);
        return ResponseEntity.ok(pool);
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

    // Lock or unlock a pool
    @PatchMapping("/pools/{id}/lock")
    public ResponseEntity<Pool> setPoolLocked(@PathVariable Long id, @RequestParam boolean locked) {
        try {
            Pool pool = poolService.setPoolLocked(id, locked);
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

    @GetMapping("/users")
    @JsonView(View.Summary.class)
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{id}/make-admin")
    public ResponseEntity<User> makeUserAdmin(@PathVariable Long id) {
        try {
            User user = adminService.makeUserAdmin(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/users/{id}")
    @JsonView(View.Detail.class)
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        try {
            User user = adminService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        try {
            User user = adminService.updateUser(id, request);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/users/{userId}/profiles")
    public ResponseEntity<Profile> createProfile(@PathVariable Long userId, @Valid @RequestBody ProfileRequest request) {
        Profile profile = adminService.createProfile(userId, request);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profiles/{profileId}")
    public ResponseEntity<Profile> updateProfile(@PathVariable Long profileId, @Valid @RequestBody ProfileRequest request) {
        Profile profile = adminService.updateProfile(profileId, request);
        return ResponseEntity.ok(profile);
    }

    @DeleteMapping("/profiles/{profileId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long profileId) {
        try {
            adminService.deleteProfile(profileId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/users/{userId}/payment-infos")
    public ResponseEntity<PaymentInfo> createPaymentInfo(@PathVariable Long userId, @Valid @RequestBody PaymentInfoRequest request) {
        try {
            PaymentInfo paymentInfo = adminService.createPaymentInfo(userId, request);
            return ResponseEntity.ok(paymentInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/payment-infos/{paymentInfoId}")
    public ResponseEntity<PaymentInfo> updatePaymentInfo(@PathVariable Long paymentInfoId, @Valid @RequestBody PaymentInfoRequest request) {
        try {
            PaymentInfo paymentInfo = adminService.updatePaymentInfo(paymentInfoId, request);
            return ResponseEntity.ok(paymentInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/payment-infos/{paymentInfoId}")
    public ResponseEntity<Void> deletePaymentInfo(@PathVariable Long paymentInfoId) {
        try {
            adminService.deletePaymentInfo(paymentInfoId);
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
}
