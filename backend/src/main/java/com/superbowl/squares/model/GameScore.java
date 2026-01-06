package com.superbowl.squares.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_scores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"game_name", "quarter"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_name", nullable = false)
    private String gameName = "Super Bowl";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Quarter quarter;

    @Column(name = "afc_score", nullable = false)
    private Integer afcScore = 0;

    @Column(name = "nfc_score", nullable = false)
    private Integer nfcScore = 0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Quarter {
        Q1, Q2, Q3, Q4, FINAL
    }
}
