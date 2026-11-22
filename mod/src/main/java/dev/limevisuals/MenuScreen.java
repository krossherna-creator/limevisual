package dev.limevisuals;

import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.text.Text;

public class MenuScreen extends Screen {
    private static final int W = 360, ROW = 24;
    public MenuScreen() { super(Text.literal("LimeVisuals")); }

    private int left() { return (width - W) / 2; }
    private int top() { return 70; }

    @Override
    public void render(DrawContext ctx, int mx, int my, float delta) {
        ctx.fill(0, 0, width, height, 0x99060510);
        int a = Modules.theme.accent, x = left(), y = top();
        ctx.drawCenteredTextWithShadow(textRenderer, Modules.theme.title, width / 2, 30, a);
        int h = 40 + (Modules.ALL.size() + 1) * ROW;
        ctx.fill(x, y, x + W, y + h, 0xE60E0C18);
        ctx.fill(x, y, x + W, y + 2, a);
        int ry = y + 14;
        // строка выбора темы
        ctx.drawTextWithShadow(textRenderer, "Тема", x + 14, ry + 6, 0xFFFFFFFF);
        ctx.drawTextWithShadow(textRenderer, Modules.theme.name() + " ›", x + W - 14 - textRenderer.getWidth(Modules.theme.name() + " ›"), ry + 6, a);
        ry += ROW;
        for (Module m : Modules.ALL) {
            ctx.drawTextWithShadow(textRenderer, m.name, x + 14, ry + 6, m.enabled ? 0xFFFFFFFF : 0xFF858A70);
            int sx = x + W - 14 - 30;
            ctx.fill(sx, ry + 4, sx + 30, ry + 18, m.enabled ? a : 0xFF2A2640);
            int kx = m.enabled ? sx + 18 : sx + 2;
            ctx.fill(kx, ry + 6, kx + 10, ry + 16, m.enabled ? Modules.theme.onAccent : 0xFFAAA5C4);
            ry += ROW;
        }
        super.render(ctx, mx, my, delta);
    }

    @Override
    public boolean mouseClicked(double mx, double my, int button) {
        int x = left(), ry = top() + 14;
        if (mx >= x && mx <= x + W) {
            if (my >= ry && my < ry + ROW) { Modules.theme = Modules.theme.next(); return true; }
            ry += ROW;
            for (Module m : Modules.ALL) {
                if (my >= ry && my < ry + ROW) { m.enabled = !m.enabled; return true; }
                ry += ROW;
            }
        }
        return super.mouseClicked(mx, my, button);
    }

    @Override public boolean shouldPause() { return false; }
}
