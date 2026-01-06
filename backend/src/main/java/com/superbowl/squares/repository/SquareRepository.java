package com.superbowl.squares.repository;

import com.superbowl.squares.model.Square;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SquareRepository extends JpaRepository<Square, Long> {
    List<Square> findByPoolId(Long poolId);
    List<Square> findByPoolIdAndProfileIdIsNull(Long poolId);
    Optional<Square> findByPoolIdAndRowPositionAndColPosition(Long poolId, Integer rowPosition, Integer colPosition);
    List<Square> findByPoolIdAndRowPositionAndColPosition(Long poolId, int rowPosition, int colPosition);
    long countByPoolIdAndProfileIdIsNotNull(Long poolId);
    void deleteByPoolId(Long poolId);
}
