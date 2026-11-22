package dev.limevisuals;

import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.multiplayer.MultiplayerScreen;
import net.minecraft.client.gui.screen.option.OptionsScreen;
import net.minecraft.client.gui.screen.world.SelectWorldScreen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;

public class LimeTitleScreen extends Screen {
    // Default, Sunset, Midnight, Jungle, Ocean, Custom: {верх, низ}
    private static final String[] NAMES = {"Default", "Sunset", "Midnight", "Jungle", "Ocean", "Custom"};
    private static final int[][] BG = {
        {0xFFF7B64E, 0xFFC98A3A}, {0xFF5B3CC4, 0xFFFFD36A}, {0xFF050620, 0xFF3A1F8A},
        {0xFF3A8F3A, 0xFF9BD35A}, {0xFF3A6DF0, 0xFFE8FBFF}, {0xFF6A8AFF, 0xFFFFFFFF}};

    public LimeTitleScreen() { super(Text.literal("LimeVisuals")); }

    @Override
    protected void init() {
        int w = 260, x = (width - w) / 2, y = height / 2 - 20;
        addDrawableChild(ButtonWidget.builder(Text.literal("SINGLEPLAYER"), b -> client.setScreen(new SelectWorldScreen(this))).dimensions(x, y, w, 22).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("MULTIPLAYER"), b -> client.setScreen(new MultiplayerScreen(this))).dimensions(x, y + 26, w, 22).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("OPTIONS"), b -> client.setScreen(new OptionsScreen(this, client.options))).dimensions(x, y + 52, w / 2 - 2, 22).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("EXIT"), b -> client.scheduleStop()).dimensions(x + w / 2 + 2, y + 52, w / 2 - 2, 22).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("Background: " + NAMES[Modules.bg]), b -> {
            Modules.bg = (Modules.bg + 1) % NAMES.length;
            b.setMessage(Text.literal("Background: " + NAMES[Modules.bg]));
        }).dimensions(x, y + 84, w, 20).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("Theme: " + Modules.theme.name()), b -> {
            Modules.theme = Modules.theme.next();
            b.setMessage(Text.literal("Theme: " + Modules.theme.name()));
        }).dimensions(x, y + 108, w, 20).build());
    }

    @Override
    public void renderBackground(DrawContext ctx, int mx, int my, float d) {
        ctx.fillGradient(0, 0, width, height, BG[Modules.bg][0], BG[Modules.bg][1]);
    }

    @Override
    public void render(DrawContext ctx, int mx, int my, float d) {
        super.render(ctx, mx, my, d);
        String name = client.getSession().getUsername();
        ctx.drawCenteredTextWithShadow(textRenderer, "Welcome back, " + name, width / 2, height / 2 - 50, 0xFFFFFFFF);
        ctx.drawCenteredTextWithShadow(textRenderer, Modules.theme.title, width / 2, height / 2 - 75, Modules.theme.accent);
    }

    @Override public boolean shouldCloseOnEsc() { return false; }
}
