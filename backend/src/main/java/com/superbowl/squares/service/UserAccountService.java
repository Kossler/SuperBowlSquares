package com.superbowl.squares.service;

import com.superbowl.squares.dto.AuthResponse;
import com.superbowl.squares.dto.ChangePasswordRequest;
import com.superbowl.squares.dto.PaymentInfoRequest;
import com.superbowl.squares.dto.ProfileRequest;
import com.superbowl.squares.dto.UpdateEmailRequest;
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
import org.springframework.util.StringUtils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAccountService {

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

    @Autowired
    private com.superbowl.squares.google.GoogleSheetsService googleSheetsService;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public User getMe(User user) {
        return userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public AuthResponse updateEmail(User user, UpdateEmailRequest request) {
        if (request == null || !StringUtils.hasText(request.getNewEmail()) || !StringUtils.hasText(request.getCurrentPassword())) {
            throw new RuntimeException("New email and current password are required");
        }

        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), dbUser.getPasswordHash())) {
            throw new RuntimeException("Invalid current password");
        }

        String oldEmail = dbUser.getEmail();
        String newEmail = request.getNewEmail().trim();

        if (!oldEmail.equalsIgnoreCase(newEmail) && userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("Email already exists");
        }

        dbUser.setEmail(newEmail);
        User updatedUser = userRepository.save(dbUser);

        // Keep Owners sheet email in sync (best-effort)
        try {
            syncOwnersRow(updatedUser, oldEmail, null);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after email change: " + e.getMessage());
        }

        // Re-authenticate to generate a token with the new email
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(updatedUser.getEmail(), request.getCurrentPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, updatedUser.getEmail(), updatedUser.getIsAdmin(), toProfileDTOs(updatedUser.getProfiles()));
    }

    @Transactional
    public AuthResponse changePassword(User user, ChangePasswordRequest request) {
        if (request == null || !StringUtils.hasText(request.getCurrentPassword()) || !StringUtils.hasText(request.getNewPassword())) {
            throw new RuntimeException("Current password and new password are required");
        }

        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), dbUser.getPasswordHash())) {
            throw new RuntimeException("Invalid current password");
        }

        dbUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        User updatedUser = userRepository.save(dbUser);

        // Keep Owners sheet password in sync (best-effort)
        try {
            syncOwnersRow(updatedUser, null, request.getNewPassword());
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after password change: " + e.getMessage());
        }

        // Re-authenticate to return a fresh token
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(updatedUser.getEmail(), request.getNewPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, updatedUser.getEmail(), updatedUser.getIsAdmin(), toProfileDTOs(updatedUser.getProfiles()));
    }

    @Transactional
    public Profile createProfile(User user, ProfileRequest request) {
        if (request == null || !StringUtils.hasText(request.getFullName())) {
            throw new RuntimeException("Profile full name is required");
        }

        long count = profileRepository.countByUserId(user.getId());
        if (count >= 10) {
            throw new RuntimeException("Maximum 10 profiles allowed");
        }

        if (profileRepository.existsByFullNameIgnoreCase(request.getFullName())) {
            throw new com.superbowl.squares.exception.DuplicateProfileNameException("A profile with this full name already exists");
        }

        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Profile profile = new Profile();
        profile.setUser(dbUser);
        profile.setFullName(request.getFullName().trim());

        // Profile numbers are automatic for self-service users.
        Integer nextNumber = findNextAvailableProfileNumber(dbUser.getId());
        profile.setProfileNumber(nextNumber);

        Profile saved = profileRepository.save(profile);

        try {
            syncOwnersRow(getMe(dbUser), null, null);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after profile create: " + e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Profile updateProfile(User user, Long profileId, ProfileRequest request) {
        if (request == null || !StringUtils.hasText(request.getFullName())) {
            throw new RuntimeException("Profile full name is required");
        }

        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (profile.getUser() == null || !profile.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Profile does not belong to user");
        }

        String newName = request.getFullName().trim();
        if (!profile.getFullName().equalsIgnoreCase(newName) && profileRepository.existsByFullNameIgnoreCase(newName)) {
            throw new com.superbowl.squares.exception.DuplicateProfileNameException("A profile with this full name already exists");
        }

        profile.setFullName(newName);
        // Do not allow self-service users to change profileNumber.

        Profile updated = profileRepository.save(profile);

        try {
            syncOwnersRow(getMe(profile.getUser()), null, null);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after profile update: " + e.getMessage());
        }

        return updated;
    }

    private Integer findNextAvailableProfileNumber(Long userId) {
        // Use the lowest available number in 1..10 so deletes don't create permanent gaps.
        List<Profile> existing = profileRepository.findByUserId(userId);
        boolean[] used = new boolean[11];
        for (Profile p : existing) {
            Integer n = p.getProfileNumber();
            if (n != null && n >= 1 && n <= 10) {
                used[n] = true;
            }
        }
        for (int i = 1; i <= 10; i++) {
            if (!used[i]) return i;
        }
        throw new RuntimeException("Maximum 10 profiles allowed");
    }

    @Transactional
    public User deleteProfile(User user, Long profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (profile.getUser() == null || !profile.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Profile does not belong to user");
        }

        long count = profileRepository.countByUserId(user.getId());
        if (count <= 1) {
            throw new RuntimeException("At least one profile is required");
        }

        // IMPORTANT: With orphanRemoval=true on User.profiles, delete via collection mutation.
        // Deleting by id while a managed User still references the Profile can lead to confusing
        // persistence-context behavior where the row appears to "come back".
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean removed = false;
        if (dbUser.getProfiles() != null) {
            removed = dbUser.getProfiles().removeIf(p -> p != null && p.getId() != null && p.getId().equals(profileId));
        }
        if (!removed) {
            throw new RuntimeException("Profile does not belong to user");
        }

        // Force SQL execution now so any FK/constraint errors surface in this request.
        entityManager.flush();
        entityManager.clear();

        if (profileRepository.existsById(profileId)) {
            throw new RuntimeException("Profile delete did not persist");
        }

        // Load fresh lists from repositories for Owners sync + response.
        dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found after profile delete"));
        List<Profile> freshProfiles = profileRepository.findByUserId(user.getId());
        List<PaymentInfo> freshPaymentInfos = paymentInfoRepository.findByUserId(user.getId());

        User snapshot = new User();
        snapshot.setId(dbUser.getId());
        snapshot.setEmail(dbUser.getEmail());
        snapshot.setIsAdmin(dbUser.getIsAdmin());
        snapshot.setProfiles(freshProfiles);
        snapshot.setPaymentInfos(freshPaymentInfos);
        snapshot.setCreatedAt(dbUser.getCreatedAt());
        snapshot.setUpdatedAt(dbUser.getUpdatedAt());

        try {
            syncOwnersRow(snapshot, null, null);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after profile delete: " + e.getMessage());
        }

        return snapshot;
    }

    @Transactional
    public PaymentInfo createPaymentInfo(User user, PaymentInfoRequest request) {
        if (request == null || request.getPaymentMethod() == null || !StringUtils.hasText(request.getAccountIdentifier())) {
            throw new RuntimeException("Payment method and account identifier are required");
        }

        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        PaymentInfo paymentInfo = new PaymentInfo();
        paymentInfo.setUser(dbUser);
        paymentInfo.setPaymentMethod(request.getPaymentMethod());
        paymentInfo.setAccountIdentifier(request.getAccountIdentifier().trim());

        boolean hasAny = !paymentInfoRepository.findByUserId(user.getId()).isEmpty();
        boolean primary = request.getIsPrimary() != null ? request.getIsPrimary() : !hasAny;
        paymentInfo.setIsPrimary(primary);

        PaymentInfo saved = paymentInfoRepository.save(paymentInfo);

        if (primary) {
            ensureSinglePrimary(dbUser, saved.getId());
        }

        try {
            syncOwnersRow(getMe(dbUser), null, null);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after payment create: " + e.getMessage());
        }

        return saved;
    }

    @Transactional
    public PaymentInfo updatePaymentInfo(User user, Long paymentInfoId, PaymentInfoRequest request) {
        if (request == null || request.getPaymentMethod() == null || !StringUtils.hasText(request.getAccountIdentifier())) {
            throw new RuntimeException("Payment method and account identifier are required");
        }

        PaymentInfo paymentInfo = paymentInfoRepository.findById(paymentInfoId)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));

        if (paymentInfo.getUser() == null || !paymentInfo.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Payment method does not belong to user");
        }

        paymentInfo.setPaymentMethod(request.getPaymentMethod());
        paymentInfo.setAccountIdentifier(request.getAccountIdentifier().trim());
        // Self-service edits should reflect on Owners sheet; treat the edited payment method as the primary one.
        paymentInfo.setIsPrimary(true);

        PaymentInfo updated = paymentInfoRepository.save(paymentInfo);

        if (Boolean.TRUE.equals(updated.getIsPrimary())) {
            ensureSinglePrimary(updated.getUser(), updated.getId());
        }

        try {
            syncOwnersRow(getMe(updated.getUser()), null, null);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after payment update: " + e.getMessage());
        }

        return updated;
    }

    @Transactional
    public void deletePaymentInfo(User user, Long paymentInfoId) {
        PaymentInfo paymentInfo = paymentInfoRepository.findById(paymentInfoId)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));

        if (paymentInfo.getUser() == null || !paymentInfo.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Payment method does not belong to user");
        }

        paymentInfoRepository.delete(paymentInfo);

        // If we deleted the primary, pick another one as primary if any remain
        List<PaymentInfo> remaining = paymentInfoRepository.findByUserId(user.getId());
        if (!remaining.isEmpty() && remaining.stream().noneMatch(p -> Boolean.TRUE.equals(p.getIsPrimary()))) {
            remaining.get(0).setIsPrimary(true);
            paymentInfoRepository.save(remaining.get(0));
            ensureSinglePrimary(remaining.get(0).getUser(), remaining.get(0).getId());
        }

        try {
            User dbUser = userRepository.findById(user.getId()).orElseThrow();
            syncOwnersRow(getMe(dbUser), null, null);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after payment delete: " + e.getMessage());
        }
    }

    private void ensureSinglePrimary(User user, Long keepPrimaryId) {
        List<PaymentInfo> infos = paymentInfoRepository.findByUserId(user.getId());
        for (PaymentInfo info : infos) {
            boolean shouldBePrimary = info.getId().equals(keepPrimaryId);
            if (Boolean.TRUE.equals(info.getIsPrimary()) != shouldBePrimary) {
                info.setIsPrimary(shouldBePrimary);
                paymentInfoRepository.save(info);
            }
        }
    }

    private List<AuthResponse.ProfileDTO> toProfileDTOs(List<Profile> profiles) {
        if (profiles == null) return new ArrayList<>();
        return profiles.stream()
                .map(p -> new AuthResponse.ProfileDTO(p.getId(), p.getFullName(), p.getProfileNumber()))
                .collect(Collectors.toList());
    }

    private void syncOwnersRow(User user, String oldEmailOrNull, String newPasswordOrNull) throws Exception {
        // Read all rows from Owners sheet
        List<List<Object>> rows = googleSheetsService.readSheet(SPREADSHEET_ID, OWNERS_SHEET, "A2:N");
        int rowIndex = -1;
        for (int i = 0; i < rows.size(); i++) {
            Object emailCell = rows.get(i).size() > 0 ? rows.get(i).get(0) : null;
            if (emailCell == null) continue;

            String email = emailCell.toString();
            if (oldEmailOrNull != null) {
                if (email.equalsIgnoreCase(oldEmailOrNull)) {
                    rowIndex = i;
                    break;
                }
            } else if (email.equalsIgnoreCase(user.getEmail())) {
                rowIndex = i;
                break;
            }
        }
        if (rowIndex == -1) {
            // If not found, do nothing (keep behavior aligned with AdminService warnings)
            System.err.println("[WARN] Could not find Owners sheet row for user " + (oldEmailOrNull != null ? oldEmailOrNull : user.getEmail()));
            return;
        }

        // Prepare new row data (A=email, B=password, C:L=profiles (by profileNumber), M=payment method, N=identifier)
        List<String> profileNames = new ArrayList<>();
        for (int i = 0; i < 10; i++) profileNames.add("");

        if (user.getProfiles() != null) {
            for (Profile p : user.getProfiles()) {
                if (p == null) continue;
                String name = p.getFullName() != null ? p.getFullName() : "";

                Integer n = p.getProfileNumber();
                if (n != null && n >= 1 && n <= 10) {
                    profileNames.set(n - 1, name);
                } else {
                    // Fallback: place into first available slot
                    for (int i = 0; i < profileNames.size(); i++) {
                        if (profileNames.get(i).isEmpty()) {
                            profileNames.set(i, name);
                            break;
                        }
                    }
                }
            }
        }

        String paymentMethod = "";
        String identifier = "";
        if (user.getPaymentInfos() != null && !user.getPaymentInfos().isEmpty()) {
            PaymentInfo primary = user.getPaymentInfos().stream()
                    .filter(p -> Boolean.TRUE.equals(p.getIsPrimary()))
                    .findFirst()
                    .orElse(user.getPaymentInfos().get(0));
            paymentMethod = primary.getPaymentMethod() != null ? primary.getPaymentMethod().toString() : "";
            identifier = primary.getAccountIdentifier() != null ? primary.getAccountIdentifier() : "";
        }

        List<Object> newRow = new ArrayList<>();
        newRow.add(user.getEmail());
        // Preserve password from sheet unless explicitly updating it (e.g., password change)
        String sheetPassword = rows.get(rowIndex).size() > 1 ? rows.get(rowIndex).get(1).toString() : "";
        newRow.add(newPasswordOrNull != null ? newPasswordOrNull : sheetPassword);
        newRow.addAll(profileNames);
        newRow.add(paymentMethod);
        newRow.add(identifier);

        List<List<Object>> values = java.util.Collections.singletonList(newRow);
        // Google Sheets rows are 1-based, header is row 1, so A2 is rowIndex+2
        String range = "A" + (rowIndex + 2) + ":N" + (rowIndex + 2);
        googleSheetsService.updateSheet(SPREADSHEET_ID, OWNERS_SHEET, range, values);
    }
}
