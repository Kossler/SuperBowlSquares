package com.superbowl.squares.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private boolean isAdmin;
    private List<ProfileDTO> profiles;
    
    @Data
    @AllArgsConstructor
    public static class ProfileDTO {
        private Long id;
        private String fullName;
        private Integer profileNumber;
    }
}
