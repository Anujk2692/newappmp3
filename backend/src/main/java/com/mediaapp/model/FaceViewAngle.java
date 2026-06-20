package com.mediaapp.model;

/** AI-detected face viewing angle for multi-angle recognition. */
public enum FaceViewAngle {
    FRONT,
    LEFT,
    RIGHT,
    PARTIAL,
    UNKNOWN;

    public static FaceViewAngle fromHint(String hint) {
        if (hint == null || hint.isBlank() || "AUTO".equalsIgnoreCase(hint)) {
            return UNKNOWN;
        }
        try {
            return FaceViewAngle.valueOf(hint.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return UNKNOWN;
        }
    }

    public String label() {
        return switch (this) {
            case FRONT -> "Front";
            case LEFT -> "Left side";
            case RIGHT -> "Right side";
            case PARTIAL -> "Partial view";
            case UNKNOWN -> "Any angle";
        };
    }
}
