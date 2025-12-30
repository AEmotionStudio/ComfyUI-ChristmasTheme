/**
 * Christmas Theme Sidebar Tab
 * Provides quick access to all Christmas Theme settings in the ComfyUI sidebar
 */
import { app } from "../../../scripts/app.js";
import { getSetting, updateCache } from "./settings-cache.js";

// Settings definitions for the sidebar
const SETTINGS_CONFIG = {
    background: {
        title: "🌌 Background",
        settings: [
            {
                id: "ChristmasTheme.Background.Enabled",
                label: "🌟 Background Effect",
                type: "toggle"
            },
            {
                id: "ChristmasTheme.Background.ColorTheme",
                label: "🎨 Color Theme",
                type: "select",
                options: [
                    { value: "classic", text: "🌌 Classic Night" },
                    { value: "christmas", text: "🎄 Christmas Forest" },
                    { value: "candycane", text: "🍬 Candy Cane Red" },
                    { value: "frostnight", text: "❄️ Frost Night" },
                    { value: "gingerbread", text: "🍪 Gingerbread" },
                    { value: "darknight", text: "🌑 Dark Night" }
                ]
            },
            {
                id: "ChristmasTheme.Background.Stars",
                label: "⭐ Background Stars",
                type: "toggle"
            },
            {
                id: "ChristmasTheme.Background.ShootingStars",
                label: "☄️ Shooting Stars",
                type: "toggle"
            },
            {
                id: "ChristmasTheme.Background.PartyMode",
                label: "🪩 Party Mode",
                type: "toggle"
            },
            {
                id: "ChristmasTheme.Background.Fireworks",
                label: "🎆 Fireworks",
                type: "toggle"
            },
            {
                id: "ChristmasTheme.Background.Countdown",
                label: "🎊 New Year Countdown",
                type: "toggle"
            },
            {
                id: "ChristmasTheme.Background.MouseEffect",
                label: "✨ Mouse Trail",
                type: "select",
                options: [
                    { value: "none", text: "⭘ Off" },
                    { value: "sparkler", text: "✨ Sparkler" },
                    { value: "snowflake", text: "❄️ Snowflake" },
                    { value: "confetti", text: "🎊 Confetti" },
                    { value: "stardust", text: "⭐ Stardust" },
                    { value: "comet", text: "☄️ Comet" },
                    { value: "aurora", text: "🌌 Aurora" },
                    { value: "ribbon", text: "🎀 Ribbon" },
                    { value: "crystal", text: "💎 Crystal" },
                    { value: "petals", text: "🌸 Petals" },
                    { value: "gifts", text: "🎁 Gifts" },
                    { value: "candy", text: "🍬 Candy" },
                    { value: "orb", text: "🔮 Magic Orb" },
                    { value: "magic", text: "✨ Magic Wand" },
                    { value: "nova", text: "🌟 Nova" },
                    { value: "bubbles", text: "💧 Bubbles" },
                    { value: "embers", text: "🔥 Embers" },
                    { value: "lightning", text: "⚡ Lightning" },
                    { value: "leaves", text: "🍂 Leaves" },
                    { value: "wishes", text: "💫 Wishes" },
                    { value: "notes", text: "🎵 Notes" },
                    { value: "hearts", text: "💖 Hearts" }
                ]
            }
        ]
    },
    lights: {
        title: "🎄 Christmas Lights",
        settings: [
            {
                id: "ChristmasTheme.ChristmasEffects.LightSwitch",
                label: "🎄 Christmas Lights",
                type: "toggle",
                trueValue: 1,
                falseValue: 0
            },
            {
                id: "ChristmasTheme.ChristmasEffects.ColorScheme",
                label: "🎨 Color Scheme",
                type: "select",
                options: [
                    { value: "traditional", text: "🎄 Traditional" },
                    { value: "warm", text: "🔆 Warm White" },
                    { value: "cool", text: "❄️ Cool White" },
                    { value: "multicolor", text: "🌈 Multicolor" },
                    { value: "pastel", text: "🎀 Pastel" },
                    { value: "newyear", text: "🎉 New Year's Eve" }
                ]
            },
            {
                id: "ChristmasTheme.ChristmasEffects.Twinkle",
                label: "✨ Light Effect",
                type: "select",
                options: [
                    { value: "steady", text: "Steady" },
                    { value: "gentle", text: "Gentle Twinkle" },
                    { value: "sparkle", text: "Sparkle" },
                    { value: "candycane", text: "🍬 Candy Cane" },
                    { value: "frost", text: "❄️ Frost Trail" },
                    { value: "aurora", text: "🌌 Aurora Flow" }
                ]
            },
            {
                id: "ChristmasTheme.ChristmasEffects.BulbShape",
                label: "💡 Bulb Shape",
                type: "select",
                options: [
                    { value: "classic", text: "🔴 Classic Round" },
                    { value: "icicle", text: "❄️ Icicle Point" }
                ]
            },
            {
                id: "ChristmasTheme.ChristmasEffects.Direction",
                label: "🔄 Flow Direction",
                type: "select",
                options: [
                    { value: -1, text: "Forward ➡️" },
                    { value: 1, text: "Reverse ⬅️" }
                ]
            },
            {
                id: "ChristmasTheme.ChristmasEffects.Thickness",
                label: "💫 Light Size",
                type: "slider",
                min: 1,
                max: 10,
                step: 0.5
            },
            {
                id: "ChristmasTheme.ChristmasEffects.GlowIntensity",
                label: "✨ Glow Intensity",
                type: "slider",
                min: 0,
                max: 30,
                step: 1
            },
            {
                id: "ChristmasTheme.Link Style",
                label: "🔗 Link Style",
                type: "select",
                options: [
                    { value: "spline", text: "Spline" },
                    { value: "straight", text: "Straight" },
                    { value: "linear", text: "Linear" },
                    { value: "hidden", text: "Hidden" }
                ]
            }
        ]
    },
    snow: {
        title: "❄️ Snow Effect",
        settings: [
            {
                id: "ChristmasTheme.Snowflake.Enabled",
                label: "❄️ Snow Effect",
                type: "toggle",
                trueValue: 1,
                falseValue: 0
            },
            {
                id: "ChristmasTheme.Snowflake.ColorScheme",
                label: "🎨 Snowflake Color",
                type: "select",
                options: [
                    { value: "white", text: "❄️ Classic White" },
                    { value: "blue", text: "💠 Ice Blue" },
                    { value: "rainbow", text: "🌈 Rainbow" },
                    { value: "match", text: "🎨 Match Lights" },
                    { value: "newyear", text: "🎉 New Year's Eve" }
                ]
            },
            {
                id: "ChristmasTheme.Snowflake.Glow",
                label: "✨ Snowflake Glow",
                type: "slider",
                min: 0,
                max: 20,
                step: 1
            }
        ]
    },
    performance: {
        title: "⚡ Performance",
        settings: [
            {
                id: "ChristmasTheme.PauseDuringRender",
                label: "⏸️ Pause During Render",
                type: "toggle"
            }
        ]
    }
};

// CSS styles for the sidebar
const SIDEBAR_STYLES = `
    .christmas-sidebar {
        padding: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #e0e0e0;
        font-size: 13px;
        min-width: 200px;
        background: linear-gradient(180deg, 
            rgba(30, 60, 40, 0.4) 0%, 
            rgba(60, 30, 40, 0.3) 50%, 
            rgba(30, 40, 60, 0.4) 100%);
        border-radius: 8px;
    }
    .christmas-sidebar-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 100, 100, 0.3);
    }
    .christmas-sidebar-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        background: linear-gradient(135deg, #ff4444, #ff6b6b, #44ff44, #66ff66);
        background-size: 200% 200%;
        animation: christmas-shimmer 3s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    @keyframes christmas-shimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
    }
    .christmas-sidebar-section {
        margin-bottom: 16px;
        background: linear-gradient(135deg, 
            rgba(139, 69, 69, 0.15) 0%, 
            rgba(34, 139, 34, 0.1) 100%);
        border-radius: 8px;
        padding: 12px;
        border: 1px solid rgba(255, 100, 100, 0.15);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }
    .christmas-sidebar-section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 6px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .christmas-setting-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .christmas-setting-row:last-child {
        border-bottom: none;
    }
    .christmas-setting-label {
        font-size: 12px;
        color: #ccc;
        flex: 1 1 auto;
        min-width: 80px;
    }
    .christmas-toggle {
        position: relative;
        width: 40px;
        height: 22px;
        min-width: 40px;
        background: #333;
        border-radius: 11px;
        cursor: pointer;
        transition: background 0.2s;
        border: 1px solid #555;
        flex-shrink: 0;
    }
    .christmas-toggle.active {
        background: linear-gradient(135deg, #228B22, #32CD32);
        border-color: #32CD32;
        box-shadow: 0 0 8px rgba(50, 205, 50, 0.5);
    }
    .christmas-toggle::after {
        content: '';
        position: absolute;
        width: 18px;
        height: 18px;
        background: #fff;
        border-radius: 50%;
        top: 1px;
        left: 1px;
        transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .christmas-toggle.active::after {
        transform: translateX(18px);
    }
    .christmas-select {
        background: rgba(42, 42, 42, 0.9);
        color: #e0e0e0;
        border: 1px solid rgba(139, 69, 69, 0.4);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 11px;
        cursor: pointer;
        min-width: 100px;
        max-width: 100%;
        flex: 1 1 100px;
    }
    .christmas-select:hover {
        border-color: rgba(50, 205, 50, 0.5);
    }
    .christmas-select:focus {
        outline: none;
        border-color: #32CD32;
        box-shadow: 0 0 4px rgba(50, 205, 50, 0.3);
    }
    .christmas-slider-row {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 4px;
    }
    .christmas-slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    .christmas-slider-container {
        display: flex;
        align-items: center;
        width: 100%;
    }
    .christmas-slider {
        flex: 1;
        height: 4px;
        background: linear-gradient(90deg, #8B4545, #228B22);
        border-radius: 2px;
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
    }
    .christmas-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #ff4444, #cc0000);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 6px rgba(255, 68, 68, 0.5);
    }
    .christmas-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #ff4444, #cc0000);
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 6px rgba(255, 68, 68, 0.5);
    }
    .christmas-slider-value {
        font-size: 11px;
        color: #66ff66;
        font-weight: 500;
    }
    .christmas-footer {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 100, 100, 0.2);
        text-align: center;
    }
    .christmas-footer a {
        color: #ff6b6b;
        text-decoration: none;
        font-size: 11px;
        transition: color 0.2s;
    }
    .christmas-footer a:hover {
        color: #66ff66;
        text-decoration: underline;
    }
`;

/**
 * Create a toggle switch element
 */
function createToggle(settingConfig) {
    const toggle = document.createElement('div');
    toggle.className = 'christmas-toggle';

    const trueValue = settingConfig.trueValue !== undefined ? settingConfig.trueValue : true;
    const falseValue = settingConfig.falseValue !== undefined ? settingConfig.falseValue : false;

    // Get current value
    const currentValue = getSetting(settingConfig.id);
    if (currentValue === trueValue || currentValue === true || currentValue === 1) {
        toggle.classList.add('active');
    }

    toggle.addEventListener('click', () => {
        const isActive = toggle.classList.contains('active');
        const newValue = isActive ? falseValue : trueValue;

        toggle.classList.toggle('active');
        updateCache(settingConfig.id, newValue);

        // Also update the native ComfyUI setting
        if (app.ui && app.ui.settings) {
            app.ui.settings.setSettingValue(settingConfig.id, newValue);
        }

        // Force canvas redraw
        if (app.canvas) {
            app.canvas.setDirty(true, true);
        }
    });

    return toggle;
}

/**
 * Create a select dropdown element
 */
function createSelect(settingConfig) {
    const select = document.createElement('select');
    select.className = 'christmas-select';

    const currentValue = getSetting(settingConfig.id);

    settingConfig.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        if (String(opt.value) === String(currentValue)) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        let value = select.value;
        // Convert to number if it looks like a number
        if (!isNaN(value) && value !== '') {
            value = Number(value);
        }

        updateCache(settingConfig.id, value);

        // Also update the native ComfyUI setting
        if (app.ui && app.ui.settings) {
            app.ui.settings.setSettingValue(settingConfig.id, value);
        }

        // Force canvas redraw
        if (app.canvas) {
            app.canvas.setDirty(true, true);
        }
    });

    return select;
}

/**
 * Create a slider element
 */
function createSlider(settingConfig) {
    const container = document.createElement('div');
    container.className = 'christmas-slider-container';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'christmas-slider';
    slider.min = settingConfig.min;
    slider.max = settingConfig.max;
    slider.step = settingConfig.step;
    slider.value = getSetting(settingConfig.id) || settingConfig.min;

    const valueLabel = document.createElement('span');
    valueLabel.className = 'christmas-slider-value';
    valueLabel.textContent = slider.value;

    slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        valueLabel.textContent = value;

        updateCache(settingConfig.id, value);

        // Also update the native ComfyUI setting
        if (app.ui && app.ui.settings) {
            app.ui.settings.setSettingValue(settingConfig.id, value);
        }

        // Force canvas redraw
        if (app.canvas) {
            app.canvas.setDirty(true, true);
        }
    });

    container.appendChild(slider);
    container.appendChild(valueLabel);

    return container;
}

/**
 * Create a setting row
 */
function createSettingRow(settingConfig) {
    const row = document.createElement('div');
    row.className = 'christmas-setting-row';

    // Sliders get special stacked layout
    if (settingConfig.type === 'slider') {
        const sliderRow = document.createElement('div');
        sliderRow.className = 'christmas-slider-row';

        // Header with label and value
        const header = document.createElement('div');
        header.className = 'christmas-slider-header';

        const label = document.createElement('span');
        label.className = 'christmas-setting-label';
        label.textContent = settingConfig.label;

        const valueLabel = document.createElement('span');
        valueLabel.className = 'christmas-slider-value';
        const currentVal = getSetting(settingConfig.id) || settingConfig.min;
        valueLabel.textContent = currentVal;

        header.appendChild(label);
        header.appendChild(valueLabel);

        // Slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'christmas-slider-container';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'christmas-slider';
        slider.min = settingConfig.min;
        slider.max = settingConfig.max;
        slider.step = settingConfig.step;
        slider.value = currentVal;

        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            valueLabel.textContent = value;

            updateCache(settingConfig.id, value);

            if (app.ui && app.ui.settings) {
                app.ui.settings.setSettingValue(settingConfig.id, value);
            }

            if (app.canvas) {
                app.canvas.setDirty(true, true);
            }
        });

        sliderContainer.appendChild(slider);
        sliderRow.appendChild(header);
        sliderRow.appendChild(sliderContainer);
        row.appendChild(sliderRow);

        return row;
    }

    // Standard layout for toggles and selects
    const label = document.createElement('span');
    label.className = 'christmas-setting-label';
    label.textContent = settingConfig.label;

    let control;
    switch (settingConfig.type) {
        case 'toggle':
            control = createToggle(settingConfig);
            break;
        case 'select':
            control = createSelect(settingConfig);
            break;
        default:
            control = document.createElement('span');
            control.textContent = 'Unknown type';
    }

    row.appendChild(label);
    row.appendChild(control);

    return row;
}

/**
 * Create a section with its settings
 */
function createSection(sectionKey, sectionConfig) {
    const section = document.createElement('div');
    section.className = 'christmas-sidebar-section';

    const title = document.createElement('div');
    title.className = 'christmas-sidebar-section-title';
    title.textContent = sectionConfig.title;
    section.appendChild(title);

    sectionConfig.settings.forEach(settingConfig => {
        section.appendChild(createSettingRow(settingConfig));
    });

    return section;
}

/**
 * Render the sidebar content
 */
function renderSidebar(el) {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = SIDEBAR_STYLES;
    el.appendChild(styleEl);

    // Create main container
    const container = document.createElement('div');
    container.className = 'christmas-sidebar';

    // Header
    const header = document.createElement('div');
    header.className = 'christmas-sidebar-header';
    header.innerHTML = '<h2>🎄 Christmas Theme</h2>';
    container.appendChild(header);

    // Sections
    for (const [key, config] of Object.entries(SETTINGS_CONFIG)) {
        container.appendChild(createSection(key, config));
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'christmas-footer';
    footer.innerHTML = '<a href="https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme" target="_blank">🎁 GitHub</a>';
    container.appendChild(footer);

    el.appendChild(container);
}

// Register the sidebar tab
app.registerExtension({
    name: "Christmas.Theme.Sidebar",
    async setup() {
        // Wait a bit for the extension manager to be ready
        setTimeout(() => {
            if (app.extensionManager && app.extensionManager.registerSidebarTab) {
                app.extensionManager.registerSidebarTab({
                    id: "christmas-theme",
                    icon: "pi pi-gift",
                    title: "Christmas",
                    tooltip: "Christmas Theme Settings",
                    type: "custom",
                    render: renderSidebar
                });
                console.log("🎄 Christmas Theme sidebar tab registered");
            } else {
                console.warn("⚠️ Extension manager not available for sidebar registration");
            }
        }, 100);
    }
});
