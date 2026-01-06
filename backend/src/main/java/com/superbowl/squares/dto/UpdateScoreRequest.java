package com.superbowl.squares.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateScoreRequest {
    
    @NotBlank(message = "Game name is required")
    private String gameName;
    
    @NotBlank(message = "Quarter is required")
    private String quarter;
    
    @NotNull(message = "AFC score is required")
    @Min(value = 0, message = "Score cannot be negative")
    @Max(value = 999, message = "Score too high")
    private Integer afcScore;
    
    @NotNull(message = "NFC score is required")
    @Min(value = 0, message = "Score cannot be negative")
    @Max(value = 999, message = "Score too high")
    private Integer nfcScore;
}
