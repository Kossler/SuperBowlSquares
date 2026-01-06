package com.superbowl.squares.repository;

import com.superbowl.squares.model.Winner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WinnerRepository extends JpaRepository<Winner, Long> {
    List<Winner> findByPoolId(Long poolId);
    List<Winner> findByProfileId(Long profileId);
    List<Winner> findByPoolIdAndQuarter(Long poolId, Winner.QuarterType quarter);
    Optional<Winner> findBySquareIdAndQuarter(Long squareId, Winner.QuarterType quarter);
}
