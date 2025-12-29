import { app } from "../../scripts/app.js";
import { getSetting, updateCache, initSettingsCache, loadSettingFromStorage, BACKGROUND_THEMES, COLOR_SCHEMES } from "./settings-cache.js";

// Track if extension has been set up to prevent double registration
let extensionSetupComplete = false;

// Flag to prevent onChange callbacks during initial setup
let isInitialSetup = true;

// Page Visibility API - shared across modules
let isPageVisible = true;
document.addEventListener('visibilitychange', () => {
    isPageVisible = document.visibilityState === 'visible';
});

// Store original method for cleanup
let originalDrawBackCanvas = null;

// Star entities for the background effect
let starEntities = [];
let shootingStars = [];
let nebulaEntities = [];
let starInitialized = false;

// Background snowflake entities (canvas-based, drawn behind nodes)
let bgSnowflakeEntities = [];
let bgSnowflakesInitialized = false;
let lastBgColorScheme = null;
let lastBgSnowflakeColorScheme = null;

// Firework entities
let fireworkRockets = [];
let fireworkParticles = [];
let fireworkSparks = []; // Secondary small particles
let lastFireworkTime = 0;

// Color palettes for different firework types
const FIREWORK_PALETTES = [
    ['#ff6b6b', '#ff8787', '#ffa8a8'], // Red gradient
    ['#ffd93d', '#ffe066', '#fff3bf'], // Gold gradient
    ['#6bcb77', '#8ce99a', '#b2f2bb'], // Green gradient
    ['#4d96ff', '#74c0fc', '#a5d8ff'], // Blue gradient
    ['#ff85c1', '#f783ac', '#faa2c1'], // Pink gradient
    ['#a855f7', '#c084fc', '#d8b4fe'], // Purple gradient
    ['#00d4ff', '#22d3ee', '#67e8f9'], // Cyan gradient
    ['#ffffff', '#f8f9fa', '#e9ecef'], // White/silver
    ['#ffd700', '#ffec99', '#fff9db'], // Bright gold
];

// Explosion types
const EXPLOSION_TYPES = ['chrysanthemum', 'willow', 'palm', 'ring', 'crackle', 'peony'];

// Create a new firework rocket with enhanced properties
function createFireworkRocket(width, height) {
    const palette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
    const explosionType = EXPLOSION_TYPES[Math.floor(Math.random() * EXPLOSION_TYPES.length)];
    return {
        x: Math.random() * width * 0.8 + width * 0.1,
        y: height - 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -12 - Math.random() * 6,
        palette: palette,
        explosionType: explosionType,
        trail: [],
        trailTimer: 0,
        age: 0,
        exploded: false,
        size: 2 + Math.random()
    };
}

// Create professional explosion particles based on type
function createExplosionParticles(x, y, palette, explosionType) {
    const particles = [];
    const primaryColor = palette[0];
    const secondaryColor = palette[1];
    const tertiaryColor = palette[2];

    switch (explosionType) {
        case 'chrysanthemum': {
            // Dense spherical burst with long trails
            const count = 80 + Math.floor(Math.random() * 40);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
                const speed = 3 + Math.random() * 3;
                const colorChoice = Math.random();
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colorChoice < 0.5 ? primaryColor : (colorChoice < 0.8 ? secondaryColor : tertiaryColor),
                    alpha: 1,
                    size: 2 + Math.random() * 1.5,
                    decay: 0.008 + Math.random() * 0.004,
                    trail: [],
                    hasTrail: true,
                    gravity: 0.03
                });
            }
            break;
        }
        case 'willow': {
            // Drooping trails like a willow tree
            const count = 60 + Math.floor(Math.random() * 30);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
                const speed = 2 + Math.random() * 2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    color: palette[Math.floor(Math.random() * palette.length)],
                    alpha: 1,
                    size: 1.5 + Math.random(),
                    decay: 0.005 + Math.random() * 0.003,
                    trail: [],
                    hasTrail: true,
                    gravity: 0.08 // Heavy gravity for drooping effect
                });
            }
            break;
        }
        case 'palm': {
            // Thick center burst spreading outward
            const count = 50 + Math.floor(Math.random() * 20);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                const speed = 4 + Math.random() * 2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    color: primaryColor,
                    alpha: 1,
                    size: 3 + Math.random() * 2,
                    decay: 0.012 + Math.random() * 0.005,
                    trail: [],
                    hasTrail: true,
                    gravity: 0.04
                });
            }
            break;
        }
        case 'ring': {
            // Expanding ring shape
            const count = 40;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                const speed = 4;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: palette[i % palette.length],
                    alpha: 1,
                    size: 2.5,
                    decay: 0.015,
                    trail: [],
                    hasTrail: false,
                    gravity: 0.02
                });
            }
            break;
        }
        case 'crackle': {
            // Initial burst then secondary mini explosions
            const count = 30;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
                const speed = 2 + Math.random() * 2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: primaryColor,
                    alpha: 1,
                    size: 2 + Math.random(),
                    decay: 0.02,
                    trail: [],
                    hasTrail: true,
                    gravity: 0.05,
                    crackle: true,
                    crackleTime: 0.3 + Math.random() * 0.3
                });
            }
            break;
        }
        case 'peony':
        default: {
            // Classic spherical burst
            const count = 70 + Math.floor(Math.random() * 30);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
                const speed = 2.5 + Math.random() * 2.5;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: palette[Math.floor(Math.random() * palette.length)],
                    alpha: 1,
                    size: 2 + Math.random() * 1.5,
                    decay: 0.01 + Math.random() * 0.005,
                    trail: [],
                    hasTrail: Math.random() > 0.3,
                    gravity: 0.04
                });
            }
        }
    }

    // Add glitter/sparks for all types
    const sparkCount = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        fireworkSparks.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: 0.5 + Math.random() * 0.5,
            decay: 0.03 + Math.random() * 0.02,
            twinkle: Math.random() * Math.PI * 2
        });
    }

    return particles;
}

// Function to update all background snowflake colors when settings change
function updateBgSnowflakeColors() {
    for (const flake of bgSnowflakeEntities) {
        flake.color = getBgSnowflakeColor();
    }
}

// New Year Countdown Timer
let countdownElement = null;
let countdownInterval = null;

function createCountdownElement() {
    if (countdownElement) return countdownElement;

    const container = document.createElement('div');
    container.id = 'christmas-theme-countdown';
    container.innerHTML = `
        <style>
            #christmas-theme-countdown {
                position: fixed;
                bottom: 4px;
                right: 260px;
                background: rgba(35, 35, 35, 0.95);
                border: 1px solid rgba(80, 80, 80, 0.8);
                border-radius: 6px;
                padding: 7px 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #e0e0e0;
                z-index: 9999;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            #christmas-theme-countdown .countdown-title {
                font-size: 7px;
                color: #b0b0b0;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                width: 100%;
            }
            #christmas-theme-countdown .countdown-title svg {
                width: 10px;
                height: 10px;
                fill: none;
                stroke: #ffd700;
                stroke-width: 2;
                stroke-linecap: round;
            }
            #christmas-theme-countdown .countdown-grid {
                display: flex;
                align-items: flex-start;
                gap: 2px;
            }
            #christmas-theme-countdown .countdown-segment {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 22px;
            }
            #christmas-theme-countdown .countdown-segment span:first-child {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                font-variant-numeric: tabular-nums;
                line-height: 1.1;
            }
            #christmas-theme-countdown .countdown-segment .label {
                font-size: 6px;
                color: #888;
                margin-top: 1px;
            }
            #christmas-theme-countdown .countdown-sep {
                font-size: 14px;
                font-weight: 600;
                color: #666;
                line-height: 1.1;
            }
            #christmas-theme-countdown.celebration {
                animation: celebrate 0.3s ease-in-out infinite;
                border-color: #ffd700;
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
            }
            @keyframes celebrate {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        </style>
        <div class="countdown-title">
            <svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83"/><circle cx="12" cy="12" r="2"/></svg>
            New Year 2026
            <svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div class="countdown-grid">
            <div class="countdown-segment"><span id="countdown-days">00</span><span class="label">Days</span></div>
            <div class="countdown-sep">:</div>
            <div class="countdown-segment"><span id="countdown-hours">00</span><span class="label">Hrs</span></div>
            <div class="countdown-sep">:</div>
            <div class="countdown-segment"><span id="countdown-mins">00</span><span class="label">Min</span></div>
            <div class="countdown-sep">:</div>
            <div class="countdown-segment"><span id="countdown-secs">00</span><span class="label">Sec</span></div>
        </div>
    `;
    document.body.appendChild(container);
    countdownElement = container;
    return container;
}

// Finale state
let finaleActive = false;
let finaleStartTime = 0;
const FINALE_DURATION = 15000; // 15 seconds of fireworks

function triggerFinale() {
    if (finaleActive) return;
    finaleActive = true;
    finaleStartTime = performance.now();
    console.log("🎆 FINALE TRIGGERED!");
}

function updateCountdown() {
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    const now = new Date();
    let targetYear = now.getFullYear();
    // If we're past Jan 1, target next year
    if (now.getMonth() > 0 || (now.getMonth() === 0 && now.getDate() > 1)) {
        targetYear++;
    }
    const newYear = new Date(targetYear, 0, 1, 0, 0, 0);
    const diff = newYear - now;

    if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        if (countdownElement) {
            countdownElement.classList.add('celebration');
        }
        // Show finale button instead of auto-triggering (easter egg)
        showFinaleButton();
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = days.toString().padStart(2, '0');
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minsEl.textContent = minutes.toString().padStart(2, '0');
    secsEl.textContent = seconds.toString().padStart(2, '0');

    // Hide finale button if time is not zero AND setting is off
    if (!getSetting("ChristmasTheme.Background.ShowFinaleButton")) {
        hideFinaleButton();
    }
}

function toggleCountdownDisplay(enabled) {
    if (enabled) {
        createCountdownElement();
        countdownElement.style.display = 'block';
        updateCountdown();
        if (!countdownInterval) {
            countdownInterval = setInterval(updateCountdown, 1000);
        }
        // Show finale button if setting enabled
        if (getSetting("ChristmasTheme.Background.ShowFinaleButton")) {
            showFinaleButton();
        }
    } else {
        if (countdownElement) {
            countdownElement.style.display = 'none';
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        hideFinaleButton();
    }
}

// Finale button (appears at midnight as easter egg)
let finaleButtonElement = null;
let finaleButtonShown = false;

function showFinaleButton() {
    if (finaleButtonShown || finaleActive) return;
    finaleButtonShown = true;

    if (finaleButtonElement) {
        finaleButtonElement.style.display = 'block';
        return;
    }

    const btn = document.createElement('button');
    btn.id = 'finale-trigger-btn';
    btn.innerHTML = `Happy New Year!`;
    btn.style.cssText = `
        position: fixed;
        bottom: 59px;
        right: 273px;
        padding: 6px 12px;
        background: rgba(35, 35, 35, 0.95);
        border: 1px solid #ffd700;
        border-radius: 6px;
        color: #ffd700;
        font-weight: 600;
        cursor: pointer;
        z-index: 10000;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
    `;
    btn.onmouseenter = () => {
        btn.style.background = 'rgba(50, 50, 50, 0.95)';
        btn.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.4)';
    };
    btn.onmouseleave = () => {
        btn.style.background = 'rgba(35, 35, 35, 0.95)';
        btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    };
    btn.onclick = () => {
        finaleActive = false; // Reset so it triggers fresh
        triggerFinale();
    };
    document.body.appendChild(btn);
    finaleButtonElement = btn;
}

function hideFinaleButton() {
    finaleButtonShown = false;
    if (finaleButtonElement) {
        finaleButtonElement.style.display = 'none';
    }
}


// Gradient caching
let cachedGradient = null;
let cachedTheme = null;
let cachedWidth = 0;
let cachedHeight = 0;

// Performance tracking
let frameCount = 0;
let lastFpsCheck = performance.now();
let currentFps = 60;

// Animation timing
let lastAnimationTime = 0;
let lastShootingStarTime = 0;

/**
 * Get a star color based on temperature (blue hot -> yellow cool)
 */
function getStarColor() {
    const roll = Math.random();
    if (roll < 0.15) return '#aaccff';      // Blue-white (hot)
    if (roll < 0.50) return '#ffffff';      // White (common)
    if (roll < 0.75) return '#fffef0';      // Warm white
    if (roll < 0.90) return '#fff4e0';      // Yellow-white (sun-like)
    return '#ffe4c0';                        // Orange-ish (cooler)
}

/**
 * Initialize star entities for background with depth layers
 */
function initStars(width, height) {
    const area = width * height;
    const density = 0.0003; // slightly reduced density
    const count = Math.min(Math.floor(area * density), 800); // Cap at 800 stars

    starEntities = [];
    for (let i = 0; i < count; i++) {
        // Create 3 layers: distant (small, dim), normal, bright (rare, glow)
        const layerRoll = Math.random();
        let layer, size, baseOpacity, twinkleSpeed, hasGlow, hasSpikes;

        if (layerRoll < 0.6) {
            // Distant stars (60%) - tiny, dim, very slow twinkle
            layer = 'distant';
            size = 0.3 + Math.random() * 0.5;
            baseOpacity = 0.2 + Math.random() * 0.3;
            twinkleSpeed = 0.15 + Math.random() * 0.25;  // Slower for calm feel
            hasGlow = false;
            hasSpikes = false;
        } else if (layerRoll < 0.92) {
            // Normal stars (32%) - medium, gentle twinkle
            layer = 'normal';
            size = 0.5 + Math.random() * 0.8;
            baseOpacity = 0.4 + Math.random() * 0.4;
            twinkleSpeed = 0.25 + Math.random() * 0.5;  // Slower
            hasGlow = false;
            hasSpikes = false;
        } else {
            // Bright stars (8%) - larger, with glow and possible spikes
            layer = 'bright';
            size = 0.8 + Math.random() * 0.7;
            baseOpacity = 0.7 + Math.random() * 0.3;
            twinkleSpeed = 0.4 + Math.random() * 0.7;  // Slower
            hasGlow = true;
            hasSpikes = Math.random() < 0.4; // 40% of bright stars get spikes
        }

        starEntities.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size,
            // Use much larger offset range + secondary offset to prevent sync
            twinkleOffset: Math.random() * Math.PI * 20,  // Larger range  
            twinkleOffset2: Math.random() * Math.PI * 15, // Secondary offset
            twinkleSpeed,
            // Add slight speed variation per star
            twinkleSpeedMod: 0.85 + Math.random() * 0.3,
            baseOpacity,
            layer,
            hasGlow,
            hasSpikes,
            color: getStarColor()
        });
    }

    // Create nebula clouds (soft colored areas)
    nebulaEntities = [];
    const nebulaCount = Math.min(Math.floor(count * 0.01), 5); // Just a few nebulae
    for (let i = 0; i < nebulaCount; i++) {
        nebulaEntities.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.6, // More in upper area
            radius: 100 + Math.random() * 150,  // Larger but more diffuse
            hue: Math.random() * 60 - 30,
            opacity: 0.015 + Math.random() * 0.015,  // Much more subtle
            pulseSpeed: 0.015 + Math.random() * 0.025,  // Very slow
            pulseOffset: Math.random() * Math.PI * 10  // Large offset to prevent sync
        });
    }

    starInitialized = true;
    console.log(`⭐ Created ${starEntities.length} stars, ${nebulaEntities.length} nebulae`);
}

/**
 * Create a shooting star with realistic properties
 */
function createShootingStar(width, height) {
    const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.3; // 35-75 degree angle
    const speed = 400 + Math.random() * 500;
    const isLong = Math.random() < 0.3; // 30% are longer, more dramatic

    return {
        x: Math.random() * width * 0.8, // Start more to the left
        y: Math.random() * height * 0.3, // Start in upper portion
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: isLong ? 60 + Math.random() * 80 : 25 + Math.random() * 40,
        life: 1.0,
        decay: isLong ? 0.4 + Math.random() * 0.3 : 0.7 + Math.random() * 0.6,
        brightness: 0.8 + Math.random() * 0.2,
        // Trail fragments for realism
        fragments: [],
        lastFragmentTime: 0,
        fragmentInterval: 30 + Math.random() * 20,
        // Terminal flare (brightens before dying)
        willFlare: Math.random() < 0.4,
        flareIntensity: 1.5 + Math.random() * 1.0
    };
}

/**
 * Get or create cached gradient
 */
function getGradient(ctx, height) {
    const colorTheme = getSetting("ChristmasTheme.Background.ColorTheme") || "classic";

    if (cachedGradient && cachedTheme === colorTheme && cachedHeight === height) {
        return cachedGradient;
    }

    const theme = BACKGROUND_THEMES[colorTheme] || BACKGROUND_THEMES.classic;
    if (!theme) {
        console.warn("No theme found for", colorTheme);
        return null;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.top || '#05004c');
    gradient.addColorStop(0.5, theme.bottom || '#110E19');
    gradient.addColorStop(1, theme.bottom || '#110E19');

    cachedGradient = gradient;
    cachedTheme = colorTheme;
    cachedHeight = height;

    return gradient;
}

/**
 * Get a color for background snowflakes based on current settings
 */
function getBgSnowflakeColor() {
    const colorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
    const christmasColors = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");

    switch (colorScheme) {
        case "blue":
            const blueVariants = ['#d4f1f9', '#c8e8f0', '#b8dce8'];
            return blueVariants[Math.floor(Math.random() * blueVariants.length)];
        case "rainbow":
            const rainbowPalette = ['#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#ffdfba'];
            return rainbowPalette[Math.floor(Math.random() * rainbowPalette.length)];
        case "match":
            const selectedPalette = COLOR_SCHEMES[christmasColors] || COLOR_SCHEMES.traditional;
            return selectedPalette[Math.floor(Math.random() * selectedPalette.length)];
        case "newyear":
            return COLOR_SCHEMES.newyear[Math.floor(Math.random() * 5)];
        default:
            const whiteVariants = ['#ffffff', '#f8f9fa', '#f1f3f5'];
            return whiteVariants[Math.floor(Math.random() * whiteVariants.length)];
    }
}

/**
 * Initialize background snowflakes for depth effect (drawn on canvas behind nodes)
 */
function initBgSnowflakes(width, height) {
    bgSnowflakeEntities = [];
    const count = 45; // Match approximate foreground count

    for (let i = 0; i < count; i++) {
        // Mix of sizes - some small (distant), some larger (closer but still behind)
        const sizeRoll = Math.random();
        let size, opacity;

        if (sizeRoll < 0.5) {
            // Smaller, more distant flakes (50%)
            size = 2 + Math.random() * 3;
            opacity = 0.25 + Math.random() * 0.2;
        } else if (sizeRoll < 0.85) {
            // Medium flakes (35%)
            size = 4 + Math.random() * 3;
            opacity = 0.35 + Math.random() * 0.25;
        } else {
            // Larger flakes, still behind nodes (15%)
            size = 6 + Math.random() * 3;
            opacity = 0.4 + Math.random() * 0.2;
        }

        bgSnowflakeEntities.push({
            x: Math.random() * width,
            y: Math.random() * height, // Distribute across full height initially
            size: size,
            opacity: opacity,
            color: getBgSnowflakeColor(), // Match color scheme
            speed: 8 + Math.random() * 10, // Pixels per second (slower)
            drift: (Math.random() - 0.5) * 25, // Horizontal drift amplitude
            driftSpeed: 0.2 + Math.random() * 0.3, // Drift oscillation speed
            driftOffset: Math.random() * Math.PI * 2, // Phase offset
            rotation: Math.random() * Math.PI * 2, // Initial rotation
            rotationSpeed: (Math.random() - 0.5) * 0.3, // Slow rotation
            flakeType: ['branched', 'minimal', 'stellar', 'emoji1', 'emoji2', 'emoji3', 'dendrite', 'ornate'][Math.floor(Math.random() * 8)] // Random type
        });
    }
    bgSnowflakesInitialized = true;
    console.log(`❄️ Created ${count} background canvas snowflakes`);
}

/**
 * Draw a 6-pointed snowflake shape at the given position
 */
function drawSnowflake(ctx, x, y, size, rotation, glowAmount = 0, color = null) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Apply glow inside save/restore
    if (glowAmount > 0 && color) {
        ctx.shadowBlur = glowAmount;
        ctx.shadowColor = color;
    }

    // Draw 6 spokes
    for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);

        // Main spoke
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // Small branches on each spoke (if size is large enough)
        if (size > 4) {
            const branchLen = size * 0.35;
            const branchPos = size * 0.55;

            ctx.beginPath();
            ctx.moveTo(0, -branchPos);
            ctx.lineTo(-branchLen * 0.5, -branchPos - branchLen * 0.5);
            ctx.moveTo(0, -branchPos);
            ctx.lineTo(branchLen * 0.5, -branchPos - branchLen * 0.5);
            ctx.stroke();
        }
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a minimal alternate snowflake - simple arms with single branch pair
 */
function drawCrystalSnowflake(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Draw 6 main arms with single branch pair each
    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);

        // Main arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // Single pair of branches at 55% height
        if (size > 3) {
            const branchY = -size * 0.55;
            const branchLen = size * 0.35;
            const branchAngle = Math.PI / 5; // 36 degrees

            // Left branch
            ctx.beginPath();
            ctx.moveTo(0, branchY);
            ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
            ctx.stroke();

            // Right branch
            ctx.beginPath();
            ctx.moveTo(0, branchY);
            ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Small center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a stellar dendrite snowflake - more complex with double branch layers
 */
function drawStellarSnowflake(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Draw 6 main arms with double branch pairs
    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);

        // Main arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // Two pairs of branches at different heights
        const positions = [0.4, 0.7];
        for (const pos of positions) {
            const branchY = -size * pos;
            const branchLen = size * (0.45 - pos * 0.3);
            const branchAngle = Math.PI / 4;

            // Left branch
            ctx.beginPath();
            ctx.moveTo(0, branchY);
            ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
            ctx.stroke();

            // Right branch  
            ctx.beginPath();
            ctx.moveTo(0, branchY);
            ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
            ctx.stroke();
        }

        // Small tip accent
        if (size > 4) {
            ctx.beginPath();
            ctx.arc(0, -size, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw emoji-style snowflake ❄ (U+2744) - Classic with serif tips and symmetric side branches
 */
function drawEmoji2744(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);

        // Main arm with slight thickening at base
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.1);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // Serif/arrow tip at end of arm (like the emoji)
        const tipSize = size * 0.15;
        ctx.beginPath();
        ctx.moveTo(-tipSize, -size + tipSize * 0.7);
        ctx.lineTo(0, -size);
        ctx.lineTo(tipSize, -size + tipSize * 0.7);
        ctx.stroke();

        // Side branches - single pair at 60% height, angled outward
        const branchY = -size * 0.6;
        const branchLen = size * 0.3;
        const angle = Math.PI / 4; // 45 degrees

        ctx.beginPath();
        ctx.moveTo(0, branchY);
        ctx.lineTo(-Math.sin(angle) * branchLen, branchY - Math.cos(angle) * branchLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, branchY);
        ctx.lineTo(Math.sin(angle) * branchLen, branchY - Math.cos(angle) * branchLen);
        ctx.stroke();

        ctx.restore();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw emoji-style snowflake ❅ (U+2745) - Simple with pronounced center circle
 */
function drawEmoji2745(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Pronounced center circle (like the emoji)
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
    ctx.stroke();

    // 6 straight arms extending from center circle
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const startR = size * 0.18;
        const endR = size;

        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
        ctx.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR);
        ctx.stroke();

        // Small perpendicular cross at 65% length
        const crossPos = size * 0.65;
        const crossLen = size * 0.12;
        const px = Math.cos(angle) * crossPos;
        const py = Math.sin(angle) * crossPos;
        const perpAngle = angle + Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(px - Math.cos(perpAngle) * crossLen, py - Math.sin(perpAngle) * crossLen);
        ctx.lineTo(px + Math.cos(perpAngle) * crossLen, py + Math.sin(perpAngle) * crossLen);
        ctx.stroke();

        // Small dot at tip
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * endR, Math.sin(angle) * endR, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Draw emoji-style snowflake ❆ (U+2746) - Heavy/bold with arrow-style arms
 */
function drawEmoji2746(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Use slightly thicker lines for bold look
    const origWidth = ctx.lineWidth;
    ctx.lineWidth = origWidth * 1.3;

    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);

        // Main arm
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.12);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // Bold arrow/chevron shape pointing outward (the distinctive feature of ❆)
        const chevY = -size * 0.5;
        const chevLen = size * 0.28;
        const chevAngle = Math.PI / 5; // ~36 degrees

        // Draw as connected chevron
        ctx.beginPath();
        ctx.moveTo(-Math.sin(chevAngle) * chevLen, chevY + Math.cos(chevAngle) * chevLen * 0.5);
        ctx.lineTo(0, chevY);
        ctx.lineTo(Math.sin(chevAngle) * chevLen, chevY + Math.cos(chevAngle) * chevLen * 0.5);
        ctx.stroke();

        // Small arrow tip at arm end
        const tipY = -size;
        const tipLen = size * 0.12;
        ctx.beginPath();
        ctx.moveTo(-tipLen * 0.6, tipY + tipLen);
        ctx.lineTo(0, tipY);
        ctx.lineTo(tipLen * 0.6, tipY + tipLen);
        ctx.stroke();

        ctx.restore();
    }

    ctx.lineWidth = origWidth;

    // Bold center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a dendrite-style snowflake - fernlike with multiple branch levels
 */
function drawDendriteSnowflake(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);

        // Main arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // Three branch pairs at different heights
        const positions = [0.4, 0.6, 0.8];
        positions.forEach((pos, idx) => {
            const branchY = -size * pos;
            const branchLen = size * (0.3 - idx * 0.06);
            const branchAngle = Math.PI / 4;

            ctx.beginPath();
            ctx.moveTo(0, branchY);
            ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, branchY);
            ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
            ctx.stroke();
        });

        ctx.restore();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw an ornate-style snowflake - decorative with diamond tips
 */
function drawOrnateSnowflake(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);

        // Main arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size * 0.9);
        ctx.stroke();

        // Diamond tip
        const tipY = -size * 0.9;
        const dSize = size * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, tipY - dSize);
        ctx.lineTo(dSize * 0.6, tipY);
        ctx.lineTo(0, tipY + dSize);
        ctx.lineTo(-dSize * 0.6, tipY);
        ctx.closePath();
        ctx.fill();

        // Branches at 50%
        const branchY = -size * 0.5;
        const branchLen = size * 0.3;
        const branchAngle = Math.PI / 3;

        ctx.beginPath();
        ctx.moveTo(0, branchY);
        ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, branchY);
        ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
        ctx.stroke();

        ctx.restore();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw the enhanced background onto the canvas context
 */
function drawEnhancedBackground(ctx, width, height) {
    if (!isPageVisible) return;
    if (!getSetting("ChristmasTheme.Background.Enabled")) return;

    const now = performance.now();
    const deltaTime = (now - lastAnimationTime) / 1000;
    lastAnimationTime = now;

    // FPS tracking
    frameCount++;
    if (now - lastFpsCheck >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsCheck = now;
    }

    const lowPerfMode = currentFps < 30;

    // Initialize stars if needed
    if (!starInitialized || cachedWidth !== width || cachedHeight !== height) {
        cachedWidth = width;
        cachedHeight = height;
        initStars(width, height);
    }

    // Initialize background snowflakes if snow is enabled
    const snowEnabled = getSetting("ChristmasTheme.Snowflake.Enabled");
    if (snowEnabled && (!bgSnowflakesInitialized || cachedWidth !== width || cachedHeight !== height)) {
        initBgSnowflakes(width, height);
    }

    // Check for color scheme changes and update all snowflake colors
    if (snowEnabled && bgSnowflakeEntities.length > 0) {
        const currentSnowflakeColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
        const currentChristmasColorScheme = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");

        if (currentSnowflakeColorScheme !== lastBgSnowflakeColorScheme ||
            (currentSnowflakeColorScheme === "match" && currentChristmasColorScheme !== lastBgColorScheme)) {
            updateBgSnowflakeColors();
            lastBgSnowflakeColorScheme = currentSnowflakeColorScheme;
            lastBgColorScheme = currentChristmasColorScheme;
        }
    }

    // Draw gradient background
    ctx.save();
    const gradient = getGradient(ctx, height);
    if (gradient) {
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3; // Subtle overlay
        ctx.fillRect(0, 0, width, height);
    }

    // Draw stars by layer for proper depth effect (if enabled)
    const starsEnabled = getSetting("ChristmasTheme.Background.Stars");
    const partyMode = getSetting("ChristmasTheme.Background.PartyMode");
    const colorTheme = getSetting("ChristmasTheme.Background.ColorTheme") || "classic";
    const theme = BACKGROUND_THEMES[colorTheme] || BACKGROUND_THEMES.classic;
    const time = now / 1000;

    // Party mode color palette (vibrant rave colors)
    const partyColors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ff00ff', '#ffff00', '#00ff00'];

    if (starsEnabled) {
        for (const star of starEntities) {
            // Skip more stars in low perf mode, prioritize visible ones
            if (lowPerfMode) {
                if (star.layer === 'distant' && Math.random() > 0.3) continue;
                if (star.layer === 'normal' && Math.random() > 0.6) continue;
            }

            // Calculate twinkle with per-star variation to prevent sync
            let starSpeed = star.twinkleSpeed * star.twinkleSpeedMod;
            let opacity, starColor;

            if (partyMode) {
                // Party mode: rapid twinkle and color cycling
                starSpeed *= 8; // Much faster twinkle
                const fastTwinkle = Math.sin(time * starSpeed + star.twinkleOffset);
                const colorIndex = Math.floor((time * 3 + star.twinkleOffset) % partyColors.length);
                starColor = partyColors[colorIndex];
                opacity = star.baseOpacity * (0.4 + Math.abs(fastTwinkle) * 0.6);
            } else {
                // Normal mode
                const twinkle = Math.sin(time * starSpeed + star.twinkleOffset);
                const twinkle2 = Math.sin(time * starSpeed * 0.67 + star.twinkleOffset2);
                const combinedTwinkle = (twinkle * 0.6 + twinkle2 * 0.4);
                opacity = star.baseOpacity * (0.5 + combinedTwinkle * 0.5);
                starColor = star.color;
            }

            // Use star's color (or party color)
            ctx.fillStyle = starColor;

            // Apply layer-based rendering
            if (star.hasGlow && !lowPerfMode) {
                // Bright stars get a subtle glow (enhanced in party mode)
                ctx.shadowBlur = partyMode ? star.size * 10 : star.size * 5;
                ctx.shadowColor = starColor;
                ctx.globalAlpha = opacity * (partyMode ? 0.9 : 0.7);
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * (partyMode ? 1.3 : 1), 0, Math.PI * 2);
                ctx.fill();

                // Draw diffraction spikes on some bright stars - subtle and thin (skip in party mode)
                if (star.hasSpikes && !partyMode) {
                    const combinedTwinkle = Math.sin(time * starSpeed + star.twinkleOffset);
                    ctx.shadowBlur = 0;
                    const spikeLength = star.size * 4 * (0.6 + combinedTwinkle * 0.4);
                    ctx.strokeStyle = starColor;
                    ctx.lineWidth = 0.3;  // Thinner spikes
                    ctx.globalAlpha = opacity * 0.25;  // More subtle

                    // 4-point cross spikes
                    ctx.beginPath();
                    ctx.moveTo(star.x - spikeLength, star.y);
                    ctx.lineTo(star.x + spikeLength, star.y);
                    ctx.moveTo(star.x, star.y - spikeLength);
                    ctx.lineTo(star.x, star.y + spikeLength);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
            } else {
                // Regular stars - simple circles
                ctx.globalAlpha = opacity * (partyMode ? 0.7 : 0.5);
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * (partyMode ? 1.2 : 1), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Atmospheric glow at horizon (subtle light pollution effect)
    if (!lowPerfMode) {
        const horizonGlow = ctx.createLinearGradient(0, height * 0.7, 0, height);
        horizonGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
        horizonGlow.addColorStop(0.5, 'rgba(20, 30, 60, 0.05)');
        horizonGlow.addColorStop(1, 'rgba(40, 50, 80, 0.1)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
    }

    // Draw nebula clouds (soft glowing areas) - skip in low perf mode
    if (!lowPerfMode && nebulaEntities.length > 0) {
        for (const nebula of nebulaEntities) {
            // Very subtle, slow pulse - barely noticeable
            const pulse = Math.sin(time * nebula.pulseSpeed + nebula.pulseOffset);
            const nebulaOpacity = nebula.opacity * (0.9 + pulse * 0.1);  // Only 10% variation

            // Create radial gradient for soft nebula effect
            const nebulaGradient = ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.radius
            );

            // More subtle, lower opacity nebula colors
            nebulaGradient.addColorStop(0, `rgba(80, 120, 200, ${nebulaOpacity * 0.6})`);
            nebulaGradient.addColorStop(0.4, `rgba(60, 100, 180, ${nebulaOpacity * 0.3})`);
            nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.globalAlpha = 1;
            ctx.fillStyle = nebulaGradient;
            ctx.beginPath();
            ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw background snowflakes (canvas-based, behind nodes)
    if (snowEnabled && bgSnowflakeEntities.length > 0) {
        ctx.lineCap = 'round';
        const glowIntensity = getSetting("ChristmasTheme.Snowflake.Glow") || 10;

        for (const flake of bgSnowflakeEntities) {
            // Update position
            flake.y += flake.speed * deltaTime;

            // Update rotation
            flake.rotation += flake.rotationSpeed * deltaTime;

            // Horizontal drift using sine wave
            const driftX = Math.sin(time * flake.driftSpeed + flake.driftOffset) * flake.drift;

            // Wrap around when off screen
            if (flake.y > height + 20) {
                flake.y = -20;
                flake.x = Math.random() * width;
                flake.color = getBgSnowflakeColor(); // Get new color on wrap
                flake.flakeType = ['branched', 'minimal', 'stellar', 'emoji1', 'emoji2', 'emoji3', 'dendrite', 'ornate'][Math.floor(Math.random() * 8)]; // Random new type
            }

            // Draw the snowflake shape with color and glow
            ctx.globalAlpha = flake.opacity;
            ctx.strokeStyle = flake.color;
            ctx.fillStyle = flake.color;
            ctx.lineWidth = Math.max(0.5, flake.size * 0.12);

            // Draw subtle glow (matching CSS drop-shadow appearance)
            const glowAmount = Math.min(glowIntensity * 0.4, 8);
            if (glowAmount > 0.5) {
                // Convert hex color to rgba for canvas compatibility
                const hexToRgba = (hex, alpha) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };

                const glowRadius = flake.size * 0.6 + glowAmount;
                const gradient = ctx.createRadialGradient(
                    flake.x + driftX, flake.y, flake.size * 0.1,
                    flake.x + driftX, flake.y, glowRadius
                );
                gradient.addColorStop(0, hexToRgba(flake.color, 0.4));
                gradient.addColorStop(0.5, hexToRgba(flake.color, 0.15));
                gradient.addColorStop(1, hexToRgba(flake.color, 0));
                ctx.globalAlpha = flake.opacity;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(flake.x + driftX, flake.y, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                // Reset for snowflake
                ctx.fillStyle = flake.color;
            }

            // Draw snowflake using appropriate style
            if (flake.flakeType === 'minimal') {
                drawCrystalSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            } else if (flake.flakeType === 'stellar') {
                drawStellarSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            } else if (flake.flakeType === 'emoji1') {
                drawEmoji2744(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            } else if (flake.flakeType === 'emoji2') {
                drawEmoji2745(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            } else if (flake.flakeType === 'emoji3') {
                drawEmoji2746(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            } else if (flake.flakeType === 'dendrite') {
                drawDendriteSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            } else if (flake.flakeType === 'ornate') {
                drawOrnateSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            } else {
                drawSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            }
        }
    }

    // Shooting stars - occasional spectacular effect (when enabled)
    const shootingStarsEnabled = getSetting("ChristmasTheme.Background.ShootingStars");
    if (!lowPerfMode && shootingStarsEnabled) {
        // Spawn new shooting star occasionally (average every 10 seconds for calmer feel)
        if (now - lastShootingStarTime > 10000 && Math.random() < 0.02) {
            shootingStars.push(createShootingStar(width, height));
            lastShootingStarTime = now;
        }

        // Update and draw shooting stars
        ctx.lineCap = 'round';
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const star = shootingStars[i];

            // Update position
            star.x += star.vx * deltaTime;
            star.y += star.vy * deltaTime;
            star.life -= star.decay * deltaTime;

            // Remove dead stars
            if (star.life <= 0 || star.x > width + 50 || star.y > height + 50) {
                shootingStars.splice(i, 1);
                continue;
            }

            // Calculate direction vector
            const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
            const dirX = star.vx / speed;
            const dirY = star.vy / speed;

            // Terminal flare effect
            let intensityMod = 1.0;
            if (star.willFlare && star.life < 0.3) {
                intensityMod = star.flareIntensity * (1 - star.life / 0.3) * star.life * 3;
            }

            // Draw trail fragments (small particles behind)
            if (now - star.lastFragmentTime > star.fragmentInterval && star.fragments.length < 8) {
                star.fragments.push({
                    x: star.x - dirX * 3,
                    y: star.y - dirY * 3,
                    life: 0.5,
                    size: 0.3 + Math.random() * 0.4
                });
                star.lastFragmentTime = now;
            }

            // Update and draw fragments
            for (let j = star.fragments.length - 1; j >= 0; j--) {
                const frag = star.fragments[j];
                frag.life -= deltaTime * 2;
                if (frag.life <= 0) {
                    star.fragments.splice(j, 1);
                    continue;
                }
                ctx.fillStyle = `rgba(255, 200, 150, ${frag.life * 0.4})`;
                ctx.globalAlpha = frag.life;
                ctx.beginPath();
                ctx.arc(frag.x, frag.y, frag.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw main trail with warm-to-white gradient
            const tailX = star.x - dirX * star.length * star.life;
            const tailY = star.y - dirY * star.length * star.life;

            const trailGradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
            trailGradient.addColorStop(0, 'rgba(255, 180, 100, 0)');
            trailGradient.addColorStop(0.4, `rgba(255, 200, 150, ${star.life * star.brightness * 0.2 * intensityMod})`);
            trailGradient.addColorStop(0.8, `rgba(255, 240, 220, ${star.life * star.brightness * 0.5 * intensityMod})`);
            trailGradient.addColorStop(1, `rgba(255, 255, 255, ${star.life * star.brightness * 0.9 * intensityMod})`);

            ctx.strokeStyle = trailGradient;
            ctx.lineWidth = 1 + star.life * 1.5;
            ctx.globalAlpha = star.life;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(star.x, star.y);
            ctx.stroke();

            // Glowing head with warm core
            const headSize = (1.2 + star.life) * intensityMod;
            ctx.shadowBlur = 10 * intensityMod;
            ctx.shadowColor = '#ffffcc';
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = star.life * star.brightness * intensityMod;
            ctx.beginPath();
            ctx.arc(star.x, star.y, headSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // Fireworks effect (when enabled or during finale)
    const fireworksEnabled = getSetting("ChristmasTheme.Background.Fireworks") || finaleActive;
    if (fireworksEnabled) {
        // Check if finale is still active
        if (finaleActive && now - finaleStartTime > FINALE_DURATION) {
            finaleActive = false;
            console.log("🎆 Finale ended");
        }

        // Spawn rate depends on finale state
        const spawnInterval = finaleActive ? 100 + Math.random() * 150 : 2000 + Math.random() * 2000;
        if (now - lastFireworkTime > spawnInterval) {
            const spawnCount = finaleActive ? 2 + Math.floor(Math.random() * 3) : 1;
            for (let s = 0; s < spawnCount; s++) {
                const rocket = createFireworkRocket(width, height);
                // Special golden fireworks during finale (30% chance)
                if (finaleActive && Math.random() < 0.3) {
                    rocket.palette = ['#ffd700', '#ffec99', '#fff9db'];
                    rocket.vy = -14 - Math.random() * 6;
                }
                fireworkRockets.push(rocket);
            }
            lastFireworkTime = now;
        }

        // Update and draw rockets with enhanced trails
        for (let i = fireworkRockets.length - 1; i >= 0; i--) {
            const rocket = fireworkRockets[i];

            // Apply gravity
            rocket.vy += 0.12;
            rocket.x += rocket.vx;
            rocket.y += rocket.vy;
            rocket.age += deltaTime;
            rocket.trailTimer += deltaTime;

            // Add trail points more frequently
            if (rocket.trailTimer > 0.02) {
                rocket.trail.push({ x: rocket.x, y: rocket.y, alpha: 1, size: rocket.size });
                rocket.trailTimer = 0;
            }
            // Keep more trail points for longer trails
            if (rocket.trail.length > 20) rocket.trail.shift();

            // Explode when velocity slows
            if (rocket.vy > -2 && !rocket.exploded) {
                rocket.exploded = true;
                fireworkParticles.push(...createExplosionParticles(rocket.x, rocket.y, rocket.palette, rocket.explosionType));
                fireworkRockets.splice(i, 1);
                continue;
            }

            if (rocket.age > 5) {
                fireworkRockets.splice(i, 1);
                continue;
            }

            // Draw enhanced rocket trail with gradient
            const primaryColor = rocket.palette[0];
            for (let j = 0; j < rocket.trail.length; j++) {
                const point = rocket.trail[j];
                const progress = j / rocket.trail.length;
                const alpha = progress * 0.8;
                const size = point.size * progress * 0.8;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = primaryColor;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw rocket head with bright glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = primaryColor;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(rocket.x, rocket.y, rocket.size + 1, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core
            ctx.fillStyle = primaryColor;
            ctx.beginPath();
            ctx.arc(rocket.x, rocket.y, rocket.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Update and draw explosion particles with trails
        for (let i = fireworkParticles.length - 1; i >= 0; i--) {
            const p = fireworkParticles[i];

            // Store trail before updating position
            if (p.hasTrail && p.trail) {
                p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
                if (p.trail.length > 8) p.trail.shift();
            }

            // Apply physics
            p.vy += p.gravity || 0.04;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.985;
            p.vy *= 0.985;
            p.alpha -= p.decay;

            // Handle crackle effect
            if (p.crackle && p.crackleTime !== undefined) {
                p.crackleTime -= deltaTime;
                if (p.crackleTime <= 0 && p.alpha > 0.3) {
                    // Create mini explosion
                    for (let c = 0; c < 5; c++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 1 + Math.random() * 2;
                        fireworkSparks.push({
                            x: p.x, y: p.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            alpha: 0.8,
                            size: 0.8,
                            decay: 0.05,
                            twinkle: Math.random() * Math.PI * 2
                        });
                    }
                    p.crackle = false;
                }
            }

            // Remove faded
            if (p.alpha <= 0) {
                fireworkParticles.splice(i, 1);
                continue;
            }

            // Draw particle trail first (behind main particle)
            if (p.hasTrail && p.trail && p.trail.length > 0) {
                for (let t = 0; t < p.trail.length; t++) {
                    const tp = p.trail[t];
                    const trailAlpha = (t / p.trail.length) * p.alpha * 0.5;
                    const trailSize = p.size * (t / p.trail.length) * 0.7;
                    ctx.globalAlpha = trailAlpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(tp.x, tp.y, trailSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw main particle with glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Update and draw sparks/glitter
        for (let i = fireworkSparks.length - 1; i >= 0; i--) {
            const s = fireworkSparks[i];

            s.vy += 0.03;
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= s.decay;
            s.twinkle += 0.3;

            if (s.alpha <= 0) {
                fireworkSparks.splice(i, 1);
                continue;
            }

            // Twinkle effect
            const twinkleAlpha = s.alpha * (0.5 + Math.sin(s.twinkle) * 0.5);

            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = twinkleAlpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

/**
 * Hook into LGraphCanvas to draw our background
 */
function installBackgroundHook() {
    if (!app.canvas) {
        console.log("Waiting for app.canvas to install background hook...");
        setTimeout(installBackgroundHook, 100);
        return;
    }

    const canvas = app.canvas;

    // Store original method
    if (!originalDrawBackCanvas) {
        originalDrawBackCanvas = canvas.constructor.prototype.drawBackCanvas;
    }

    // Override drawBackCanvas to add our background
    canvas.constructor.prototype.drawBackCanvas = function () {
        // Call original first (clears background, draws grid)
        if (originalDrawBackCanvas) {
            originalDrawBackCanvas.apply(this, arguments);
        }

        // Then draw our enhanced background on top (wrapped in try-catch to not break ComfyUI)
        try {
            if (getSetting("ChristmasTheme.Background.Enabled") && this.bgctx) {
                drawEnhancedBackground(this.bgctx, this.bgcanvas.width, this.bgcanvas.height);
            }
        } catch (e) {
            console.error("Enhanced background error:", e);
        }
    };

    // Force a redraw
    canvas.setDirty(true, true);
    console.log("✨ Background hook installed successfully");
}

/**
 * Remove background hook and restore original
 */
function removeBackgroundHook() {
    if (originalDrawBackCanvas && app.canvas) {
        app.canvas.constructor.prototype.drawBackCanvas = originalDrawBackCanvas;
        app.canvas.setDirty(true, true);
    }
    starEntities = [];
    starInitialized = false;
    cachedGradient = null;
}

app.registerExtension({
    name: "Comfy.EnhancedBackground",
    async setup() {
        // Prevent double setup
        if (extensionSetupComplete) {
            return;
        }
        extensionSetupComplete = true;

        console.log("🎨 Setting up Enhanced Background extension...");

        // Initialize settings cache
        initSettingsCache();

        // Add settings with onChange callbacks to update cache
        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.Enabled",
            name: "🌟 Background Effect",
            type: "combo",
            options: [
                { value: true, text: "✨ On" },
                { value: false, text: "⭘ Off" }
            ],
            defaultValue: true,
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.Enabled", value);
                if (isInitialSetup) return;

                if (value) {
                    installBackgroundHook();
                } else {
                    removeBackgroundHook();
                }

                // Force redraw
                if (app.canvas) {
                    app.canvas.setDirty(true, true);
                }
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.ColorTheme",
            name: "🎨 Color Theme",
            type: "combo",
            options: [
                { value: "classic", text: "🌌 Classic Night" },
                { value: "christmas", text: "🎄 Christmas Forest" },
                { value: "candycane", text: "🍬 Candy Cane Red" },
                { value: "frostnight", text: "❄️ Frost Night" },
                { value: "gingerbread", text: "🍪 Gingerbread" },
                { value: "darknight", text: "🌑 Dark Night" }
            ],
            defaultValue: "classic",
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.ColorTheme", value);
                if (isInitialSetup) return;

                // Invalidate gradient cache
                cachedGradient = null;

                // Force redraw
                if (app.canvas) {
                    app.canvas.setDirty(true, true);
                }
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.ShootingStars",
            name: "☄️ Shooting Stars",
            type: "combo",
            options: [
                { value: true, text: "✨ On" },
                { value: false, text: "⭘ Off" }
            ],
            defaultValue: true,
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.ShootingStars", value);
                if (isInitialSetup) return;

                // Clear existing shooting stars if disabled
                if (!value) {
                    shootingStars = [];
                }

                // Force redraw
                if (app.canvas) {
                    app.canvas.setDirty(true, true);
                }
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.Stars",
            name: "⭐ Background Stars",
            type: "combo",
            options: [
                { value: true, text: "✨ On" },
                { value: false, text: "⭘ Off" }
            ],
            defaultValue: true,
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.Stars", value);
                if (isInitialSetup) return;
                if (app.canvas) {
                    app.canvas.setDirty(true, true);
                }
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.PartyMode",
            name: "🪩 Party Mode (Rave Stars)",
            type: "combo",
            options: [
                { value: true, text: "🎉 On" },
                { value: false, text: "⭘ Off" }
            ],
            defaultValue: false,
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.PartyMode", value);
                if (isInitialSetup) return;
                if (app.canvas) {
                    app.canvas.setDirty(true, true);
                }
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.Fireworks",
            name: "🎆 Fireworks",
            type: "combo",
            options: [
                { value: true, text: "🎇 On" },
                { value: false, text: "⭘ Off" }
            ],
            defaultValue: false,
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.Fireworks", value);
                if (isInitialSetup) return;
                // Clear existing fireworks when disabled
                if (!value) {
                    fireworkRockets = [];
                    fireworkParticles = [];
                }
                if (app.canvas) {
                    app.canvas.setDirty(true, true);
                }
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.Countdown",
            name: "🎊 New Year Countdown",
            type: "combo",
            options: [
                { value: true, text: "🕐 On" },
                { value: false, text: "⭘ Off" }
            ],
            defaultValue: false,
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.Countdown", value);
                if (isInitialSetup) return;
                toggleCountdownDisplay(value);
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Background.ShowFinaleButton",
            name: "🎆 Show Finale Button",
            tooltip: "Turn on if you don't like surprises or wait till 00:00:00 for the show!",
            type: "combo",
            options: [
                { value: true, text: "🎇 Show" },
                { value: false, text: "🎁 Surprise" }
            ],
            defaultValue: false,
            section: "Background Theme",
            onChange: async (value) => {
                updateCache("ChristmasTheme.Background.ShowFinaleButton", value);
                if (isInitialSetup) return;
                if (value && getSetting("ChristmasTheme.Background.Countdown")) {
                    showFinaleButton();
                } else {
                    hideFinaleButton();
                }
            }
        });

        // Load stored values AFTER settings are registered
        loadSettingFromStorage("ChristmasTheme.Background.Enabled");
        loadSettingFromStorage("ChristmasTheme.Background.ColorTheme");
        loadSettingFromStorage("ChristmasTheme.Background.Stars");
        loadSettingFromStorage("ChristmasTheme.Background.PartyMode");
        loadSettingFromStorage("ChristmasTheme.Background.ShootingStars");
        loadSettingFromStorage("ChristmasTheme.Background.Fireworks");
        loadSettingFromStorage("ChristmasTheme.Background.Countdown");
        loadSettingFromStorage("ChristmasTheme.Background.ShowFinaleButton");

        // Mark initial setup complete
        isInitialSetup = false;

        // Install hook if enabled
        if (getSetting("ChristmasTheme.Background.Enabled")) {
            installBackgroundHook();
        }

        // Initialize countdown if enabled
        if (getSetting("ChristmasTheme.Background.Countdown")) {
            toggleCountdownDisplay(true);
        }

        // Return cleanup function
        return () => {
            removeBackgroundHook();
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            if (countdownElement) {
                countdownElement.remove();
            }
        };
    }
});

// Export visibility state for other modules
export { isPageVisible };