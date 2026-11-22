package dev.limevisuals;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.network.PlayerListEntry;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.util.math.BlockPos;

public final class Hud {
    private Hud() {}

    public static void render(DrawContext ctx) {
        MinecraftClient mc = MinecraftClient.getInstance();
        if (mc.player == null || mc.options.hudHidden) return;
        var tr = mc.textRenderer;
        int a = Modules.theme.accent;

        if (Modules.WATERMARK.enabled) {
            PlayerListEntry e = mc.getNetworkHandler() == null ? null : mc.getNetworkHandler().getPlayerListEntry(mc.player.getUuid());
            String ping = e == null ? "—" : e.getLatency() + " ms";
            String text = Modules.theme.title.toLowerCase() + "  |  " + ping + "  |  " + mc.getCurrentFps() + " FPS";
            int w = tr.getWidth(text) + 16, x = (ctx.getScaledWindowWidth() - w) / 2, y = 8;
            ctx.fill(x, y, x + w, y + 18, 0xD00E0C18);
            ctx.fill(x, y + 17, x + w, y + 18, a); // акцентная линия снизу
            ctx.drawTextWithShadow(tr, text, x + 8, y + 5, 0xFFFFFFFF);
        }
        if (Modules.POTIONS.enabled) {
            int y = 40, x = ctx.getScaledWindowWidth() - 150;
            for (StatusEffectInstance ef : mc.player.getStatusEffects()) {
                int s = ef.getDuration() / 20;
                String name = ef.getEffectType().value().getName().getString() + " " + (ef.getAmplifier() + 1);
                ctx.fill(x, y, x + 140, y + 24, 0xD00E0C18);
                ctx.fill(x, y, x + 2, y + 24, a);
                ctx.drawTextWithShadow(tr, name, x + 8, y + 3, 0xFFFFFFFF);
                ctx.drawTextWithShadow(tr, String.format("%02d:%02d", s / 60, s % 60), x + 8, y + 13, 0xFFA9A4C4);
                y += 28;
            }
        }
        if (Modules.COORDS.enabled) {
            BlockPos p = mc.player.getBlockPos();
            ctx.drawTextWithShadow(tr, "XYZ " + p.getX() + " " + p.getY() + " " + p.getZ(), 8, 8, a);
        }
    }
}
