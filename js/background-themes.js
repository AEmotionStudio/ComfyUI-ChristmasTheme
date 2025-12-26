import { app } from "../../scripts/app.js";
import { getSetting, updateCache, initSettingsCache, loadSettingFromStorage, BACKGROUND_THEMES } from "./settings-cache.js";

// Track if extension has been set up to prevent double registration
let extensionSetupComplete = false;

// Page Visibility API - shared across modules
let isPageVisible = true;
document.addEventListener('visibilitychange', () => {
    isPageVisible = document.visibilityState === 'visible';
});

class EnhancedBackground {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.entities = [];
        this.animationFrame = null;
        this.initialized = false;

        // Gradient caching
        this._cachedGradient = null;
        this._cachedTheme = null;
        this._cachedHeight = 0;

        // Performance tracking
        this._frameCount = 0;
        this._lastFpsCheck = performance.now();
        this._currentFps = 60;

        // Bind methods
        this._boundRender = this.animate.bind(this);
        this._boundUpdateCanvasSize = this.updateCanvasSize.bind(this);
    }

    async init() {
        console.log("Initializing Enhanced Background...");
        try {
            // Check if background is enabled
            if (!getSetting("ChristmasTheme.Background.Enabled")) {
                return false;
            }

            // Remove any existing background containers first
            this.cleanup();

            // Create container
            this.container = document.createElement("div");
            this.container.id = "enhanced-background-container";
            Object.assign(this.container.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100vw",
                height: "100vh",
                zIndex: "0",
                pointerEvents: "none",
                userSelect: "none",
                overflow: "hidden"
            });

            // Create canvas
            this.canvas = document.createElement("canvas");
            this.canvas.id = "enhanced-background-canvas";
            Object.assign(this.canvas.style, {
                width: "100%",
                height: "100%",
                opacity: "0.25",
                display: "block"
            });

            this.container.appendChild(this.canvas);

            // Wait for app.canvas to be available
            if (!app.canvas?.canvas) {
                await new Promise(resolve => {
                    const checkCanvas = () => {
                        if (app.canvas?.canvas) {
                            resolve();
                        } else {
                            setTimeout(checkCanvas, 100);
                        }
                    };
                    checkCanvas();
                });
            }

            const graphCanvas = app.canvas.canvas;
            if (!graphCanvas.parentElement) {
                console.error("Cannot find graph canvas parent element");
                return false;
            }

            // Insert before graph canvas
            graphCanvas.parentElement.insertBefore(this.container, graphCanvas);

            // Initialize Canvas 2D context with optimizations
            this.ctx = this.canvas.getContext("2d", {
                alpha: false,  // No transparency needed - better performance
                desynchronized: true  // Reduce latency
            });

            this.updateCanvasSize();
            this.initEntities();
            this.setupEventListeners();
            this.initialized = true;
            this.animate();

            return true;
        } catch (error) {
            console.error("Error during initialization:", error);
            return false;
        }
    }

    /**
     * Get or create cached gradient
     * Only recreates when theme or canvas height changes
     */
    getGradient() {
        const colorTheme = getSetting("ChristmasTheme.Background.ColorTheme");

        // Return cached gradient if nothing changed
        if (this._cachedGradient &&
            this._cachedTheme === colorTheme &&
            this._cachedHeight === this.height) {
            return this._cachedGradient;
        }

        // Create new gradient
        const { top, bottom } = BACKGROUND_THEMES[colorTheme] || BACKGROUND_THEMES.classic;
        this._cachedGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        this._cachedGradient.addColorStop(0, top);
        this._cachedGradient.addColorStop(1, bottom);
        this._cachedTheme = colorTheme;
        this._cachedHeight = this.height;

        return this._cachedGradient;
    }

    initEntities() {
        // Optimized Star class using CSS-style animation timing
        class Star {
            constructor(options) {
                this.size = Math.random() * 2.5;
                this.speed = Math.random() * 0.02;
                this.x = options.x;
                this.y = options.y;
                this.brightness = 0.35 + Math.random() * 0.2;
                this.twinkleSpeed = 0.005 + Math.random() * 0.01;
                this.twinklePhase = Math.random() * Math.PI * 2;
                this.twinkleRange = 0.15 + Math.random() * 0.15;
                // Pre-calculate sin lookup for this star's twinkle pattern
                this._twinkleCycle = 0;
            }

            reset(width, height) {
                this.size = Math.random() * 2.5;
                this.speed = Math.random() * 0.02;
                this.x = width;
                this.y = Math.random() * height;
                this.brightness = 0.35 + Math.random() * 0.2;
                this.twinkleSpeed = 0.005 + Math.random() * 0.01;
                this.twinkleRange = 0.15 + Math.random() * 0.15;
            }

            update(ctx, width, height, skipTwinkle = false) {
                this.x -= this.speed;
                if (this.x < 0) {
                    this.reset(width, height);
                } else {
                    // Skip twinkle calculation in low-perf mode
                    if (skipTwinkle) {
                        ctx.globalAlpha = this.brightness;
                    } else {
                        this.twinklePhase += this.twinkleSpeed;
                        const twinkle = (Math.sin(this.twinklePhase) + 1) * 0.5;
                        ctx.globalAlpha = this.brightness - (this.twinkleRange * twinkle);
                    }
                    ctx.fillRect(this.x, this.y, this.size, this.size);
                }
            }
        }

        // Calculate optimal star count based on screen size
        // Cap at 1000 stars for performance
        const starCount = Math.min(Math.floor(this.height * 0.7), 1000);

        this.entities = [];
        for (let i = 0; i < starCount; i++) {
            this.entities.push(new Star({
                x: Math.random() * this.width,
                y: Math.random() * this.height
            }));
        }
    }

    setupEventListeners() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        this._resizeObserver = new ResizeObserver(this._boundUpdateCanvasSize);
        this._resizeObserver.observe(this.container);
    }

    updateCanvasSize() {
        if (!this.ctx || !this.canvas || !this.container) return;
        const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
        const newWidth = this.container.clientWidth * devicePixelRatio;
        const newHeight = this.container.clientHeight * devicePixelRatio;

        if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.width = newWidth;
            this.height = newHeight;
            // Invalidate gradient cache on resize
            this._cachedGradient = null;
        }
    }

    animate() {
        if (!this.ctx || !this.initialized) return;

        // Skip rendering if page is not visible
        if (!isPageVisible) {
            this.animationFrame = requestAnimationFrame(this._boundRender);
            return;
        }

        try {
            // FPS tracking for adaptive quality
            this._frameCount++;
            const now = performance.now();
            if (now - this._lastFpsCheck >= 1000) {
                this._currentFps = this._frameCount;
                this._frameCount = 0;
                this._lastFpsCheck = now;
            }

            // Determine if we should skip expensive operations
            const lowPerfMode = this._currentFps < 30;

            // Use cached gradient
            this.ctx.fillStyle = this.getGradient();
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Set star color from theme
            const colorTheme = getSetting("ChristmasTheme.Background.ColorTheme");
            const { star } = BACKGROUND_THEMES[colorTheme] || BACKGROUND_THEMES.classic;
            this.ctx.fillStyle = star;

            // Update stars (skip every other in low perf mode)
            const step = lowPerfMode ? 2 : 1;
            for (let i = 0; i < this.entities.length; i += step) {
                this.entities[i].update(this.ctx, this.width, this.height, lowPerfMode);
            }

            // Reset alpha
            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error("Render error:", error);
        }

        this.animationFrame = requestAnimationFrame(this._boundRender);
    }

    cleanup() {
        // Cancel animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Disconnect resize observer
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // Remove any existing background containers
        const existingContainer = document.getElementById('enhanced-background-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        this.initialized = false;
        this._cachedGradient = null;
        this.ctx = null;
        this.canvas = null;
        this.container = null;
        this.entities = [];
    }

    stop() {
        this.cleanup();
    }
}

// Create and export the effect instance
let backgroundInstance = null;

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

        // Clean up any existing instance
        if (backgroundInstance) {
            backgroundInstance.stop();
            backgroundInstance = null;
        }

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
                if (backgroundInstance) {
                    backgroundInstance.stop();
                    backgroundInstance = null;
                }
                if (value) {
                    backgroundInstance = new EnhancedBackground();
                    await backgroundInstance.init();
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
                // Invalidate gradient cache so it rebuilds with new colors
                if (backgroundInstance) {
                    backgroundInstance._cachedGradient = null;
                }
            }
        });

        // Load stored values AFTER settings are registered
        loadSettingFromStorage("ChristmasTheme.Background.Enabled");
        loadSettingFromStorage("ChristmasTheme.Background.ColorTheme");

        // Create initial instance if enabled
        if (getSetting("ChristmasTheme.Background.Enabled")) {
            backgroundInstance = new EnhancedBackground();
            await backgroundInstance.init();
        }

        // Return cleanup function
        return () => {
            if (backgroundInstance) {
                backgroundInstance.stop();
                backgroundInstance = null;
            }
        };
    }
});

// Export visibility state for other modules
export { isPageVisible };