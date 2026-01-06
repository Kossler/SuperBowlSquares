package com.superbowl.squares.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "squares", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"pool_id", "row_position", "col_position"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Square {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pool_id", nullable = false)
    @JsonIgnore
    private Pool pool;

    @Column(name = "row_position", nullable = false)
    private Integer rowPosition;

    @Column(name = "col_position", nullable = false)
    private Integer colPosition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    private Profile profile;

    @Column(name = "profile_name")
    private String profileName;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Transient
    public boolean isAvailable() {
        return profile == null;
    }
}
