import { test, expect } from '@playwright/test';

test('Christmas Theme extension loads and injects snow container', async ({ page }) => {
    try {
        await page.goto('/');
    } catch (e) {
        console.log("ComfyUI not running at localhost:8188, skipping navigation test.");
        test.skip();
        return;
    }

    // Wait for ComfyUI
    await expect(page).toHaveTitle(/ComfyUI/);

    // Check for the snow container injected by aether-snow.ts
    const snowContainer = page.locator('#comfy-aether-snow');
    // It might be hidden if disabled, but it should be attached to DOM
    await expect(snowContainer).toBeAttached({ timeout: 10000 });
});
