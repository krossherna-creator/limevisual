package dev.limevisuals;

public enum Theme {
    LIME("LimeVisuals", 0xFFA6FF00, 0xFF101A00),
    PULSE("PulseVisuals", 0xFF7C5CFF, 0xFFFFFFFF);
    public final String title; public final int accent, onAccent;
    Theme(String t, int a, int o) { title = t; accent = a; onAccent = o; }
    public Theme next() { return values()[(ordinal() + 1) % values().length]; }
}
