package com.superbowl.squares.controller;

import com.fasterxml.jackson.annotation.JsonView;
import com.superbowl.squares.dto.AuthResponse;
import com.superbowl.squares.dto.LoginRequest;
import com.superbowl.squares.dto.SignupRequest;
import com.superbowl.squares.model.User;
import com.superbowl.squares.service.AuthService;
import com.superbowl.squares.view.View;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/me")
    @JsonView(View.Detail.class)
    public ResponseEntity<User> getMe(Authentication authentication) {
        User user = authService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
