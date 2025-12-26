// aether-snow.js - Optimized snowfall effect using pure CSS animations
import { app } from "../../scripts/app.js";
import { getSetting, updateCache, loadSettingFromStorage, COLOR_SCHEMES } from "./settings-cache.js";
import { isPageVisible } from "./background-themes.js";

const SNOWFLAKE_CONFIG = {
    MIN_SIZE: 8,
    MAX_SIZE: 24,
    // Adaptive snowflake count based on performance
    FLAKE_COUNTS: {
        high: 60,    // High performance mode
        medium: 40,  // Medium performance
        low: 25      // Low performance / mobile
    },
    BASE_OPACITY: 0.8,
    FALL_DURATION: {
        MIN: 25,
        MAX: 35
    },
    BATCH_SIZE: 5 // Smaller batches for smoother loading
};

const SNOWFLAKE_CHARS = ['❅', '❆', '❄'];

// Detect device performance capability
function getPerformanceTier() {
    // Check for low-end indicators
    const isLowEnd = navigator.hardwareConcurrency <= 2 ||
        navigator.deviceMemory <= 2 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isLowEnd) return 'low';

    // Check for high-end indicators
    const isHighEnd = navigator.hardwareConcurrency >= 8 &&
        (navigator.deviceMemory === undefined || navigator.deviceMemory >= 8);

    return isHighEnd ? 'high' : 'medium';
}

app.registerExtension({
    name: "Christmas.Theme.SnowEffect",
    async setup() {
        console.log("✨ Initializing Snow Effect...");

        try {
            // Determine optimal snowflake count based on device
            const perfTier = getPerformanceTier();
            const totalFlakes = SNOWFLAKE_CONFIG.FLAKE_COUNTS[perfTier];
            console.log(`❄️ Performance tier: ${perfTier}, using ${totalFlakes} snowflakes`);

            // Create container with GPU acceleration hints
            const container = document.createElement('div');
            container.id = 'comfy-aether-snow';
            Object.assign(container.style, {
                position: 'fixed',
                top: '-10vh',
                left: '0',
                width: '100%',
                height: '200vh',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: '3',
                contain: 'strict',
                transform: 'translateZ(0)'
            });
            document.body.appendChild(container);

            // Add optimized CSS with GPU-accelerated animations
            const style = document.createElement('style');
            style.id = 'snowflake-styles';
            style.textContent = `
                @keyframes snowfall {
                    0% {
                        transform: translate3d(0, -10vh, 0);
                        opacity: 0;
                    }
                    3% {
                        opacity: ${SNOWFLAKE_CONFIG.BASE_OPACITY};
                    }
                    25% {
                        transform: translate3d(15px, 20vh, 0);
                    }
                    50% {
                        transform: translate3d(-15px, 50vh, 0);
                    }
                    75% {
                        transform: translate3d(15px, 75vh, 0);
                    }
                    95% {
                        opacity: ${SNOWFLAKE_CONFIG.BASE_OPACITY};
                    }
                    100% {
                        transform: translate3d(0, 110vh, 0);
                        opacity: 0;
                    }
                }
                
                .snowflake {
                    position: absolute;
                    pointer-events: none;
                    user-select: none;
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                    animation: snowfall linear infinite;
                    contain: layout style paint;
                }

                /* Pause animations when page not visible */
                .snow-paused .snowflake {
                    animation-play-state: paused;
                }
            `;
            document.head.appendChild(style);

            // State tracking
            let flakes = [];
            let currentBatch = 0;
            let isInitializing = true;
            const batchSize = SNOWFLAKE_CONFIG.BATCH_SIZE;

            // Color helper
            const getSnowflakeColor = () => {
                const colorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
                const christmasColors = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");

                switch (colorScheme) {
                    case "blue":
                        return '#B0E2FF';
                    case "rainbow":
                        const rainbowPalette = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead', '#d4a5a5'];
                        return rainbowPalette[Math.floor(Math.random() * rainbowPalette.length)];
                    case "match":
                        const selectedPalette = COLOR_SCHEMES[christmasColors] || COLOR_SCHEMES.traditional;
                        return selectedPalette[Math.floor(Math.random() * selectedPalette.length)];
                    case "newyear":
                        return COLOR_SCHEMES.newyear[Math.floor(Math.random() * 5)];
                    default:
                        return '#FFFFFF';
                }
            };

            // Create a single snowflake DOM element
            const createSnowflakeElement = (index) => {
                const size = Math.random() * (SNOWFLAKE_CONFIG.MAX_SIZE - SNOWFLAKE_CONFIG.MIN_SIZE) + SNOWFLAKE_CONFIG.MIN_SIZE;
                const duration = Math.random() * (SNOWFLAKE_CONFIG.FALL_DURATION.MAX - SNOWFLAKE_CONFIG.FALL_DURATION.MIN) + SNOWFLAKE_CONFIG.FALL_DURATION.MIN;
                const startPosition = Math.random() * 100;
                const color = getSnowflakeColor();
                const glowIntensity = getSetting("ChristmasTheme.Snowflake.Glow");
                const initialDelay = isInitializing ? Math.random() * duration : 0;

                const flake = document.createElement('div');
                flake.className = 'snowflake';
                flake.textContent = SNOWFLAKE_CHARS[Math.floor(Math.random() * SNOWFLAKE_CHARS.length)];
                flake.dataset.index = index;

                Object.assign(flake.style, {
                    left: `${startPosition}vw`,
                    top: '0',
                    fontSize: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${initialDelay}s`,
                    color: color,
                    textShadow: `0 0 ${glowIntensity}px ${color}`
                });

                return flake;
            };

            // Add batch of snowflakes using requestIdleCallback for smooth loading
            const addBatch = () => {
                if (currentBatch * batchSize >= totalFlakes) {
                    isInitializing = false;
                    return;
                }

                const scheduleNextBatch = (callback) => {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(callback, { timeout: 200 });
                    } else {
                        setTimeout(callback, 50);
                    }
                };

                const start = currentBatch * batchSize;
                const end = Math.min(start + batchSize, totalFlakes);

                // Create document fragment for batch DOM insertion
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

            // Render function (clears and recreates all flakes)
            const renderSnowflakes = () => {
                container.innerHTML = '';
                const fragment = document.createDocumentFragment();
                flakes.forEach(flake => fragment.appendChild(flake));
                container.appendChild(fragment);
            };

            // Update all snowflake colors
            const updateSnowflakeColors = () => {
                const glowIntensity = getSetting("ChristmasTheme.Snowflake.Glow");
                flakes.forEach(flake => {
                    const newColor = getSnowflakeColor();
                    flake.style.color = newColor;
                    flake.style.textShadow = `0 0 ${glowIntensity}px ${newColor}`;
                });
            };

            // Update all snowflake glow
            const updateSnowflakeGlow = (value) => {
                flakes.forEach(flake => {
                    flake.style.textShadow = `0 0 ${value}px ${flake.style.color}`;
                });
            };

            // Expose state for other modules
            window.snowflakeState = {
                flakes,
                get currentBatch() { return currentBatch; },
                set currentBatch(v) { currentBatch = v; },
                get isInitializing() { return isInitializing; },
                set isInitializing(v) { isInitializing = v; },
                renderSnowflakes,
                addBatch,
                getSnowflakeColor,
                updateSnowflakeColors,
                updateSnowflakeGlow
            };

            // Initialize based on current setting
            const isEnabled = getSetting("ChristmasTheme.Snowflake.Enabled");
            container.style.display = isEnabled ? 'block' : 'none';

            if (isEnabled) {
                addBatch();
            }

            // Visibility observer - pause animations when tab not visible
            const handleVisibility = () => {
                if (document.visibilityState === 'hidden') {
                    container.classList.add('snow-paused');
                } else {
                    container.classList.remove('snow-paused');
                }
            };
            document.addEventListener('visibilitychange', handleVisibility);

            // Track values for change detection
            let lastKnownColorScheme = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
            let lastKnownGlowValue = getSetting("ChristmasTheme.Snowflake.Glow");
            let lastKnownSnowflakeColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");

            // Lightweight polling for "match" mode sync (only every 1s)
            const checkMatchModeUpdates = setInterval(() => {
                const currentSnowSetting = getSetting("ChristmasTheme.Snowflake.Enabled");
                const currentColorScheme = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
                const currentSnowflakeColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
                const currentGlowValue = getSetting("ChristmasTheme.Snowflake.Glow");

                // Color scheme changed
                if (currentSnowflakeColorScheme !== lastKnownSnowflakeColorScheme) {
                    updateSnowflakeColors();
                    lastKnownSnowflakeColorScheme = currentSnowflakeColorScheme;
                }

                // Glow changed
                if (currentGlowValue !== lastKnownGlowValue) {
                    updateSnowflakeGlow(currentGlowValue);
                    lastKnownGlowValue = currentGlowValue;
                }

                // Match mode needs to update when lights color changes
                if (currentSnowSetting === 1 &&
                    currentSnowflakeColorScheme === "match" &&
                    currentColorScheme !== lastKnownColorScheme) {
                    updateSnowflakeColors();
                    lastKnownColorScheme = currentColorScheme;
                }

                // Handle disabled state
                if (currentSnowSetting === 0 && flakes.length > 0) {
                    flakes = [];
                    currentBatch = 0;
                    container.innerHTML = '';
                    container.style.display = 'none';
                }
            }, 1000);

            // Cleanup function
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