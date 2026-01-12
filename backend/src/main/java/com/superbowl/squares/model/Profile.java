package com.superbowl.squares.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "profiles", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "profile_number"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "full_name", nullable = false)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private String fullName;

    @Column(name = "profile_number", nullable = false)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private Integer profileNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonView(com.superbowl.squares.view.View.Detail.class)
    private LocalDateTime createdAt;
}
