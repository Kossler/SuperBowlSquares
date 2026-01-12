package com.superbowl.squares.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String email;
    private String password;
}
