// settings-cache.js - Centralized settings cache to avoid deprecated defaultValue warnings
import { app } from "../../scripts/app.js";

// Default values for all settings
const SETTING_DEFAULTS = {
    // Christmas Effects
    "ChristmasTheme.ChristmasEffects.LightSwitch": 1,
    "ChristmasTheme.ChristmasEffects.ColorScheme": "traditional",
    "ChristmasTheme.ChristmasEffects.Twinkle": "gentle",
    "ChristmasTheme.ChristmasEffects.Thickness": 3,
    "ChristmasTheme.ChristmasEffects.GlowIntensity": 20,
    "ChristmasTheme.ChristmasEffects.Direction": 1,
    "ChristmasTheme.Link Style": "spline",

    // Snowflake
    "ChristmasTheme.Snowflake.Enabled": 1,
    "ChristmasTheme.Snowflake.ColorScheme": "white",
    "ChristmasTheme.Snowflake.Glow": 10,

    // Background
    "ChristmasTheme.Background.Enabled": true,
    "ChristmasTheme.Background.ColorTheme": "classic",

    // Performance
    "ChristmasTheme.PauseDuringRender": true
};

// Cache object - initialized with defaults
const settingsCache = { ...SETTING_DEFAULTS };

// Track if cache has been initialized
let cacheInitialized = false;

/**
 * Initialize the settings cache from stored values
 * Call this once AFTER settings are registered
 */
export function initSettingsCache() {
    if (cacheInitialized) return;
    cacheInitialized = true;
    console.log("🎄 Settings cache initialized");
}

/**
 * Load a setting value from ComfyUI after settings are registered
 * This should be called from each setting's onChange during registration
 * to capture the initial value ComfyUI loads from storage
 */
export function loadSettingFromStorage(key) {
    try {
        const storedValue = app.ui.settings.getSettingValue(key);
        if (storedValue !== undefined && storedValue !== null) {
            settingsCache[key] = storedValue;
        }
    } catch (e) {
        // Setting not available yet, keep default
    }
}

/**
 * Get a setting value from cache (no console warnings!)
 * @param {string} key - Setting key
 * @returns {*} Setting value
 */
export function getSetting(key) {
    return settingsCache[key] ?? SETTING_DEFAULTS[key];
}

/**
 * Update cache when setting changes
 * Call this from onChange callbacks
 * @param {string} key - Setting key
 * @param {*} value - New value
 */
export function updateCache(key, value) {
    settingsCache[key] = value;
}

/**
 * Get all cached settings (for debugging)
 */
export function getAllSettings() {
    return { ...settingsCache };
}

/**
 * Get all defaults (for reference)
 */
export function getDefaults() {
    return { ...SETTING_DEFAULTS };
}

// Color scheme definitions (shared across modules)
export const COLOR_SCHEMES = {
    traditional: ['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ffffff'],
    warm: ['#ffd700', '#ffb347', '#ffa07a', '#ff8c69', '#fff0f5'],
    cool: ['#f0ffff', '#e0ffff', '#b0e2ff', '#87cefa', '#b0c4de'],
    multicolor: ['#ff1493', '#00ff7f', '#ff4500', '#4169e1', '#9370db'],
    pastel: ['#ffb6c1', '#98fb98', '#87ceeb', '#dda0dd', '#f0e68c'],
    newyear: ['#00ffff', '#ff1493', '#ffd700', '#4b0082', '#7fff00']
};

// Background theme definitions
export const BACKGROUND_THEMES = {
    classic: { top: '#05004c', bottom: '#110E19', star: '#ffffff' },
    christmas: { top: '#1a472a', bottom: '#0d2115', star: '#ffffff' },
    candycane: { top: '#8b0000', bottom: '#4a0404', star: '#ffffff' },
    frostnight: { top: '#0a2351', bottom: '#051428', star: '#e0ffff' },
    gingerbread: { top: '#8b4513', bottom: '#3c1f0d', star: '#ffd700' },
    darknight: { top: '#000000', bottom: '#000000', star: '#808080' }
};
