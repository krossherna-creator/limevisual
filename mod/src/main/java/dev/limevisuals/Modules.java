package dev.limevisuals;

import java.util.List;

public final class Modules {
    public static Theme theme = Theme.LIME;
    public static final Module WATERMARK = new Module("Watermark", "HUD", true);
    public static final Module POTIONS   = new Module("Potions", "HUD", true);
    public static final Module COORDS    = new Module("Coordinates", "HUD", false);
    public static final Module BLOCK_OVERLAY = new Module("Block Overlay", "Visuals", true);
    public static final Module HITBOX = new Module("Hitbox Customizer", "Visuals", false);
    public static final Module HIT_SOUNDS = new Module("Hit Sounds", "Visuals", true);
    public static final List<Module> ALL = List.of(WATERMARK, POTIONS, COORDS, BLOCK_OVERLAY, HITBOX, HIT_SOUNDS);
    public static int bg = 0;
    private Modules() {}
}
