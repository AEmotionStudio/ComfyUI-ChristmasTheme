// aether-snow.js
import { app } from "../../scripts/app.js";
import { loadReactDependencies } from "./react-integration/comfy-react-integration.js";

const SNOWFLAKE_CONFIG = {
    MIN_SIZE: 8,
    MAX_SIZE: 24,
    TOTAL_FLAKES: 50,
    BASE_OPACITY: 0.8,
    FALL_DURATION: {
        MIN: 25,
        MAX: 35
    },
    BATCH_SIZE: 10
};

const SNOWFLAKE_CHARS = [
    '❅', // Current snowflake
    '❆', // Heavier snowflake
    '❄', // Classic snowflake
];

app.registerExtension({
    name: "Christmas.Theme.SnowEffect",  // Changed name to match theme namespace
    async setup() {
        console.log("✨ Initializing Snow Effect...");

        try {
            // Load React dependencies
            const { React: MiniReact, ReactDOM: MiniReactDOM } = await loadReactDependencies();
            
            // Create container
            const container = document.createElement('div');
            container.id = 'comfy-aether-snow';
            container.style.cssText = 'position: fixed; top: -10vh; left: 0; width: 100%; height: 200vh; overflow: hidden; pointer-events: none; z-index: 3;';
            document.body.appendChild(container);

            // Create root for React rendering
            const root = MiniReactDOM.createRoot(container);

            const getSnowflakeColor = () => {
                const colorScheme = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.ColorScheme", "white");
                const christmasColors = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.ColorScheme", "traditional");
                
                switch(colorScheme) {
                    case "blue":
                        return '#B0E2FF';
                    case "rainbow":
                        const rainbowPalette = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead', '#d4a5a5'];
                        return rainbowPalette[Math.floor(Math.random() * rainbowPalette.length)];
                    case "match":
                        const colorSchemes = {
                            traditional: ['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ffffff'],
                            warm: ['#ffd700', '#ffb347', '#ffa07a', '#ff8c69', '#fff0f5'],
                            cool: ['#f0ffff', '#e0ffff', '#b0e2ff', '#87cefa', '#b0c4de'],
                            multicolor: ['#ff1493', '#00ff7f', '#ff4500', '#4169e1', '#9370db'],
                            pastel: ['#ffb6c1', '#98fb98', '#87ceeb', '#dda0dd', '#f0e68c'],
                            newyear: ['#00ffff', '#ff1493', '#ffd700', '#4b0082', '#7fff00']
                        };
                        const selectedPalette = colorSchemes[christmasColors] || colorSchemes.traditional;
                        return selectedPalette[Math.floor(Math.random() * selectedPalette.length)];
                    case "newyear":
                        return ['#00ffff', '#ff1493', '#ffd700', '#4b0082', '#7fff00'][Math.floor(Math.random() * 5)];
                    default:
                        return '#FFFFFF';
                }
            };
            
            // Add styles
            const style = document.createElement('style');
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
                        opacity: ${SNOWFLAKE_CONFIG.BASE_OPACITY};
                    }
                    50% {
                        transform: translate3d(-15px, 50vh, 0);
                        opacity: ${SNOWFLAKE_CONFIG.BASE_OPACITY};
                    }
                    75% {
                        transform: translate3d(15px, 75vh, 0);
                        opacity: ${SNOWFLAKE_CONFIG.BASE_OPACITY};
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
                    will-change: transform;
                    z-index: 3;
                    backface-visibility: hidden;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                    animation-iteration-count: infinite;
                    contain: layout style;
                }

                #comfy-aether-snow {
                    contain: strict;
                    transform: translateZ(0);
                }
            `;
            document.head.appendChild(style);
            
            // Create snowflakes
            let flakes = [];
            const totalFlakes = SNOWFLAKE_CONFIG.TOTAL_FLAKES;
            const batchSize = SNOWFLAKE_CONFIG.BATCH_SIZE;
            let currentBatch = 0;
            let isInitializing = true;

            // Update the render function to use React root
            const renderSnowflakes = () => {
                root.render(
                    MiniReact.createElement('div', {
                        style: {
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            transform: 'translateZ(0)'
                        }
                    }, flakes)
                );
            };

            // Update addBatch to use the new render function
            const addBatch = () => {
                if (currentBatch * batchSize >= totalFlakes) {
                    isInitializing = false;  // Mark initialization as complete
                    return;
                }
                
                const start = currentBatch * batchSize;
                const end = Math.min(start + batchSize, totalFlakes);
                
                for (let i = start; i < end; i++) {
                    flakes.push(createSnowflake(i));
                }
                
                renderSnowflakes();
                
                currentBatch++;
                if (currentBatch * batchSize < totalFlakes) {
                    setTimeout(addBatch, 100);
                }
            };

            const createSnowflake = (id) => {
                const size = Math.random() * (SNOWFLAKE_CONFIG.MAX_SIZE - SNOWFLAKE_CONFIG.MIN_SIZE) + SNOWFLAKE_CONFIG.MIN_SIZE;
                const duration = Math.random() * (SNOWFLAKE_CONFIG.FALL_DURATION.MAX - SNOWFLAKE_CONFIG.FALL_DURATION.MIN) + SNOWFLAKE_CONFIG.FALL_DURATION.MIN;
                const startPosition = Math.random() * 100;
                const color = getSnowflakeColor();
                const glowIntensity = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.Glow", 10);
                
                // Add initial delay only during initialization
                const initialDelay = isInitializing ? Math.random() * duration : 0;
                
                return MiniReact.createElement('div', {
                    class: 'snowflake',
                    style: {
                        left: `${startPosition}vw`,
                        top: '0',
                        fontSize: `${size}px`,
                        animation: `snowfall ${duration}s linear infinite`,
                        animationDelay: `${initialDelay}s`,
                        color: color,
                        textShadow: `0 0 ${glowIntensity}px ${color}`,
                        transform: 'translateZ(0)'
                    }
                }, SNOWFLAKE_CHARS[Math.floor(Math.random() * SNOWFLAKE_CHARS.length)]);
            };

            // Store state in window object for access from settings
            window.snowflakeState = {
                flakes,
                currentBatch,
                isInitializing,
                renderSnowflakes,
                addBatch,
                getSnowflakeColor,  // Add the color function to the state
                updateSnowflakeColors: () => {
                    // Update colors of existing snowflakes
                    const snowflakeElements = document.querySelectorAll('.snowflake');
                    snowflakeElements.forEach(flake => {
                        const newColor = getSnowflakeColor();
                        flake.style.color = newColor;
                        const glowIntensity = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.Glow", 10);
                        flake.style.textShadow = `0 0 ${glowIntensity}px ${newColor}`;
                    });
                },
                updateSnowflakeGlow: (value) => {
                    // Update glow of existing snowflakes
                    const snowflakeElements = document.querySelectorAll('.snowflake');
                    snowflakeElements.forEach(flake => {
                        flake.style.textShadow = `0 0 ${value}px ${flake.style.color}`;
                    });
                }
            };

            // Register settings after variables are defined
            const snowContainer = document.getElementById('comfy-aether-snow');
            if (snowContainer) {
                // Set initial state based on setting
                const isEnabled = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.Enabled", 1);
                snowContainer.style.display = isEnabled ? 'block' : 'none';
                
                // Initialize snowflakes if enabled
                if (isEnabled) {
                    isInitializing = true;
                    addBatch();
                }
            }

            // Track the last known values
            let lastKnownColorScheme = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.ColorScheme", "traditional");
            let lastKnownGlowValue = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.Glow", 10);
            let lastKnownSnowflakeColorScheme = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.ColorScheme", "white");
            let lastUpdateTime = Date.now();

            // Update snowflakes periodically to reflect settings changes
            const updateInterval = setInterval(() => {
                const currentTime = Date.now();
                const timeSinceLastUpdate = currentTime - lastUpdateTime;
                
                // Only update if enough time has passed (prevent too frequent updates)
                if (timeSinceLastUpdate < 100) return;

                const currentSnowSetting = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.Enabled", 1);
                const currentColorScheme = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.ColorScheme", "traditional");
                const currentSnowflakeColorScheme = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.ColorScheme", "white");
                const currentGlowValue = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.Glow", 10);

                // Check for any changes
                if (currentSnowflakeColorScheme !== lastKnownSnowflakeColorScheme) {
                    window.snowflakeState.updateSnowflakeColors();
                    lastKnownSnowflakeColorScheme = currentSnowflakeColorScheme;
                    lastUpdateTime = currentTime;
                }

                if (currentGlowValue !== lastKnownGlowValue) {
                    window.snowflakeState.updateSnowflakeGlow(currentGlowValue);
                    lastKnownGlowValue = currentGlowValue;
                    lastUpdateTime = currentTime;
                }

                // Check if we need to update due to color scheme changes when in match mode
                const needsColorUpdate = currentSnowSetting === 1 && 
                    currentSnowflakeColorScheme === "match" && 
                    currentColorScheme !== lastKnownColorScheme;

                if (needsColorUpdate) {
                    window.snowflakeState.updateSnowflakeColors();
                    lastKnownColorScheme = currentColorScheme;
                    lastUpdateTime = currentTime;
                } else if (currentSnowSetting === 0) {
                    // Ensure snowflakes stay hidden when disabled
                    flakes = [];
                    currentBatch = 0;
                    renderSnowflakes();
                    if (snowContainer) {
                        snowContainer.style.display = 'none';
                    }
                }
            }, 100); // Check more frequently for smoother updates

            // Initial render - respect the current setting
            const snowEnabled = app.ui.settings.getSettingValue("ChristmasTheme.Snowflake.Enabled", 1);
            if (snowEnabled === 1) {
                addBatch();
            } else {
                // Make sure container is hidden if snow is disabled
                container.style.display = 'none';
            }
            
            return () => {
                clearInterval(updateInterval);
                container.remove();
                style.remove();
            };
        } catch (error) {
            console.error("❌ Failed to initialize Snow Effect:", error);
        }
    }
});