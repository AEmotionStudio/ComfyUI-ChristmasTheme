// aether-snow.js - Foreground snowfall effect (DOM-based)
// Background snowflakes are rendered via canvas in background-themes.js for proper depth
import { app } from "../../scripts/app.js";
import { getSetting, updateCache, loadSettingFromStorage, COLOR_SCHEMES } from "./settings-cache.js";
import { isPageVisible } from "./background-themes.js";

const SNOWFLAKE_CONFIG = {
    MIN_SIZE: 4,
    MAX_SIZE: 14,
    FLAKE_COUNTS: {
        high: 60,
        medium: 40,
        low: 25
    },
    FALL_DURATION: {
        MIN: 35,
        MAX: 65
    },
    BATCH_SIZE: 5
};

const SNOWFLAKE_CHARS = ['❄', '❅', '❆'];

function getPerformanceTier() {
    const isLowEnd = navigator.hardwareConcurrency <= 2 ||
        navigator.deviceMemory <= 2 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isLowEnd) return 'low';

    const isHighEnd = navigator.hardwareConcurrency >= 8 &&
        (navigator.deviceMemory === undefined || navigator.deviceMemory >= 8);

    return isHighEnd ? 'high' : 'medium';
}

app.registerExtension({
    name: "Christmas.Theme.SnowEffect",
    async setup() {
        console.log("✨ Initializing Premium Snow Effect...");

        try {
            const perfTier = getPerformanceTier();
            const totalFlakes = SNOWFLAKE_CONFIG.FLAKE_COUNTS[perfTier];
            console.log(`❄️ Performance tier: ${perfTier}, using ${totalFlakes} foreground snowflakes`);

            // Foreground container (DOM-based, always on top of nodes)
            const container = document.createElement('div');
            container.id = 'comfy-aether-snow';
            Object.assign(container.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: '9999'
            });
            document.body.appendChild(container);

            const style = document.createElement('style');
            style.id = 'snowflake-styles';
            style.textContent = `
                .snowflake {
                    position: fixed;
                    top: 0;
                    pointer-events: none;
                    user-select: none;
                    z-index: 9999;
                    font-family: Arial, sans-serif;
                    will-change: transform;
                    filter: drop-shadow(0 0 2px rgba(255,255,255,0.3));
                }

                .snow-paused .snowflake {
                    animation-play-state: paused !important;
                }
            `;

            // Generate smooth drift patterns
            const driftPatterns = [];
            for (let i = 0; i < 15; i++) {
                const driftAmp = 50 + Math.random() * 50;
                const driftFreq = 1 + Math.random() * 1.5;
                const phase = Math.random() * Math.PI * 2;

                let keyframes = '';
                const steps = 10;

                for (let s = 0; s <= steps; s++) {
                    const pct = s * (100 / steps);
                    const y = Math.round((s / steps) * 110 - 5);
                    const progress = s / steps;
                    const x = Math.round(Math.sin(progress * driftFreq * Math.PI + phase) * driftAmp);

                    let opacity = 'var(--flake-opacity, 0.6)';
                    if (s === 0 || s === steps) opacity = '0';
                    if (s === 1 || s === steps - 1) opacity = 'var(--flake-opacity, 0.6)';

                    keyframes += `
                        ${pct}% { 
                            transform: translate(${x}px, ${y}vh);
                            opacity: ${opacity};
                        }
                    `;
                }

                driftPatterns.push(`
                    @keyframes graceful-snow-${i} {
                        ${keyframes}
                    }
                `);
            }

            style.textContent += driftPatterns.join('\n');
            document.head.appendChild(style);

            let flakes = [];
            let currentBatch = 0;
            let isInitializing = true;
            const batchSize = SNOWFLAKE_CONFIG.BATCH_SIZE;

            const getSnowflakeColor = () => {
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
            };

            const createSnowflakeElement = (index) => {
                const size = SNOWFLAKE_CONFIG.MIN_SIZE +
                    Math.random() * (SNOWFLAKE_CONFIG.MAX_SIZE - SNOWFLAKE_CONFIG.MIN_SIZE);

                const sizeRatio = size / SNOWFLAKE_CONFIG.MAX_SIZE;
                const baseDuration = SNOWFLAKE_CONFIG.FALL_DURATION.MAX -
                    (sizeRatio * (SNOWFLAKE_CONFIG.FALL_DURATION.MAX - SNOWFLAKE_CONFIG.FALL_DURATION.MIN));
                const fallDuration = baseDuration * (0.9 + Math.random() * 0.2);

                const startPosition = Math.random() * 100;
                const opacity = 0.4 + sizeRatio * 0.4;
                const initialDelay = isInitializing ? Math.random() * fallDuration : 0;

                const color = getSnowflakeColor();
                const glowIntensity = getSetting("ChristmasTheme.Snowflake.Glow") || 10;
                const glowAmount = Math.min(glowIntensity * 0.5, 8);
                const animNum = Math.floor(Math.random() * 15);

                const flake = document.createElement('div');
                flake.className = 'snowflake';
                flake.textContent = SNOWFLAKE_CHARS[Math.floor(Math.random() * SNOWFLAKE_CHARS.length)];
                flake.dataset.index = index;

                Object.assign(flake.style, {
                    left: `${startPosition}vw`,
                    fontSize: `${size}px`,
                    color: color,
                    textShadow: `0 0 ${glowAmount}px ${color}`,
                    '--flake-opacity': opacity,
                    animation: `graceful-snow-${animNum} ${fallDuration}s linear infinite`,
                    animationDelay: isInitializing ? `${initialDelay}s` : '0s'
                });

                return flake;
            };

            const addBatch = () => {
                if (currentBatch * batchSize >= totalFlakes) {
                    isInitializing = false;
                    return;
                }

                const scheduleNextBatch = (callback) => {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(callback, { timeout: 100 });
                    } else {
                        setTimeout(callback, 30);
                    }
                };

                const start = currentBatch * batchSize;
                const end = Math.min(start + batchSize, totalFlakes);

                const fragment = document.createDocumentFragment();
                for (let i = start; i < end; i++) {
                    const flake = createSnowflakeElement(i);
                    flakes.push(flake);
                    fragment.appendChild(flake);
                }
                container.appendChild(fragment);

                currentBatch++;
                if (currentBatch * batchSize < totalFlakes) {
                    scheduleNextBatch(addBatch);
                }
            };

            const updateSnowflakeColors = () => {
                const glowIntensity = getSetting("ChristmasTheme.Snowflake.Glow") || 10;
                flakes.forEach(flake => {
                    const newColor = getSnowflakeColor();
                    const glowAmount = Math.min(glowIntensity * 0.5, 8);
                    flake.style.color = newColor;
                    flake.style.textShadow = `0 0 ${glowAmount}px ${newColor}`;
                });
            };

            const updateSnowflakeGlow = (value) => {
                flakes.forEach(flake => {
                    const color = flake.style.color;
                    const glowAmount = Math.min(value * 0.5, 8);
                    flake.style.textShadow = `0 0 ${glowAmount}px ${color}`;
                });
            };

            const renderSnowflakes = () => {
                container.innerHTML = '';
                const fragment = document.createDocumentFragment();
                flakes.forEach(flake => fragment.appendChild(flake));
                container.appendChild(fragment);
            };

            window.snowflakeState = {
                flakes,
                get currentBatch() { return currentBatch; },
                set currentBatch(v) { currentBatch = v; },
                get isInitializing() { return isInitializing; },
                set isInitializing(v) { isInitializing = v; },
                addBatch,
                getSnowflakeColor,
                updateSnowflakeColors,
                updateSnowflakeGlow,
                renderSnowflakes
            };

            const isEnabled = getSetting("ChristmasTheme.Snowflake.Enabled");
            container.style.display = isEnabled ? 'block' : 'none';

            if (isEnabled) {
                addBatch();
            }

            const handleVisibility = () => {
                if (document.visibilityState === 'hidden') {
                    container.classList.add('snow-paused');
                } else {
                    container.classList.remove('snow-paused');
                }
            };
            document.addEventListener('visibilitychange', handleVisibility);

            let lastKnownColorScheme = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
            let lastKnownGlowValue = getSetting("ChristmasTheme.Snowflake.Glow");
            let lastKnownSnowflakeColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");

            const checkMatchModeUpdates = setInterval(() => {
                const currentSnowSetting = getSetting("ChristmasTheme.Snowflake.Enabled");
                const currentColorScheme = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
                const currentSnowflakeColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
                const currentGlowValue = getSetting("ChristmasTheme.Snowflake.Glow");

                if (currentSnowflakeColorScheme !== lastKnownSnowflakeColorScheme) {
                    updateSnowflakeColors();
                    lastKnownSnowflakeColorScheme = currentSnowflakeColorScheme;
                }

                if (currentGlowValue !== lastKnownGlowValue) {
                    updateSnowflakeGlow(currentGlowValue);
                    lastKnownGlowValue = currentGlowValue;
                }

                if (currentSnowSetting === 1 &&
                    currentSnowflakeColorScheme === "match" &&
                    currentColorScheme !== lastKnownColorScheme) {
                    updateSnowflakeColors();
                    lastKnownColorScheme = currentColorScheme;
                }

                if (currentSnowSetting === 0 && flakes.length > 0) {
                    flakes = [];
                    currentBatch = 0;
                    container.innerHTML = '';
                    container.style.display = 'none';
                }
            }, 1000);

            return () => {
                clearInterval(checkMatchModeUpdates);
                document.removeEventListener('visibilitychange', handleVisibility);
                container.remove();
                style.remove();
            };
        } catch (error) {
            console.error("❌ Failed to initialize Snow Effect:", error);
        }
    }
});
