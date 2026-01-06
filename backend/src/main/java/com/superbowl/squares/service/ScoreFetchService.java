package com.superbowl.squares.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.superbowl.squares.model.GameScore;
import com.superbowl.squares.repository.GameScoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ScoreFetchService {

    private static final Logger logger = LoggerFactory.getLogger(ScoreFetchService.class);
    private static final String ESPN_API_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

    @Autowired
    private GameScoreRepository gameScoreRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WinnerCalculationService winnerCalculationService;

    /**
     * Fetch scores every 2 minutes during game time
     * Cron: second, minute, hour, day, month, day-of-week
     */
    @Scheduled(fixedRate = 120000) // Every 2 minutes
    public void fetchAndUpdateScores() {
        try {
            logger.info("Fetching NFL scores from ESPN API...");
            String response = restTemplate.getForObject(ESPN_API_URL, String.class);
            
            if (response == null) {
                logger.warn("No response from ESPN API");
                return;
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode events = root.path("events");

            if (!events.isArray() || events.isEmpty()) {
                logger.info("No games in progress");
                return;
            }

            // Look for Super Bowl game (you can filter by name or date)
            for (JsonNode event : events) {
                String gameName = event.path("name").asText();
                JsonNode competitions = event.path("competitions");
                
                if (competitions.isArray() && !competitions.isEmpty()) {
                    JsonNode competition = competitions.get(0);
                    JsonNode competitors = competition.path("competitors");
                    
                    if (competitors.isArray() && competitors.size() == 2) {
                        // competitors[0] is usually home, competitors[1] is away
                        JsonNode homeTeam = null;
                        JsonNode awayTeam = null;
                        
                        for (JsonNode competitor : competitors) {
                            String homeAway = competitor.path("homeAway").asText();
                            if ("home".equals(homeAway)) {
                                homeTeam = competitor;
                            } else {
                                awayTeam = competitor;
                            }
                        }
                        
                        if (homeTeam != null && awayTeam != null) {
                            int homeScore = homeTeam.path("score").asInt(0);
                            int awayScore = awayTeam.path("score").asInt(0);
                            
                            String afcTeam = awayTeam.path("team").path("abbreviation").asText();
                            String nfcTeam = homeTeam.path("team").path("abbreviation").asText();
                            
                            // Get quarter info
                            JsonNode status = competition.path("status");
                            int period = status.path("period").asInt(1);
                            String displayClock = status.path("displayClock").asText("0:00");
                            boolean completed = status.path("type").path("completed").asBoolean(false);
                            
                            logger.info("Game: {} vs {} | Score: {}-{} | Period: {} | Clock: {} | Completed: {}", 
                                       afcTeam, nfcTeam, awayScore, homeScore, period, displayClock, completed);
                            
                            // Store scores at quarter boundaries
                            storeQuarterScore(awayScore, homeScore, period, displayClock, completed);
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error fetching scores from ESPN API", e);
        }
    }

    private String getPeriodLabel(int period) {
        switch (period) {
            case 1: return "Q1";
            case 2: return "Q2";
            case 3: return "Q3";
            case 4:
            case 5: // Overtime
                return "FINAL";
            default: return "Q1";
        }
    }

    /**
     * Store scores at the end of each quarter
     */
    private void storeQuarterScore(int afcScore, int nfcScore, int period, String clock, boolean completed) {
        // Determine if we should store the score based on quarter end
        String quarterToStore = null;
        
        if (period == 1 && clock.equals("0:00")) {
            // End of Q1
            quarterToStore = "Q1";
        } else if (period == 2 && (clock.equals("0:00") || period == 3)) {
            // End of Q2 (halftime) - store when Q2 ends or Q3 has started
            quarterToStore = "Q2";
        } else if (period == 3 && clock.equals("0:00")) {
            // End of Q3
            quarterToStore = "Q3";
        } else if ((period == 4 && clock.equals("0:00")) || period == 5 || completed) {
            // End of Q4 or overtime or game completed
            quarterToStore = "FINAL";
        }
        
        // Also store if we're IN the next period (quarter already ended)
        if (quarterToStore == null) {
            if (period == 2 && !gameScoreRepository.findByGameNameAndQuarter("Super Bowl", GameScore.Quarter.Q1).isPresent()) {
                quarterToStore = "Q1"; // Q1 ended, store it
            } else if (period == 3 && !gameScoreRepository.findByGameNameAndQuarter("Super Bowl", GameScore.Quarter.Q2).isPresent()) {
                quarterToStore = "Q2"; // Q2 ended, store it
            } else if (period == 4 && !gameScoreRepository.findByGameNameAndQuarter("Super Bowl", GameScore.Quarter.Q3).isPresent()) {
                quarterToStore = "Q3"; // Q3 ended, store it
            }
        }
        
        if (quarterToStore != null) {
            updateGameScore(afcScore, nfcScore, quarterToStore);
        }
    }

    private void updateGameScore(int afcScore, int nfcScore, String quarter) {
        // Get the last digit of each score
        int afcLastDigit = afcScore % 10;
        int nfcLastDigit = nfcScore % 10;
        
        // Check if score already exists for this quarter - if so, don't overwrite
        // Scores should only be set at the END of each quarter
        Optional<GameScore> existingScore = gameScoreRepository.findByGameNameAndQuarter("Super Bowl", GameScore.Quarter.valueOf(quarter));
        
        boolean isNewQuarterScore = false;
        
        if (existingScore.isPresent()) {
            GameScore gameScore = existingScore.get();
            // Only update if the score has changed (quarter ended with different score)
            if (gameScore.getAfcScore() != afcLastDigit || gameScore.getNfcScore() != nfcLastDigit) {
                gameScore.setAfcScore(afcLastDigit);
                gameScore.setNfcScore(nfcLastDigit);
                gameScore.setUpdatedAt(LocalDateTime.now());
                gameScoreRepository.save(gameScore);
                logger.info("Updated {} score: AFC {} - NFC {}", quarter, afcLastDigit, nfcLastDigit);
                isNewQuarterScore = true;
            }
        } else {
            // Create new score record for this quarter
            GameScore gameScore = new GameScore();
            gameScore.setQuarter(GameScore.Quarter.valueOf(quarter));
            gameScore.setAfcScore(afcLastDigit);
            gameScore.setNfcScore(nfcLastDigit);
            gameScoreRepository.save(gameScore);
            logger.info("Created {} score: AFC {} - NFC {}", quarter, afcLastDigit, nfcLastDigit);
            isNewQuarterScore = true;
        }
        
        // Calculate winners for this quarter if it's a new score
        if (isNewQuarterScore) {
            try {
                winnerCalculationService.calculateQuarterWinners(afcScore, nfcScore, quarter);
            } catch (Exception e) {
                logger.error("Error calculating winners for quarter {}", quarter, e);
            }
        }
    }

    /**
     * Manual refresh method that can be called from admin panel
     */
    public void manualRefresh() {
        logger.info("Manual score refresh triggered");
        fetchAndUpdateScores();
    }
}
