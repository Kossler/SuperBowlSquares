package com.superbowl.squares.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class SignupRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @Size(max = 9, message = "Maximum 9 profiles allowed")
    private List<ProfileDTO> profiles;
    
    private PaymentInfoDTO paymentInfo;
    
    @Data
    public static class ProfileDTO {
        @NotBlank(message = "Profile name is required")
        private String fullName;
    }
    
    @Data
    public static class PaymentInfoDTO {
        @NotBlank(message = "Payment method is required")
        private String paymentMethod;
        
        @NotBlank(message = "Account identifier is required")
        private String accountIdentifier;
    }
}
