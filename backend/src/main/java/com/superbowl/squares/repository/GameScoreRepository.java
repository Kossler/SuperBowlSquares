package com.superbowl.squares.repository;

import com.superbowl.squares.model.GameScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, Long> {
    Optional<GameScore> findByGameNameAndQuarter(String gameName, GameScore.Quarter quarter);
}
