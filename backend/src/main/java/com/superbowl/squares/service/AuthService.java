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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private com.superbowl.squares.google.GoogleSheetsService googleSheetsService;

    // Spreadsheet and sheet name constants (update as needed)
    private static final String SPREADSHEET_ID = "1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk";
    private static final String OWNERS_SHEET = "Owners";

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

        // Require at least one profile
        if (request.getProfiles() == null || request.getProfiles().isEmpty()) {
            throw new RuntimeException("At least one profile is required");
        }
        if (request.getProfiles().size() > 10) {
            throw new RuntimeException("Maximum 10 profiles allowed");
        }

        // Require payment info
        if (request.getPaymentInfo() == null ||
            request.getPaymentInfo().getPaymentMethod() == null ||
            request.getPaymentInfo().getPaymentMethod().isBlank() ||
            request.getPaymentInfo().getAccountIdentifier() == null ||
            request.getPaymentInfo().getAccountIdentifier().isBlank()) {
            throw new RuntimeException("Payment method and account identifier are required");
        }

        // Enforce unique profile names
        for (SignupRequest.ProfileDTO profileDTO : request.getProfiles()) {
            if (profileRepository.existsByFullNameIgnoreCase(profileDTO.getFullName())) {
                throw new com.superbowl.squares.exception.DuplicateProfileNameException("A profile with this full name already exists");
            }
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setIsAdmin(false);
        user = userRepository.save(user);

        List<Profile> profiles = new ArrayList<>();
        int profileNumber = 1;
        for (SignupRequest.ProfileDTO profileDTO : request.getProfiles()) {
            Profile profile = new Profile();
            profile.setUser(user);
            profile.setFullName(profileDTO.getFullName());
            profile.setProfileNumber(profileNumber++);
            profiles.add(profileRepository.save(profile));
        }

        PaymentInfo paymentInfo = new PaymentInfo();
        paymentInfo.setUser(user);
        paymentInfo.setPaymentMethod(PaymentInfo.PaymentMethod.valueOf(request.getPaymentInfo().getPaymentMethod()));
        paymentInfo.setAccountIdentifier(request.getPaymentInfo().getAccountIdentifier());
        paymentInfo.setIsPrimary(true);
        paymentInfoRepository.save(paymentInfo);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        logger.debug("JWT generated for signup");

        List<AuthResponse.ProfileDTO> profileDTOs = profiles.stream()
                .map(p -> new AuthResponse.ProfileDTO(p.getId(), p.getFullName(), p.getProfileNumber()))
                .collect(Collectors.toList());

        // Write to Owners sheet in Google Sheets
        try {
            List<String> profileNames = request.getProfiles().stream().map(SignupRequest.ProfileDTO::getFullName).collect(Collectors.toList());
            String paymentMethod = request.getPaymentInfo().getPaymentMethod();
            String identifier = request.getPaymentInfo().getAccountIdentifier();
            googleSheetsService.appendOwnerRow(
                SPREADSHEET_ID,
                OWNERS_SHEET,
                request.getEmail(),
                request.getPassword(), // Storing password in sheet as requested (not recommended for production)
                profileNames,
                paymentMethod,
                identifier
            );
        } catch (Exception e) {
            // Log but do not block signup
            logger.warn("Failed to update Owners sheet during signup: {}", e.getMessage());
        }
        return new AuthResponse(token, user.getEmail(), user.getIsAdmin(), profileDTOs);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        logger.debug("JWT generated for login");

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<AuthResponse.ProfileDTO> profileDTOs = user.getProfiles().stream()
                .map(p -> new AuthResponse.ProfileDTO(p.getId(), p.getFullName(), p.getProfileNumber()))
                .collect(Collectors.toList());

        AuthResponse response = new AuthResponse(token, user.getEmail(), user.getIsAdmin(), profileDTOs);
        return response;
    }

    public User getUserFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
