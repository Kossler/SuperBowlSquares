package com.superbowl.squares.controller;

import com.superbowl.squares.model.Pool;
import com.superbowl.squares.service.PoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pools")
public class PoolController {

    @Autowired
    private PoolService poolService;

    @GetMapping("/active")
    public ResponseEntity<List<Pool>> getActivePools() {
        return ResponseEntity.ok(poolService.getActivePools());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pool> getPoolById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(poolService.getPoolById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
