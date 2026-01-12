package com.superbowl.squares.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInfo {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private PaymentMethod paymentMethod;

    @Column(name = "account_identifier", nullable = false)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private String accountIdentifier;

    @Column(name = "is_primary", nullable = false)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private Boolean isPrimary = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private LocalDateTime updatedAt;

    public enum PaymentMethod {
        Venmo, CashApp, Zelle, PayPal
    }
}
