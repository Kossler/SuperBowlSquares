package com.superbowl.squares.controller;

import com.superbowl.squares.dto.ClaimSquareRequest;
import com.superbowl.squares.model.Square;
import com.superbowl.squares.service.SquareService;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/squares")
public class SquareController {

    private static final Logger logger = LoggerFactory.getLogger(SquareController.class);

    @Autowired
    private SquareService squareService;


    @GetMapping("/pool/{poolId}")
    public ResponseEntity<List<Square>> getSquaresByPool(@PathVariable Long poolId) {
        logger.info("[getSquaresByPool] poolId received: {}", poolId);
        List<Square> squares = squareService.getSquaresByPool(poolId);
        logger.info("[getSquaresByPool] squares found: {}", squares.size());
        return ResponseEntity.ok(squares);
    }

    @PostMapping("/claim")
    public ResponseEntity<Square> claimSquare(@Valid @RequestBody ClaimSquareRequest request) {
        Square square = squareService.claimSquare(request);
        return ResponseEntity.ok(square);
    }

    @DeleteMapping("/pool/{poolId}/{rowPosition}/{colPosition}")
    public ResponseEntity<Square> unclaimSquare(
            @PathVariable Long poolId,
            @PathVariable Integer rowPosition,
            @PathVariable Integer colPosition) {
        Square square = squareService.unclaimSquare(poolId, rowPosition, colPosition);
        return ResponseEntity.ok(square);
    }


    @GetMapping("/pool/{poolId}/stats")
    public ResponseEntity<Map<String, Object>> getPoolStats(@PathVariable Long poolId) {
        logger.info("[getPoolStats] poolId received: {}", poolId);
        long claimedCount = squareService.getClaimedCount(poolId);
        logger.info("[getPoolStats] claimedCount: {}", claimedCount);
        Map<String, Object> stats = new HashMap<>();
        stats.put("claimedCount", claimedCount);
        stats.put("availableCount", 100 - claimedCount);
        return ResponseEntity.ok(stats);
    }
}
