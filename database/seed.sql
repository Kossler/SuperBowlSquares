
USE railway;

DELETE FROM squares;
DELETE FROM pools;
DELETE FROM users;

-- Create sample pools
INSERT INTO pools (pool_name, bet_amount) VALUES
('5A', 5.00),
('10A', 10.00),
('5B', 5.00),
('10B', 10.00),
('25A', 25.00);

-- Initialize 100 squares for each pool (10x10 grid)
DELIMITER $$

CREATE PROCEDURE initialize_pool_squares()
BEGIN
    DECLARE pool_id_val BIGINT;
    DECLARE row_val INT;
    DECLARE col_val INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE pool_cursor CURSOR FOR SELECT id FROM pools;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN pool_cursor;

    pool_loop: LOOP
        FETCH pool_cursor INTO pool_id_val;
        IF done THEN
            LEAVE pool_loop;
        END IF;

        SET row_val = 0;
        WHILE row_val < 10 DO
            SET col_val = 0;
            WHILE col_val < 10 DO
                INSERT INTO squares (pool_id, row_position, col_position)
                VALUES (pool_id_val, row_val, col_val);
                SET col_val = col_val + 1;
            END WHILE;
            SET row_val = row_val + 1;
        END WHILE;
    END LOOP;

    CLOSE pool_cursor;
END$$

DELIMITER ;

-- Execute the procedure
CALL initialize_pool_squares();

-- Clean up the procedure
DROP PROCEDURE initialize_pool_squares;
