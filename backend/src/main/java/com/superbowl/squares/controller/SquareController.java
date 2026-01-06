package com.superbowl.squares.controller;

import com.superbowl.squares.dto.ClaimSquareRequest;
import com.superbowl.squares.model.Square;
import com.superbowl.squares.service.SquareService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/squares")
public class SquareController {

    @Autowired
    private SquareService squareService;

    @GetMapping("/pool/{poolId}")
    public ResponseEntity<List<Square>> getSquaresByPool(@PathVariable Long poolId) {
        return ResponseEntity.ok(squareService.getSquaresByPool(poolId));
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
        Map<String, Object> stats = new HashMap<>();
        stats.put("claimedCount", squareService.getClaimedCount(poolId));
        stats.put("availableCount", 100 - squareService.getClaimedCount(poolId));
        return ResponseEntity.ok(stats);
    }
}
