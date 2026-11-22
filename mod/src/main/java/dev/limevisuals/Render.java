package dev.limevisuals;

import net.fabricmc.fabric.api.client.rendering.v1.WorldRenderContext;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexRendering;
import net.minecraft.entity.Entity;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.Vec3d;

public final class Render {
    private Render() {}

    public static void world(WorldRenderContext ctx) {
        MinecraftClient mc = MinecraftClient.getInstance();
        if (mc.world == null || mc.player == null || ctx.consumers() == null) return;
        Vec3d cam = ctx.camera().getPos();
        int c = Modules.theme.accent;
        float r = (c >> 16 & 255) / 255f, g = (c >> 8 & 255) / 255f, b = (c & 255) / 255f;
        VertexConsumer lines = ctx.consumers().getBuffer(RenderLayer.getLines());
        var ms = ctx.matrixStack();

        if (Modules.BLOCK_OVERLAY.enabled && mc.crosshairTarget instanceof BlockHitResult bh && bh.getType() == HitResult.Type.BLOCK) {
            Box box = new Box(bh.getBlockPos()).expand(0.003).offset(-cam.x, -cam.y, -cam.z);
            VertexRendering.drawBox(ms, lines, box, r, g, b, 1f);
        }
        if (Modules.HITBOX.enabled) {
            for (Entity e : mc.world.getEntities()) {
                if (e == mc.player || e.squaredDistanceTo(mc.player) > 24 * 24) continue;
                VertexRendering.drawBox(ms, lines, e.getBoundingBox().offset(-cam.x, -cam.y, -cam.z), r, g, b, 1f);
            }
        }
    }
}
