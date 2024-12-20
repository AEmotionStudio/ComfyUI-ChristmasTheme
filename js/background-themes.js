import { app } from "../../scripts/app.js";

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
        
        // Bind methods
        this._boundRender = this.animate.bind(this);
        this._boundUpdateCanvasSize = this.updateCanvasSize.bind(this);
    }

    async init() {
        console.log("Initializing Enhanced Background...");
        try {
            // Check if background is enabled
            if (!app.ui.settings.getSettingValue("ChristmasTheme.Background.Enabled", true)) {
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
                console.log("Waiting for app.canvas...");
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

            // Initialize Canvas 2D context
            this.ctx = this.canvas.getContext("2d");
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

    initEntities() {
        // Star class
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
            }

            reset() {
                this.size = Math.random() * 2.5;
                this.speed = Math.random() * 0.02;
                this.x = this.width;
                this.y = Math.random() * this.height;
                this.brightness = 0.35 + Math.random() * 0.2;
                this.twinkleSpeed = 0.005 + Math.random() * 0.01;
                this.twinkleRange = 0.15 + Math.random() * 0.15;
            }

            update(ctx, width, height) {
                this.x -= this.speed;
                if (this.x < 0) {
                    this.width = width;
                    this.height = height;
                    this.reset();
                } else {
                    this.twinklePhase += this.twinkleSpeed;
                    const twinkle = (Math.sin(this.twinklePhase) + 1) * 0.5;
                    const alpha = this.brightness - (this.twinkleRange * twinkle);
                    
                    ctx.globalAlpha = alpha;
                    ctx.fillRect(this.x, this.y, this.size, this.size);
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // Initialize stars
        this.entities = [];
        for (let i = 0; i < this.height * 0.7; i++) {
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
        this.width = this.container.clientWidth * devicePixelRatio;
        this.height = this.container.clientHeight * devicePixelRatio;

        if (this.canvas.width !== this.width || this.canvas.height !== this.height) {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
    }

    animate() {
        if (!this.ctx || !this.initialized) return;

        try {
            // Get background colors from settings
            const colorTheme = app.ui.settings.getSettingValue("ChristmasTheme.Background.ColorTheme", "classic");
            const themes = {
                classic: { top: '#05004c', bottom: '#110E19', star: '#ffffff' },
                christmas: { top: '#1a472a', bottom: '#0d2115', star: '#ffffff' },
                candycane: { top: '#8b0000', bottom: '#4a0404', star: '#ffffff' },
                frostnight: { top: '#0a2351', bottom: '#051428', star: '#e0ffff' },
                gingerbread: { top: '#8b4513', bottom: '#3c1f0d', star: '#ffd700' },
                darknight: { top: '#000000', bottom: '#000000', star: '#808080' }
            };
            
            const { top, bottom, star } = themes[colorTheme] || themes.classic;
            
            // Clear and set background with a gradient
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, top);
            gradient.addColorStop(1, bottom);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Set styles for stars
            this.ctx.fillStyle = star;
            this.ctx.strokeStyle = star;

            // Update all entities
            for (let i = 0; i < this.entities.length; i++) {
                this.entities[i].update(this.ctx, this.width, this.height);
            }
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
        console.log("🎨 Setting up Enhanced Background extension...");
        
        // Clean up any existing instance
        if (backgroundInstance) {
            backgroundInstance.stop();
            backgroundInstance = null;
        }

        // Add settings
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
            onChange: async () => {
                // Reinitialize the background with new colors
                if (backgroundInstance && app.ui.settings.getSettingValue("ChristmasTheme.Background.Enabled", true)) {
                    await backgroundInstance.init();
                }
            }
        });

        // Create initial instance if enabled
        if (app.ui.settings.getSettingValue("ChristmasTheme.Background.Enabled", true)) {
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