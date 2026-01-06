package com.superbowl.squares.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "winners")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Winner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pool_id", nullable = false)
    @JsonIgnore
    private Pool pool;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "square_id", nullable = false)
    private Square square;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuarterType quarter;

    @Column(name = "payout_amount", nullable = false)
    private BigDecimal payoutAmount;

    @Column(name = "afc_score", nullable = false)
    private Integer afcScore;

    @Column(name = "nfc_score", nullable = false)
    private Integer nfcScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum QuarterType {
        Q1, Q2, Q3, FINAL
    }
}
