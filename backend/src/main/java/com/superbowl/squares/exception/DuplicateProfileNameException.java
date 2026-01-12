package com.superbowl.squares.exception;

public class DuplicateProfileNameException extends RuntimeException {
    public DuplicateProfileNameException(String message) {
        super(message);
    }
}