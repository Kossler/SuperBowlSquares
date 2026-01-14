package com.superbowl.squares.controller;

import com.fasterxml.jackson.annotation.JsonView;
import com.superbowl.squares.dto.AuthResponse;
import com.superbowl.squares.dto.ChangePasswordRequest;
import com.superbowl.squares.dto.PaymentInfoRequest;
import com.superbowl.squares.dto.ProfileRequest;
import com.superbowl.squares.dto.UpdateEmailRequest;
import com.superbowl.squares.model.PaymentInfo;
import com.superbowl.squares.model.Profile;
import com.superbowl.squares.model.User;
import com.superbowl.squares.service.AuthService;
import com.superbowl.squares.service.UserAccountService;
import com.superbowl.squares.view.View;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserAccountService userAccountService;

    @GetMapping("/me")
    @JsonView(View.Detail.class)
    public ResponseEntity<User> getMe(Authentication authentication) {
        User user = authService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(userAccountService.getMe(user));
    }

    @PutMapping("/email")
    public ResponseEntity<AuthResponse> updateEmail(Authentication authentication, @RequestBody UpdateEmailRequest request) {
        try {
            User user = authService.getUserFromAuthentication(authentication);
            return ResponseEntity.ok(userAccountService.updateEmail(user, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/password")
    public ResponseEntity<AuthResponse> changePassword(Authentication authentication, @RequestBody ChangePasswordRequest request) {
        try {
            User user = authService.getUserFromAuthentication(authentication);
            return ResponseEntity.ok(userAccountService.changePassword(user, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/profiles")
    public ResponseEntity<Profile> createProfile(Authentication authentication, @RequestBody ProfileRequest request) {
        User user = authService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(userAccountService.createProfile(user, request));
    }

    @PutMapping("/profiles/{profileId}")
    public ResponseEntity<Profile> updateProfile(Authentication authentication, @PathVariable Long profileId, @RequestBody ProfileRequest request) {
        User user = authService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(userAccountService.updateProfile(user, profileId, request));
    }

    @DeleteMapping("/profiles/{profileId}")
    @JsonView(View.Detail.class)
    public ResponseEntity<?> deleteProfile(Authentication authentication, @PathVariable Long profileId) {
        try {
            User user = authService.getUserFromAuthentication(authentication);
            User updated = userAccountService.deleteProfile(user, profileId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/payment-infos")
    public ResponseEntity<PaymentInfo> createPaymentInfo(Authentication authentication, @RequestBody PaymentInfoRequest request) {
        User user = authService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(userAccountService.createPaymentInfo(user, request));
    }

    @PutMapping("/payment-infos/{paymentInfoId}")
    public ResponseEntity<PaymentInfo> updatePaymentInfo(Authentication authentication, @PathVariable Long paymentInfoId, @RequestBody PaymentInfoRequest request) {
        User user = authService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(userAccountService.updatePaymentInfo(user, paymentInfoId, request));
    }

    @DeleteMapping("/payment-infos/{paymentInfoId}")
    public ResponseEntity<Void> deletePaymentInfo(Authentication authentication, @PathVariable Long paymentInfoId) {
        try {
            User user = authService.getUserFromAuthentication(authentication);
            userAccountService.deletePaymentInfo(user, paymentInfoId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
