package com.superbowl.squares.service;

import com.superbowl.squares.dto.CreatePoolRequest;
import com.superbowl.squares.model.Pool;
import com.superbowl.squares.model.Square;
import com.superbowl.squares.repository.PoolRepository;
import com.superbowl.squares.repository.SquareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PoolService {

    @Autowired
    private PoolRepository poolRepository;

    @Autowired
    private SquareRepository squareRepository;

    public List<Pool> getActivePools() {
        return poolRepository.findByIsActiveTrue();
    }

    @SuppressWarnings("null")
    public Pool getPoolById(Long id) {
        return poolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pool not found"));
    }

    @Transactional
    public Pool createPool(CreatePoolRequest request) {
        if (poolRepository.existsByPoolName(request.getPoolName())) {
            throw new RuntimeException("Pool with this name already exists");
        }

        Pool pool = new Pool();
        pool.setPoolName(request.getPoolName());
        pool.setBetAmount(request.getBetAmount());
        pool.setIsActive(true);

        pool = poolRepository.save(pool);

        for (int row = 0; row < 10; row++) {
            for (int col = 0; col < 10; col++) {
                Square square = new Square();
                square.setPool(pool);
                square.setRowPosition(row);
                square.setColPosition(col);
                squareRepository.save(square);
            }
        }

        return pool;
    }

    public List<Pool> getAllPools() {
        return poolRepository.findAll();
    }

    @Transactional
    public Pool togglePoolStatus(Long poolId) {
        Pool pool = getPoolById(poolId);
        pool.setIsActive(!pool.getIsActive());
        return poolRepository.save(pool);
    }

    @Transactional
    public Pool updatePool(Long poolId, CreatePoolRequest request) {
        Pool pool = getPoolById(poolId);
        pool.setPoolName(request.getPoolName());
        pool.setBetAmount(request.getBetAmount());
        return poolRepository.save(pool);
    }

    @Transactional
    public void deletePool(Long poolId) {
        Pool pool = getPoolById(poolId);
        squareRepository.deleteByPoolId(pool.getId());
        poolRepository.delete(pool);
    }
}
