package com.superbowl.squares.controller;

import com.superbowl.squares.google.GoogleSheetsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sheets")
public class GoogleSheetsController {
            // GET /api/sheets/{spreadsheetId}/{poolName}/nfc-scores
            @GetMapping("/{spreadsheetId}/{poolName}/nfc-scores")
            public ResponseEntity<?> getNfcScores(
                    @PathVariable String spreadsheetId,
                    @PathVariable String poolName
            ) {
                logger.debug("[getNfcScores] spreadsheetId={}, poolName={}", spreadsheetId, poolName);
                try {
                    List<List<Object>> scores = googleSheetsService.readSheet(spreadsheetId, poolName, "A6:D15");
                    logger.debug("[getNfcScores] Retrieved NFC scores: rows={}", scores == null ? 0 : scores.size());
                    return ResponseEntity.ok(scores);
                } catch (Exception e) {
                    logger.error("[getNfcScores] Exception occurred: ", e);
                    return ResponseEntity.status(500).body("Failed to fetch NFC scores: " + e.getMessage());
                }
            }
        // GET /api/sheets/{spreadsheetId}/{poolName}/afc-scores
        @GetMapping("/{spreadsheetId}/{poolName}/afc-scores")
        public ResponseEntity<?> getAfcScores(
                @PathVariable String spreadsheetId,
                @PathVariable String poolName
        ) {
            logger.debug("[getAfcScores] spreadsheetId={}, poolName={}", spreadsheetId, poolName);
            try {
                List<List<Object>> scores = googleSheetsService.readSheet(spreadsheetId, poolName, "F1:O4");
                logger.debug("[getAfcScores] Retrieved AFC scores: rows={}", scores == null ? 0 : scores.size());
                return ResponseEntity.ok(scores);
            } catch (Exception e) {
                logger.error("[getAfcScores] Exception occurred: ", e);
                return ResponseEntity.status(500).body("Failed to fetch AFC scores: " + e.getMessage());
            }
        }
    private static final Logger logger = LoggerFactory.getLogger(GoogleSheetsController.class);
    @Autowired
    private GoogleSheetsService googleSheetsService;

    // POST /api/sheets/{spreadsheetId}/{poolName}/cell
    @PostMapping("/{spreadsheetId}/{poolName}/cell")
    public ResponseEntity<?> updatePoolCell(
            @PathVariable String spreadsheetId,
            @PathVariable String poolName,
            @RequestParam int row,
            @RequestParam int col,
            @RequestParam String value
    ) {
        logger.info("[updatePoolCell] spreadsheetId={}, poolName={}, row={}, col={}", spreadsheetId, poolName, row, col);
        try {
            googleSheetsService.updateCell(spreadsheetId, poolName, row, col, value);
            logger.info("[updatePoolCell] Cell updated successfully");
            return ResponseEntity.ok("Cell updated successfully");
        } catch (Exception e) {
            logger.error("[updatePoolCell] Exception occurred: ", e);
            return ResponseEntity.status(500).body("Failed to update cell: " + e.getMessage());
        }
    }

    // POST /api/sheets/{spreadsheetId}/{poolName}/grid
    @PostMapping("/{spreadsheetId}/{poolName}/grid")
    public ResponseEntity<?> updatePoolGrid(
            @PathVariable String spreadsheetId,
            @PathVariable String poolName,
            @RequestBody List<List<Object>> grid
    ) {
        logger.info("[updatePoolGrid] spreadsheetId={}, poolName={}", spreadsheetId, poolName);
        logger.debug("[updatePoolGrid] Received grid: rows={}", grid == null ? 0 : grid.size());
        try {
            if (grid == null || grid.size() != 10 || grid.stream().anyMatch(row -> row.size() != 10)) {
                logger.warn("[updatePoolGrid] Invalid grid size: {}x{}", grid == null ? 0 : grid.size(), (grid != null && !grid.isEmpty()) ? grid.get(0).size() : 0);
                return ResponseEntity.badRequest().body("Grid must be 10x10");
            }
            googleSheetsService.updateSheet(spreadsheetId, poolName, "F6:O15", grid);
            logger.info("[updatePoolGrid] Grid updated successfully");
            return ResponseEntity.ok("Grid updated successfully");
        } catch (Exception e) {
            logger.error("[updatePoolGrid] Exception occurred: ", e);
            return ResponseEntity.status(500).body("Failed to update grid: " + e.getMessage());
        }
    }
}
