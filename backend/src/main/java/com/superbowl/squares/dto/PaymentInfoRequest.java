package com.superbowl.squares.dto;

import com.superbowl.squares.model.PaymentInfo;
import lombok.Data;

@Data
public class PaymentInfoRequest {
    private PaymentInfo.PaymentMethod paymentMethod;
    private String accountIdentifier;
    private Boolean isPrimary;
}
