import { app } from "../../scripts/app.js";
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
  "ChristmasTheme.ChristmasEffects.CustomImage": "",
  // Unused for now
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
const settingsCache = { ...SETTING_DEFAULTS };
let cacheInitialized = false;
function initSettingsCache() {
  if (cacheInitialized) return;
  Object.keys(SETTING_DEFAULTS).forEach((key) => {
    loadSettingFromStorage(key);
  });
  cacheInitialized = true;
  console.log("🎄 Settings cache initialized with saved values");
}
function loadSettingFromStorage(key) {
  try {
    const storedValue = app.ui.settings.getSettingValue(key);
    if (storedValue !== void 0 && storedValue !== null) {
      settingsCache[key] = storedValue;
    }
  } catch {
  }
}
function getSetting(key) {
  return settingsCache[key] ?? SETTING_DEFAULTS[key];
}
function updateCache(key, value) {
  settingsCache[key] = value;
}
function getAllSettings() {
  return { ...settingsCache };
}
function getDefaults() {
  return { ...SETTING_DEFAULTS };
}
const COLOR_SCHEMES = {
  traditional: ["#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ffffff"],
  warm: ["#ffd700", "#ffb347", "#ffa07a", "#ff8c69", "#fff0f5"],
  cool: ["#f0ffff", "#e0ffff", "#b0e2ff", "#87cefa", "#b0c4de"],
  multicolor: ["#ff1493", "#00ff7f", "#ff4500", "#4169e1", "#9370db"],
  pastel: ["#ffb6c1", "#98fb98", "#87ceeb", "#dda0dd", "#f0e68c"],
  newyear: ["#00ffff", "#ff1493", "#ffd700", "#4b0082", "#7fff00"]
};
const BACKGROUND_THEMES = {
  classic: { top: "#05004c", bottom: "#110E19", star: "#ffffff" },
  christmas: { top: "#1a472a", bottom: "#0d2115", star: "#ffffff" },
  candycane: { top: "#8b0000", bottom: "#4a0404", star: "#ffffff" },
  frostnight: { top: "#0a2351", bottom: "#051428", star: "#e0ffff" },
  gingerbread: { top: "#8b4513", bottom: "#3c1f0d", star: "#ffd700" },
  darknight: { top: "#000000", bottom: "#000000", star: "#808080" }
};
export {
  BACKGROUND_THEMES,
  COLOR_SCHEMES,
  getAllSettings,
  getDefaults,
  getSetting,
  initSettingsCache,
  loadSettingFromStorage,
  updateCache
};
//# sourceMappingURL=settings-cache.js.map
