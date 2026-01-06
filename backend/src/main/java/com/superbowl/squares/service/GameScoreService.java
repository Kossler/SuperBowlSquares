package com.superbowl.squares.service;

import com.superbowl.squares.dto.UpdateScoreRequest;
import com.superbowl.squares.model.GameScore;
import com.superbowl.squares.repository.GameScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GameScoreService {

    @Autowired
    private GameScoreRepository gameScoreRepository;

    public List<GameScore> getAllScores() {
        return gameScoreRepository.findAll();
    }

    public GameScore getScore(String gameName, GameScore.Quarter quarter) {
        return gameScoreRepository.findByGameNameAndQuarter(gameName, quarter)
                .orElseThrow(() -> new RuntimeException("Score not found"));
    }

    @Transactional
    public GameScore updateScore(UpdateScoreRequest request) {
        GameScore.Quarter quarter;
        try {
            quarter = GameScore.Quarter.valueOf(request.getQuarter());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid quarter: " + request.getQuarter());
        }

        GameScore gameScore = gameScoreRepository.findByGameNameAndQuarter(request.getGameName(), quarter)
                .orElse(new GameScore());

        gameScore.setGameName(request.getGameName());
        gameScore.setQuarter(quarter);
        gameScore.setAfcScore(request.getAfcScore());
        gameScore.setNfcScore(request.getNfcScore());

        return gameScoreRepository.save(gameScore);
    }
}
