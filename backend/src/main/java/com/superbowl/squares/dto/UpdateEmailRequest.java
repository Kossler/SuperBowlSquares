package com.superbowl.squares.dto;

import lombok.Data;

@Data
public class UpdateEmailRequest {
    private String newEmail;
    private String currentPassword;
}
