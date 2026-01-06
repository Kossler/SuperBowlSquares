package com.superbowl.squares.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePoolRequest {
    
    @NotBlank(message = "Pool name is required")
    private String poolName;
    
    @NotNull(message = "Bet amount is required")
    @Positive(message = "Bet amount must be positive")
    private BigDecimal betAmount;
    
}
