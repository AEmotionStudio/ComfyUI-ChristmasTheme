/**
 * Christmas Theme Sidebar Tab
 * Provides quick access to all Christmas Theme settings in the ComfyUI sidebar
 */

// @ts-ignore - ComfyUI external module
import { app } from "../../../scripts/app.js";
import { getDefaults, getSetting, updateCache } from "./settings-cache";
// @ts-ignore
import SIDEBAR_STYLES from './sidebar.css?inline';
import { el } from "./utils/dom";

// ============================================================================
// Type Definitions
// ============================================================================

interface SettingOption {
    value: string | number;
    text: string;
}

interface SettingConfig {
    id: string;
    label: string;
    type: 'toggle' | 'select' | 'slider';
    tooltip?: string;
    trueValue?: number | boolean;
    falseValue?: number | boolean;
    options?: SettingOption[];
    min?: number;
    max?: number;
    step?: number;
}

interface SectionConfig {
    title: string;
    settings: SettingConfig[];
}

type SettingsConfigType = Record<string, SectionConfig>;

// ============================================================================
// Settings Configuration
// ============================================================================

const SETTINGS_CONFIG: SettingsConfigType = {
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
                tooltip: "If not animating properly, refresh the page",
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
                    { value: "white", text: "❄️ Classic White" },
                    { value: "blue", text: "💠 Ice Blue" },
                    { value: "rainbow", text: "🌈 Rainbow" },
                    { value: "match", text: "🎨 Match Lights" },
                    { value: "newyear", text: "🎉 New Year's Eve" }
                ]
            },
            {
                id: "ChristmasTheme.Snowflake.Type",
                label: "💠 Snowflake Shape",
                type: "select",
                options: [
                    { value: "random", text: "🎲 Random Mix" },
                    { value: "classic", text: "❄️ Classic" },
                    { value: "simple", text: "❅ Simple" },
                    { value: "bold", text: "❆ Bold" },
                    { value: "custom", text: "📁 Custom Image" },
                    { value: "mix_custom", text: "🎲 Mix Custom + Standard" }
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

// ============================================================================
// CSS Styles
// ============================================================================



// ============================================================================
// UI Element Creators
// ============================================================================

/**
 * Optimize image for use as snowflake - resize to max 128x128 and convert to WebP
 */
export async function optimizeImage(dataUrl: string, maxSize = 128): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Scale down to max dimension while preserving aspect ratio
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            // Try WebP first (better compression), fallback to PNG
            let result = canvas.toDataURL('image/webp', 0.85);
            if (!result.startsWith('data:image/webp')) {
                result = canvas.toDataURL('image/png');
            }
            resolve(result);
        };
        img.onerror = () => {
            console.error("Failed to load image for optimization - invalid image data");
            resolve(null); // Return null if loading fails to prevent storing garbage
        };
        img.src = dataUrl;
    });
}

/**
 * Handle file upload for custom assets - now with automatic optimization
 */
function handleFileUpload(callback: (base64: string) => void) {
    const input = el('input', { type: 'file', accept: 'image/*' });
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // Security: Check file type
        if (!file.type.startsWith('image/')) {
            alert("Invalid file type! Please select an image.");
            return;
        }

        // Size check (max 5MB for original, will be compressed)
        if (file.size > 5 * 1024 * 1024) {
            alert("Image too large! Please select an image under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const res = evt.target?.result as string;
            if (res) {
                // Optimize image before saving
                optimizeImage(res).then(optimized => {
                    if (optimized) {
                        console.log(`🎨 Image optimized: ${Math.round(res.length / 1024)}KB → ${Math.round(optimized.length / 1024)}KB`);
                        callback(optimized);
                    } else {
                        alert("Failed to process image. The file may be corrupted or invalid.");
                    }
                });
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

/**
 * Create a toggle switch element
 */
function createToggle(settingConfig: SettingConfig): HTMLDivElement {
    const trueValue = settingConfig.trueValue ?? true;
    const falseValue = settingConfig.falseValue ?? false;
    const currentValue = getSetting(settingConfig.id);
    const isActive = currentValue === trueValue || currentValue === true || currentValue === 1;

    const handleToggle = (t: HTMLElement) => {
        const wasActive = t.classList.contains('active');
        const newValue = wasActive ? falseValue : trueValue;

        t.classList.toggle('active');
        t.ariaChecked = String(!wasActive);
        updateCache(settingConfig.id, newValue);

        // Also update the native ComfyUI setting
        app.ui?.settings?.setSettingValue(settingConfig.id, newValue);

        // Force canvas redraw
        app.canvas?.setDirty(true, true);
    };

    return el('div', {
        className: `christmas-toggle ${isActive ? 'active' : ''}`,
        role: 'switch',
        ariaChecked: String(isActive),
        ariaLabel: settingConfig.label,
        title: settingConfig.tooltip || '',
        tabIndex: 0,
        onClick: (e: MouseEvent) => {
            handleToggle(e.currentTarget as HTMLElement);
        },
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(e.currentTarget as HTMLElement);
            }
        }
    });
}

/**
 * Create a select dropdown element
 */
function createSelect(settingConfig: SettingConfig): HTMLElement {
    const currentValue = getSetting(settingConfig.id);

    const options = (settingConfig.options || []).map(opt =>
        el('option', {
            value: String(opt.value),
            selected: String(opt.value) === String(currentValue)
        }, [opt.text])
    );

    const select = el('select', {
        className: 'christmas-select',
        ariaLabel: settingConfig.label,
        title: settingConfig.tooltip || '',
        onChange: (e: Event) => {
            const sel = e.target as HTMLSelectElement;
            let value: string | number = sel.value;
            if (!isNaN(Number(value)) && value !== '') {
                value = Number(value);
            }

            updateCache(settingConfig.id, value);
            app.ui?.settings?.setSettingValue(settingConfig.id, value);
            app.canvas?.setDirty(true, true);

            // Trigger upload if switching to custom
            if (value === 'custom' || value === 'mix_custom') {
                const uploadBtn = sel.nextElementSibling as HTMLElement;
                if (uploadBtn) {
                    uploadBtn.style.display = 'block';
                    // Robust replace for both 'Type' and 'ColorTheme'
                    const imageKey = settingConfig.id.replace(/(Type|ColorTheme)$/, 'CustomImage');
                    if (!getSetting(imageKey)) {
                        uploadBtn.click();
                    }
                }
            } else {
                const uploadBtn = sel.nextElementSibling as HTMLElement;
                if (uploadBtn) uploadBtn.style.display = 'none';
            }
        }
    }, options) as HTMLSelectElement;

    // Special handling for Custom Image capable fields
    // Changed from Background.ColorTheme to Snowflake.Type
    if (settingConfig.id === 'ChristmasTheme.Snowflake.Type') {
        const uploadBtn = el('button', {
            textContent: '📁',
            className: 'christmas-upload-btn',
            title: 'Upload Custom Snowflake',
            ariaLabel: 'Upload Custom Snowflake',
            style: { display: (currentValue === 'custom' || currentValue === 'mix_custom') ? 'block' : 'none' },
            onClick: () => handleFileUpload((b64) => {
                const imageKey = settingConfig.id.replace(/(Type|ColorTheme)$/, 'CustomImage');
                updateCache(imageKey, b64);
                app.ui?.settings?.setSettingValue(imageKey, b64);
                app.canvas?.setDirty(true, true);
            })
        });

        return el('div', { style: { display: 'flex', gap: '4px', alignItems: 'center', width: '100%' } }, [
            select,
            uploadBtn
        ]);
    }

    return select;
}

/**
 * Create a slider element
 */
function createSlider(settingConfig: SettingConfig): HTMLDivElement {
    const currentVal = getSetting(settingConfig.id) || settingConfig.min || 0;

    const valueLabel = el('span', {
        className: 'christmas-slider-value'
    }, [String(currentVal)]);

    const slider = el('input', {
        type: 'range',
        className: 'christmas-slider',
        ariaLabel: settingConfig.label,
        title: settingConfig.tooltip || '',
        min: String(settingConfig.min || 0),
        max: String(settingConfig.max || 100),
        step: String(settingConfig.step || 1),
        value: String(currentVal)
    });

    slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        valueLabel.textContent = String(value);

        updateCache(settingConfig.id, value);
        app.ui?.settings?.setSettingValue(settingConfig.id, value);
        app.canvas?.setDirty(true, true);
    });

    return el('div', { className: 'christmas-slider-container' }, [
        slider,
        valueLabel
    ]);
}

/**
 * Create a setting row
 */
function createSettingRow(settingConfig: SettingConfig): HTMLDivElement {
    // Sliders get special stacked layout
    if (settingConfig.type === 'slider') {
        const currentVal = getSetting(settingConfig.id) || settingConfig.min || 0;
        const valueLabel = el('span', { className: 'christmas-slider-value' }, [String(currentVal)]);

        const slider = el('input', {
            type: 'range',
            className: 'christmas-slider',
            ariaLabel: settingConfig.label,
            title: settingConfig.tooltip || '',
            min: String(settingConfig.min || 0),
            max: String(settingConfig.max || 100),
            step: String(settingConfig.step || 1),
            value: String(currentVal),
            onInput: (e: Event) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                valueLabel.textContent = String(val);
                updateCache(settingConfig.id, val);
                app.ui?.settings?.setSettingValue(settingConfig.id, val);
                app.canvas?.setDirty(true, true);
            }
        });

        return el('div', { className: 'christmas-setting-row' }, [
            el('div', { className: 'christmas-slider-row' }, [
                el('div', { className: 'christmas-slider-header' }, [
                    el('span', { className: 'christmas-setting-label', title: settingConfig.tooltip || '' }, [settingConfig.label]),
                    valueLabel
                ]),
                el('div', { className: 'christmas-slider-container' }, [slider])
            ])
        ]);
    }

    // Standard layout for toggles and selects
    let control: HTMLElement;
    switch (settingConfig.type) {
        case 'toggle':
            control = createToggle(settingConfig);
            break;
        case 'select':
            control = createSelect(settingConfig);
            break;
        default:
            control = el('span', {}, ['Unknown type']);
    }

    return el('div', { className: 'christmas-setting-row' }, [
        el('span', { className: 'christmas-setting-label' }, [settingConfig.label]),
        control
    ]);
}

/**
 * Create a section with its settings
 */
function createSection(sectionKey: string, sectionConfig: SectionConfig): HTMLDivElement {
    const title = el('div', { className: 'christmas-sidebar-section-title' }, [sectionConfig.title]);
    const settings = sectionConfig.settings.map(s => createSettingRow(s));

    return el('div', { className: 'christmas-sidebar-section' }, [
        title,
        ...settings
    ]);
}

/**
 * Render the sidebar content
 */
function renderSidebar(elRoot: HTMLElement): void {
    // Clear any existing content to prevent duplicates on re-render
    elRoot.innerHTML = '';

    // Add styles inside the main container (not as sibling)
    const styleEl = document.createElement('style');
    styleEl.textContent = SIDEBAR_STYLES;

    const sections = Object.entries(SETTINGS_CONFIG).map(([key, config]) =>
        createSection(key, config)
    );

    const footer = el('div', { className: 'christmas-footer' }, [
        el('button', {
            className: 'christmas-reset-btn',
            ariaLabel: 'Reset all settings to default',
            title: 'Reset all settings to default',
            onClick: () => {
                if (confirm('Are you sure you want to reset all Christmas Theme settings to defaults?')) {
                    const defaults = getDefaults();
                    Object.entries(defaults).forEach(([key, value]) => {
                        updateCache(key, value);
                        app.ui?.settings?.setSettingValue(key, value);
                    });
                    app.canvas?.setDirty(true, true);
                    renderSidebar(elRoot); // Re-render to show new values
                }
            }
        }, ["↺ Reset Defaults"]),
        el('a', {
            href: "https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme",
            target: "_blank",
            rel: "noopener noreferrer",
            ariaLabel: "Visit GitHub repository (opens in a new tab)"
        }, ["🎁 GitHub"])
    ]);

    const container = el('div', { className: 'christmas-sidebar' }, [
        styleEl,  // Styles inside container
        el('div', { className: 'christmas-sidebar-header' }, [
            el('h2', {}, ["🎄 Christmas Theme"])
        ]),
        ...sections,
        footer
    ]);

    elRoot.appendChild(container);
}

// ============================================================================
// Extension Registration
// ============================================================================

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
