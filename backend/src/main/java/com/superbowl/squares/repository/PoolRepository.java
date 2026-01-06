package com.superbowl.squares.repository;

import com.superbowl.squares.model.Pool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PoolRepository extends JpaRepository<Pool, Long> {
    List<Pool> findByIsActiveTrue();
    Optional<Pool> findByPoolName(String poolName);
    boolean existsByPoolName(String poolName);
}
