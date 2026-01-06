-- Super Bowl Squares Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS superbowl_squares;
USE superbowl_squares;

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS winners;
DROP TABLE IF EXISTS game_scores;
DROP TABLE IF EXISTS squares;
DROP TABLE IF EXISTS pools;
DROP TABLE IF EXISTS payment_info;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

-- Users table (accounts)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pools (5A, 10A, 5B, 10B, 25A, etc.)
CREATE TABLE pools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pool_name VARCHAR(50) NOT NULL UNIQUE,
    bet_amount DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pool_name (pool_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Squares (100 squares per pool in 10x10 grid)
CREATE TABLE squares (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pool_id BIGINT NOT NULL,
    row_position INT NOT NULL CHECK (row_position BETWEEN 0 AND 9),
    col_position INT NOT NULL CHECK (col_position BETWEEN 0 AND 9),
    user_id BIGINT,
    player_name VARCHAR(255),
    claimed_at TIMESTAMP NULL,
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_pool_position (pool_id, row_position, col_position),
    INDEX idx_pool_id (pool_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
