package com.superbowl.squares.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimSquareRequest {
    
    @NotNull(message = "Pool ID is required")
    private Long poolId;
    
    @NotNull(message = "Row position is required")
    private Integer rowPosition;
    
    @NotNull(message = "Column position is required")
    private Integer colPosition;
    
    @NotNull(message = "Profile ID is required")
    private Long profileId;
}
