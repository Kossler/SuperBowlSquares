package com.superbowl.squares.repository;

import com.superbowl.squares.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    List<Profile> findByUserId(Long userId);
    long countByUserId(Long userId);
    boolean existsByFullNameIgnoreCase(String fullName);
}
