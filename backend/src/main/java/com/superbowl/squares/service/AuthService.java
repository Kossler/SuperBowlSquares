package com.superbowl.squares.service;

import com.superbowl.squares.dto.AuthResponse;
import com.superbowl.squares.dto.LoginRequest;
import com.superbowl.squares.dto.SignupRequest;
import com.superbowl.squares.model.PaymentInfo;
import com.superbowl.squares.model.Profile;
import com.superbowl.squares.model.User;
import com.superbowl.squares.repository.PaymentInfoRepository;
import com.superbowl.squares.repository.ProfileRepository;
import com.superbowl.squares.repository.UserRepository;
import com.superbowl.squares.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private PaymentInfoRepository paymentInfoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (request.getProfiles() != null && request.getProfiles().size() > 9) {
            throw new RuntimeException("Maximum 9 profiles allowed");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setIsAdmin(false);
        user = userRepository.save(user);

        List<Profile> profiles = new ArrayList<>();
        if (request.getProfiles() != null) {
            int profileNumber = 1;
            for (SignupRequest.ProfileDTO profileDTO : request.getProfiles()) {
                Profile profile = new Profile();
                profile.setUser(user);
                profile.setFullName(profileDTO.getFullName());
                profile.setProfileNumber(profileNumber++);
                profiles.add(profileRepository.save(profile));
            }
        }

        if (request.getPaymentInfo() != null) {
            PaymentInfo paymentInfo = new PaymentInfo();
            paymentInfo.setUser(user);
            paymentInfo.setPaymentMethod(PaymentInfo.PaymentMethod.valueOf(request.getPaymentInfo().getPaymentMethod()));
            paymentInfo.setAccountIdentifier(request.getPaymentInfo().getAccountIdentifier());
            paymentInfo.setIsPrimary(true);
            paymentInfoRepository.save(paymentInfo);
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        List<AuthResponse.ProfileDTO> profileDTOs = profiles.stream()
                .map(p -> new AuthResponse.ProfileDTO(p.getId(), p.getFullName(), p.getProfileNumber()))
                .collect(Collectors.toList());

        return new AuthResponse(token, user.getEmail(), user.getIsAdmin(), profileDTOs);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<AuthResponse.ProfileDTO> profileDTOs = user.getProfiles().stream()
                .map(p -> new AuthResponse.ProfileDTO(p.getId(), p.getFullName(), p.getProfileNumber()))
                .collect(Collectors.toList());

        return new AuthResponse(token, user.getEmail(), user.getIsAdmin(), profileDTOs);
    }
}
