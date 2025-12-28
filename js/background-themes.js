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
    const count = 20; // Moderate count for good depth without clutter

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
            speed: 10 + Math.random() * 15, // Pixels per second
            drift: (Math.random() - 0.5) * 25, // Horizontal drift amplitude
            driftSpeed: 0.2 + Math.random() * 0.3, // Drift oscillation speed
            driftOffset: Math.random() * Math.PI * 2, // Phase offset
            rotation: Math.random() * Math.PI * 2, // Initial rotation
            rotationSpeed: (Math.random() - 0.5) * 0.3, // Slow rotation
            flakeType: ['branched', 'minimal', 'stellar', 'emoji1', 'emoji2', 'emoji3'][Math.floor(Math.random() * 6)] // Random type
        });
    }
    bgSnowflakesInitialized = true;
    console.log(`❄️ Created ${count} background canvas snowflakes`);
}

/**
 * Draw a 6-pointed snowflake shape at the given position
 */
function drawSnowflake(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

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

    // Draw gradient background
    ctx.save();
    const gradient = getGradient(ctx, height);
    if (gradient) {
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3; // Subtle overlay
        ctx.fillRect(0, 0, width, height);
    }

    // Draw stars by layer for proper depth effect
    const colorTheme = getSetting("ChristmasTheme.Background.ColorTheme") || "classic";
    const theme = BACKGROUND_THEMES[colorTheme] || BACKGROUND_THEMES.classic;
    const time = now / 1000;

    for (const star of starEntities) {
        // Skip more stars in low perf mode, prioritize visible ones
        if (lowPerfMode) {
            if (star.layer === 'distant' && Math.random() > 0.3) continue;
            if (star.layer === 'normal' && Math.random() > 0.6) continue;
        }

        // Calculate twinkle with per-star variation to prevent sync
        const starSpeed = star.twinkleSpeed * star.twinkleSpeedMod;
        const twinkle = Math.sin(time * starSpeed + star.twinkleOffset);
        const twinkle2 = Math.sin(time * starSpeed * 0.67 + star.twinkleOffset2);
        const combinedTwinkle = (twinkle * 0.6 + twinkle2 * 0.4);
        const opacity = star.baseOpacity * (0.5 + combinedTwinkle * 0.5);

        // Use star's individual color
        ctx.fillStyle = star.color;

        // Apply layer-based rendering
        if (star.hasGlow && !lowPerfMode) {
            // Bright stars get a subtle glow
            ctx.shadowBlur = star.size * 5;
            ctx.shadowColor = star.color;
            ctx.globalAlpha = opacity * 0.7;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();

            // Draw diffraction spikes on some bright stars - subtle and thin
            if (star.hasSpikes) {
                ctx.shadowBlur = 0;
                const spikeLength = star.size * 4 * (0.6 + combinedTwinkle * 0.4);
                ctx.strokeStyle = star.color;
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
            ctx.globalAlpha = opacity * 0.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
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
                flake.flakeType = ['branched', 'minimal', 'stellar', 'emoji1', 'emoji2', 'emoji3'][Math.floor(Math.random() * 6)]; // Random new type
            }

            // Draw the snowflake shape with color and glow
            ctx.globalAlpha = flake.opacity;
            ctx.strokeStyle = flake.color;
            ctx.fillStyle = flake.color;
            ctx.lineWidth = Math.max(0.5, flake.size * 0.12);

            // Add glow effect
            const glowAmount = Math.min(glowIntensity * 0.4, 6);
            ctx.shadowBlur = glowAmount;
            ctx.shadowColor = flake.color;

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
            } else {
                drawSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
            }

            // Reset shadow for next element
            ctx.shadowBlur = 0;
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

        // Load stored values AFTER settings are registered
        loadSettingFromStorage("ChristmasTheme.Background.Enabled");
        loadSettingFromStorage("ChristmasTheme.Background.ColorTheme");
        loadSettingFromStorage("ChristmasTheme.Background.ShootingStars");

        // Mark initial setup complete
        isInitialSetup = false;

        // Install hook if enabled
        if (getSetting("ChristmasTheme.Background.Enabled")) {
            installBackgroundHook();
        }

        // Return cleanup function
        return () => {
            removeBackgroundHook();
        };
    }
});

// Export visibility state for other modules
export { isPageVisible };