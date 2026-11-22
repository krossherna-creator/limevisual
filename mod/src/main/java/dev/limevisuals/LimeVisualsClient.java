package dev.limevisuals;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import net.fabricmc.fabric.api.event.player.AttackEntityCallback;
import net.fabricmc.fabric.api.client.rendering.v1.WorldRenderEvents;
import net.minecraft.client.gui.screen.TitleScreen;
import net.minecraft.sound.SoundEvents;
import net.minecraft.client.sound.PositionedSoundInstance;
import net.minecraft.util.ActionResult;
import org.lwjgl.glfw.GLFW;

public class LimeVisualsClient implements ClientModInitializer {
    private static KeyBinding menuKey;

    @Override
    public void onInitializeClient() {
        menuKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
            "key.limevisuals.menu", InputUtil.Type.KEYSYM, GLFW.GLFW_KEY_RIGHT_SHIFT, "key.category.limevisuals"));
        ClientTickEvents.END_CLIENT_TICK.register(mc -> {
            while (menuKey.wasPressed()) {
                if (mc.currentScreen == null) mc.setScreen(new MenuScreen());
            }
            if (mc.currentScreen != null && mc.currentScreen.getClass() == TitleScreen.class) mc.setScreen(new LimeTitleScreen());
        });
        HudRenderCallback.EVENT.register((ctx, tick) -> Hud.render(ctx));
        WorldRenderEvents.AFTER_ENTITIES.register(Render::world);
        AttackEntityCallback.EVENT.register((p, w, h, e, hit) -> {
            if (w.isClient && Modules.HIT_SOUNDS.enabled)
                net.minecraft.client.MinecraftClient.getInstance().getSoundManager().play(PositionedSoundInstance.master(SoundEvents.ENTITY_EXPERIENCE_ORB_PICKUP, 1.2f));
            return ActionResult.PASS;
        });
    }
}
