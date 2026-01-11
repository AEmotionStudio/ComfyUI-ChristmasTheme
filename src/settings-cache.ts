/**
 * Settings Cache - Centralized settings cache to avoid deprecated defaultValue warnings
 */

// @ts-ignore - ComfyUI external module (loaded at runtime)
import { app } from "../../scripts/app.js";

// ============================================================================
// Types
// ============================================================================

/** Setting key type for type safety */
type SettingKey = keyof typeof SETTING_DEFAULTS;

// ============================================================================
// Constants
// ============================================================================

/** Default values for all settings */
const SETTING_DEFAULTS = {
    // Christmas Effects
    "ChristmasTheme.ChristmasEffects.LightSwitch": 1,
    "ChristmasTheme.ChristmasEffects.ColorScheme": "traditional",
    "ChristmasTheme.ChristmasEffects.Twinkle": "gentle",
    "ChristmasTheme.ChristmasEffects.Thickness": 3,
    "ChristmasTheme.ChristmasEffects.GlowIntensity": 20,
    "ChristmasTheme.ChristmasEffects.Direction": 1,
    "ChristmasTheme.ChristmasEffects.BulbShape": "classic",
    "ChristmasTheme.Link Style": "spline",
    "ChristmasTheme.ChristmasEffects.CustomImage": "", // Unused for now


    // Snowflake
    "ChristmasTheme.Snowflake.Enabled": 1,
    "ChristmasTheme.Snowflake.ColorScheme": "white",
    "ChristmasTheme.Snowflake.Glow": 10,
    "ChristmasTheme.Snowflake.Type": "random",
    "ChristmasTheme.Snowflake.CustomImage": "",



    // Background
    "ChristmasTheme.Background.Enabled": true,
    "ChristmasTheme.Background.ColorTheme": "classic",


    "ChristmasTheme.Background.Stars": true,
    "ChristmasTheme.Background.PartyMode": false,
    "ChristmasTheme.Background.ShootingStars": true,
    "ChristmasTheme.Background.Fireworks": false,
    "ChristmasTheme.Background.MouseEffect": "none",
    "ChristmasTheme.Background.Countdown": false,
    "ChristmasTheme.Background.ShowFinaleButton": false,

    // Performance
    "ChristmasTheme.PauseDuringRender": true
};

/** Cache object - initialized with defaults */
const settingsCache: Record<string, unknown> = { ...SETTING_DEFAULTS };

/** Track if cache has been initialized */
let cacheInitialized = false;

// ============================================================================
// Functions
// ============================================================================

/**
 * Initialize the settings cache from stored values
 * Call this once AFTER settings are registered
 */
export function initSettingsCache(): void {
    if (cacheInitialized) return;

    // Load all known settings from storage
    Object.keys(SETTING_DEFAULTS).forEach(key => {
        loadSettingFromStorage(key);
    });

    cacheInitialized = true;
    console.log("🎄 Settings cache initialized with saved values");
}

/**
 * Load a setting value from ComfyUI after settings are registered
 * This should be called from each setting's onChange during registration
 * to capture the initial value ComfyUI loads from storage
 */
export function loadSettingFromStorage(key: string): void {
    try {
        const storedValue = app.ui.settings.getSettingValue(key);
        if (storedValue !== undefined && storedValue !== null) {
            settingsCache[key] = storedValue;
        }
    } catch {
        // Setting not available yet, keep default
    }
}

/**
 * Get a setting value from cache (no console warnings!)
 */
export function getSetting<K extends SettingKey>(key: K): typeof SETTING_DEFAULTS[K];
export function getSetting(key: string): unknown;
export function getSetting(key: string): unknown {
    return settingsCache[key] ?? (SETTING_DEFAULTS as Record<string, unknown>)[key];
}

/**
 * Update cache when setting changes
 * Call this from onChange callbacks
 */
export function updateCache(key: string, value: unknown): void {
    settingsCache[key] = value;
}

/**
 * Get all cached settings (for debugging)
 */
export function getAllSettings(): Record<string, unknown> {
    return { ...settingsCache };
}

/**
 * Get all defaults (for reference)
 */
export function getDefaults(): typeof SETTING_DEFAULTS {
    return { ...SETTING_DEFAULTS };
}

// ============================================================================
// Color Scheme Definitions
// ============================================================================

/** Color scheme definitions (shared across modules) */
export const COLOR_SCHEMES: Record<string, string[]> = {
    traditional: ['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ffffff'],
    warm: ['#ffd700', '#ffb347', '#ffa07a', '#ff8c69', '#fff0f5'],
    cool: ['#f0ffff', '#e0ffff', '#b0e2ff', '#87cefa', '#b0c4de'],
    multicolor: ['#ff1493', '#00ff7f', '#ff4500', '#4169e1', '#9370db'],
    pastel: ['#ffb6c1', '#98fb98', '#87ceeb', '#dda0dd', '#f0e68c'],
    newyear: ['#00ffff', '#ff1493', '#ffd700', '#4b0082', '#7fff00']
};

/** Background theme color definitions */
export interface BackgroundTheme {
    top: string;
    bottom: string;
    star: string;
}

/** Background theme definitions */
export const BACKGROUND_THEMES: Record<string, BackgroundTheme> = {
    classic: { top: '#05004c', bottom: '#110E19', star: '#ffffff' },
    christmas: { top: '#1a472a', bottom: '#0d2115', star: '#ffffff' },
    candycane: { top: '#8b0000', bottom: '#4a0404', star: '#ffffff' },
    frostnight: { top: '#0a2351', bottom: '#051428', star: '#e0ffff' },
    gingerbread: { top: '#8b4513', bottom: '#3c1f0d', star: '#ffd700' },
    darknight: { top: '#000000', bottom: '#000000', star: '#808080' }
};
