package com.superbowl.squares.service;

import com.superbowl.squares.dto.PaymentInfoRequest;
import com.superbowl.squares.dto.ProfileRequest;
import com.superbowl.squares.dto.UpdateUserRequest;
import com.superbowl.squares.model.PaymentInfo;
import com.superbowl.squares.model.Profile;
import com.superbowl.squares.model.User;
import com.superbowl.squares.model.Winner;
import com.superbowl.squares.repository.PaymentInfoRepository;
import com.superbowl.squares.repository.ProfileRepository;
import com.superbowl.squares.repository.UserRepository;
import com.superbowl.squares.repository.WinnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {
    // Return all profiles with user email for admin assignment
    public List<Map<String, Object>> getAllProfilesWithUserEmail() {
        List<Profile> profiles = profileRepository.findAll();
        return profiles.stream().map(profile -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", profile.getId());
            map.put("fullName", profile.getFullName());
            map.put("profileNumber", profile.getProfileNumber());
            map.put("userEmail", profile.getUser() != null ? profile.getUser().getEmail() : null);
            return map;
        }).collect(Collectors.toList());
    }

    @Autowired
    private WinnerRepository winnerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private PaymentInfoRepository paymentInfoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.superbowl.squares.google.GoogleSheetsService googleSheetsService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @SuppressWarnings("null")
    public User makeUserAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsAdmin(true);
        return userRepository.save(user);
    }

    @SuppressWarnings("null")
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @SuppressWarnings("null")
    public User updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String oldEmail = user.getEmail();
        boolean emailChanged = false;

        if (StringUtils.hasText(request.getEmail())) {
            user.setEmail(request.getEmail());
            emailChanged = true;
        }

        if (StringUtils.hasText(request.getPassword())) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);

        // --- Google Sheets Owners sync ---
        try {
            // Constants (should match AuthService)
            final String SPREADSHEET_ID = "1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk";
            final String OWNERS_SHEET = "Owners";

            // Read all rows from Owners sheet
            java.util.List<java.util.List<Object>> rows = googleSheetsService.readSheet(SPREADSHEET_ID, OWNERS_SHEET, "A2:N");
            int rowIndex = -1;
            for (int i = 0; i < rows.size(); i++) {
                Object emailCell = rows.get(i).size() > 0 ? rows.get(i).get(0) : null;
                if (emailCell != null && (
                        (emailChanged && emailCell.toString().equalsIgnoreCase(oldEmail)) ||
                        (!emailChanged && emailCell.toString().equalsIgnoreCase(updatedUser.getEmail()))
                    )) {
                    rowIndex = i;
                    break;
                }
            }
            if (rowIndex != -1) {
                // Prepare new row data (A=email, B=password, C:L=profiles, M=payment method, N=identifier)
                java.util.List<String> profileNames = new java.util.ArrayList<>();
                if (updatedUser.getProfiles() != null) {
                    for (int i = 0; i < updatedUser.getProfiles().size(); i++) {
                        profileNames.add(updatedUser.getProfiles().get(i).getFullName());
                    }
                }
                while (profileNames.size() < 10) profileNames.add("");
                String paymentMethod = "";
                String identifier = "";
                if (updatedUser.getPaymentInfos() != null && !updatedUser.getPaymentInfos().isEmpty()) {
                    var paymentInfo = updatedUser.getPaymentInfos().get(0);
                    paymentMethod = paymentInfo.getPaymentMethod() != null ? paymentInfo.getPaymentMethod().toString() : "";
                    identifier = paymentInfo.getAccountIdentifier() != null ? paymentInfo.getAccountIdentifier() : "";
                }
                java.util.List<Object> newRow = new java.util.ArrayList<>();
                newRow.add(updatedUser.getEmail());
                // Preserve password from sheet if present
                String sheetPassword = rows.get(rowIndex).size() > 1 ? rows.get(rowIndex).get(1).toString() : "";
                newRow.add(sheetPassword);
                newRow.addAll(profileNames);
                newRow.add(paymentMethod);
                newRow.add(identifier);
                java.util.List<java.util.List<Object>> values = java.util.Collections.singletonList(newRow);
                // Google Sheets rows are 1-based, header is row 1, so A2 is rowIndex+2
                String range = "A" + (rowIndex + 2) + ":N" + (rowIndex + 2);
                googleSheetsService.updateSheet(SPREADSHEET_ID, OWNERS_SHEET, range, values);
            } else {
                // If not found, optionally append (or skip)
                System.err.println("[WARN] Could not find Owners sheet row for user " + oldEmail + " (emailChanged=" + emailChanged + ")");
            }
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet: " + e.getMessage());
        }

        return updatedUser;
    }

    @SuppressWarnings("null")
    public Profile createProfile(Long userId, ProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (profileRepository.existsByFullNameIgnoreCase(request.getFullName())) {
            throw new com.superbowl.squares.exception.DuplicateProfileNameException("A profile with this full name already exists");
        }
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setFullName(request.getFullName());
        profile.setProfileNumber(request.getProfileNumber());
        Profile savedProfile = profileRepository.save(profile);

        // --- Google Sheets Owners sync ---
        try {
            // Constants (should match AuthService)
            final String SPREADSHEET_ID = "1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk";
            final String OWNERS_SHEET = "Owners";

            // Reload user and profiles to get up-to-date list
            User freshUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found after profile create"));
            java.util.List<Profile> freshProfiles = profileRepository.findByUserId(userId);
            freshUser.setProfiles(freshProfiles);

            // Read all rows from Owners sheet
            java.util.List<java.util.List<Object>> rows = googleSheetsService.readSheet(SPREADSHEET_ID, OWNERS_SHEET, "A2:N");
            int rowIndex = -1;
            for (int i = 0; i < rows.size(); i++) {
                Object emailCell = rows.get(i).size() > 0 ? rows.get(i).get(0) : null;
                if (emailCell != null && emailCell.toString().equalsIgnoreCase(freshUser.getEmail())) {
                    rowIndex = i;
                    break;
                }
            }
            if (rowIndex != -1) {
                // Prepare new row data (A=email, B=password, C:L=profiles, M=payment method, N=identifier)
                java.util.List<String> profileNames = new java.util.ArrayList<>();
                if (freshUser.getProfiles() != null) {
                    for (int i = 0; i < freshUser.getProfiles().size(); i++) {
                        profileNames.add(freshUser.getProfiles().get(i).getFullName());
                    }
                }
                while (profileNames.size() < 10) profileNames.add("");
                String paymentMethod = "";
                String identifier = "";
                if (freshUser.getPaymentInfos() != null && !freshUser.getPaymentInfos().isEmpty()) {
                    var paymentInfo = freshUser.getPaymentInfos().get(0);
                    paymentMethod = paymentInfo.getPaymentMethod() != null ? paymentInfo.getPaymentMethod().toString() : "";
                    identifier = paymentInfo.getAccountIdentifier() != null ? paymentInfo.getAccountIdentifier() : "";
                }
                java.util.List<Object> newRow = new java.util.ArrayList<>();
                newRow.add(freshUser.getEmail());
                // Preserve password from sheet if present
                String sheetPassword = rows.get(rowIndex).size() > 1 ? rows.get(rowIndex).get(1).toString() : "";
                newRow.add(sheetPassword);
                newRow.addAll(profileNames);
                newRow.add(paymentMethod);
                newRow.add(identifier);
                java.util.List<java.util.List<Object>> values = java.util.Collections.singletonList(newRow);
                // Google Sheets rows are 1-based, header is row 1, so A2 is rowIndex+2
                String range = "A" + (rowIndex + 2) + ":N" + (rowIndex + 2);
                googleSheetsService.updateSheet(SPREADSHEET_ID, OWNERS_SHEET, range, values);
            } else {
                System.err.println("[WARN] Could not find Owners sheet row for user " + freshUser.getEmail() + " during profile create");
            }
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after profile create: " + e.getMessage());
        }

        return savedProfile;
    }

    @SuppressWarnings("null")
    public Profile updateProfile(Long profileId, ProfileRequest request) {
        Profile profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new RuntimeException("Profile not found"));
        // Only check for duplicate if changing the name
        if (!profile.getFullName().equalsIgnoreCase(request.getFullName()) &&
            profileRepository.existsByFullNameIgnoreCase(request.getFullName())) {
            throw new com.superbowl.squares.exception.DuplicateProfileNameException("A profile with this full name already exists");
        }
        profile.setFullName(request.getFullName());
        profile.setProfileNumber(request.getProfileNumber());
        Profile updatedProfile = profileRepository.save(profile);

        // --- Google Sheets Owners sync ---
        try {
            // Constants (should match AuthService)
            final String SPREADSHEET_ID = "1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk";
            final String OWNERS_SHEET = "Owners";

            // Get the user for this profile
            User user = updatedProfile.getUser();
            // Read all rows from Owners sheet
            java.util.List<java.util.List<Object>> rows = googleSheetsService.readSheet(SPREADSHEET_ID, OWNERS_SHEET, "A2:N");
            int rowIndex = -1;
            for (int i = 0; i < rows.size(); i++) {
                Object emailCell = rows.get(i).size() > 0 ? rows.get(i).get(0) : null;
                if (emailCell != null && emailCell.toString().equalsIgnoreCase(user.getEmail())) {
                    rowIndex = i;
                    break;
                }
            }
            if (rowIndex != -1) {
                // Prepare new row data (A=email, B=password, C:L=profiles, M=payment method, N=identifier)
                java.util.List<String> profileNames = new java.util.ArrayList<>();
                if (user.getProfiles() != null) {
                    for (int i = 0; i < user.getProfiles().size(); i++) {
                        profileNames.add(user.getProfiles().get(i).getFullName());
                    }
                }
                while (profileNames.size() < 10) profileNames.add("");
                String paymentMethod = "";
                String identifier = "";
                if (user.getPaymentInfos() != null && !user.getPaymentInfos().isEmpty()) {
                    var paymentInfo = user.getPaymentInfos().get(0);
                    paymentMethod = paymentInfo.getPaymentMethod() != null ? paymentInfo.getPaymentMethod().toString() : "";
                    identifier = paymentInfo.getAccountIdentifier() != null ? paymentInfo.getAccountIdentifier() : "";
                }
                java.util.List<Object> newRow = new java.util.ArrayList<>();
                newRow.add(user.getEmail());
                // Preserve password from sheet if present
                String sheetPassword = rows.get(rowIndex).size() > 1 ? rows.get(rowIndex).get(1).toString() : "";
                newRow.add(sheetPassword);
                newRow.addAll(profileNames);
                newRow.add(paymentMethod);
                newRow.add(identifier);
                java.util.List<java.util.List<Object>> values = java.util.Collections.singletonList(newRow);
                // Google Sheets rows are 1-based, header is row 1, so A2 is rowIndex+2
                String range = "A" + (rowIndex + 2) + ":N" + (rowIndex + 2);
                googleSheetsService.updateSheet(SPREADSHEET_ID, OWNERS_SHEET, range, values);
            } else {
                System.err.println("[WARN] Could not find Owners sheet row for user " + user.getEmail() + " during profile update");
            }
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after profile update: " + e.getMessage());
        }

        return updatedProfile;
    }

    @SuppressWarnings("null")
    public void deleteProfile(Long profileId) {
        // Find the profile and user before deleting
        Profile profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new RuntimeException("Profile not found"));
        User user = profile.getUser();
        Long userId = user.getId();
        profileRepository.deleteById(profileId);

        // --- Google Sheets Owners sync ---
        try {
            // Constants (should match AuthService)
            final String SPREADSHEET_ID = "1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk";
            final String OWNERS_SHEET = "Owners";

            // Reload user and profiles to get up-to-date list
            User freshUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found after profile delete"));
            java.util.List<Profile> freshProfiles = profileRepository.findByUserId(userId);
            freshUser.setProfiles(freshProfiles);

            // Read all rows from Owners sheet
            java.util.List<java.util.List<Object>> rows = googleSheetsService.readSheet(SPREADSHEET_ID, OWNERS_SHEET, "A2:N");
            int rowIndex = -1;
            for (int i = 0; i < rows.size(); i++) {
                Object emailCell = rows.get(i).size() > 0 ? rows.get(i).get(0) : null;
                if (emailCell != null && emailCell.toString().equalsIgnoreCase(freshUser.getEmail())) {
                    rowIndex = i;
                    break;
                }
            }
            if (rowIndex != -1) {
                // Prepare new row data (A=email, B=password, C:L=profiles, M=payment method, N=identifier)
                java.util.List<String> profileNames = new java.util.ArrayList<>();
                if (freshUser.getProfiles() != null) {
                    for (int i = 0; i < freshUser.getProfiles().size(); i++) {
                        profileNames.add(freshUser.getProfiles().get(i).getFullName());
                    }
                }
                while (profileNames.size() < 10) profileNames.add("");
                String paymentMethod = "";
                String identifier = "";
                if (freshUser.getPaymentInfos() != null && !freshUser.getPaymentInfos().isEmpty()) {
                    var paymentInfo = freshUser.getPaymentInfos().get(0);
                    paymentMethod = paymentInfo.getPaymentMethod() != null ? paymentInfo.getPaymentMethod().toString() : "";
                    identifier = paymentInfo.getAccountIdentifier() != null ? paymentInfo.getAccountIdentifier() : "";
                }
                java.util.List<Object> newRow = new java.util.ArrayList<>();
                newRow.add(freshUser.getEmail());
                // Preserve password from sheet if present
                String sheetPassword = rows.get(rowIndex).size() > 1 ? rows.get(rowIndex).get(1).toString() : "";
                newRow.add(sheetPassword);
                newRow.addAll(profileNames);
                newRow.add(paymentMethod);
                newRow.add(identifier);
                java.util.List<java.util.List<Object>> values = java.util.Collections.singletonList(newRow);
                // Google Sheets rows are 1-based, header is row 1, so A2 is rowIndex+2
                String range = "A" + (rowIndex + 2) + ":N" + (rowIndex + 2);
                googleSheetsService.updateSheet(SPREADSHEET_ID, OWNERS_SHEET, range, values);
            } else {
                System.err.println("[WARN] Could not find Owners sheet row for user " + freshUser.getEmail() + " during profile delete");
            }
        } catch (Exception e) {
            System.err.println("[WARN] Failed to update Owners sheet after profile delete: " + e.getMessage());
        }
    }

    @SuppressWarnings("null")
    public PaymentInfo createPaymentInfo(Long userId, PaymentInfoRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        PaymentInfo paymentInfo = new PaymentInfo();
        paymentInfo.setUser(user);
        paymentInfo.setPaymentMethod(request.getPaymentMethod());
        paymentInfo.setAccountIdentifier(request.getAccountIdentifier());
        paymentInfo.setIsPrimary(request.getIsPrimary());
        return paymentInfoRepository.save(paymentInfo);
    }

    @SuppressWarnings("null")
    public PaymentInfo updatePaymentInfo(Long paymentInfoId, PaymentInfoRequest request) {
        PaymentInfo paymentInfo = paymentInfoRepository.findById(paymentInfoId)
                .orElseThrow(() -> new RuntimeException("PaymentInfo not found"));
        paymentInfo.setPaymentMethod(request.getPaymentMethod());
        paymentInfo.setAccountIdentifier(request.getAccountIdentifier());
        paymentInfo.setIsPrimary(request.getIsPrimary());
        return paymentInfoRepository.save(paymentInfo);
    }

    @SuppressWarnings("null")
    public void deletePaymentInfo(Long paymentInfoId) {
        paymentInfoRepository.deleteById(paymentInfoId);
    }

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
