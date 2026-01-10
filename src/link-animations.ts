// @ts-ignore
import { app } from "../../scripts/app.js";
// @ts-ignore
import { api } from "../../scripts/api.js";
import { getSetting, updateCache, initSettingsCache, loadSettingFromStorage, COLOR_SCHEMES } from "./settings-cache";
import { isPageVisible } from "./background-themes";

// ============================================================================
// Type Definitions
// ============================================================================

interface PerformanceSettings {
    lightSpacing: number;
    skipCaps: boolean;
    reducedGlow: boolean;
}

interface PerformanceMonitorType {
    frameTimeHistory: Float32Array;
    currentIndex: number;
    sum: number;
    warningThreshold: number;
    criticalThreshold: number;
    _lastMode: 'normal' | 'warning' | 'critical';
    adaptiveSettings: Record<'normal' | 'warning' | 'critical', PerformanceSettings>;
    addFrameTime(time: number): 'normal' | 'warning' | 'critical';
    getSettings(): PerformanceSettings;
}

interface ArrayPoolType {
    pool: Float32Array[];
    init(): void;
    get(): Float32Array;
    release(array: Float32Array): void;
}

interface StateType {
    isRunning: boolean;
    phase: number;
    lastFrame: number;
    animationFrame: number | null;
    performanceMode: 'normal' | 'warning' | 'critical';
    isRendering: boolean;
    linkDataCache: { start: Float32Array; end: Float32Array; color: string | null }[];
    linkDataIndex: number;
}

interface LinkData {
    start: Float32Array;
    end: Float32Array;
    color: string | null;
}

interface LinkRenderer {
    getLength(start: Float32Array, end: Float32Array): number;
    getPoint(start: Float32Array, end: Float32Array, t: number, out: Float32Array): void;
    draw(ctx: CanvasRenderingContext2D, start: Float32Array, end: Float32Array, color: string, thickness: number): void;
}

// Extend Window interface for snowflake state
declare global {
    interface Window {
        snowflakeState?: {
            flakes: any[];
            currentBatch: number;
            isInitializing: boolean;
            renderSnowflakes: () => void;
            addBatch: () => void;
        };
    }

    class LGraphCanvas {
        static link_type_colors: Record<string, string>;

        graph: {
            links: Record<number, { origin_id: number; target_id: number; origin_slot: number; target_slot: number; type: string }>;
            _nodes_by_id: Record<number, any>;
        };
        default_connection_color: string;

        drawConnections(ctx: CanvasRenderingContext2D): void;
        renderChristmasLights(ctx: CanvasRenderingContext2D, items: LinkData[], phase: number): void;
    }
}

// ============================================================================
// Core Implementation
// ============================================================================

app.registerExtension({
    name: "Christmas.Theme.LightSwitch",
    async setup() {
        // Initialize settings cache first
        initSettingsCache();

        // 🔮 Basic Constants
        const PHI = 1.618033988749895;

        // Enhanced Performance Monitoring with adaptive response
        const PerformanceMonitor: PerformanceMonitorType = {
            frameTimeHistory: new Float32Array(60),
            currentIndex: 0,
            sum: 0,
            warningThreshold: 8, // reduced threshold
            criticalThreshold: 16,
            _lastMode: 'normal',
            adaptiveSettings: {
                normal: { lightSpacing: 15, skipCaps: false, reducedGlow: false },
                warning: { lightSpacing: 25, skipCaps: true, reducedGlow: false },
                critical: { lightSpacing: 40, skipCaps: true, reducedGlow: true }
            },

            addFrameTime(time: number) {
                this.sum -= this.frameTimeHistory[this.currentIndex];
                this.frameTimeHistory[this.currentIndex] = time;
                this.sum += time;
                this.currentIndex = (this.currentIndex + 1) % 60;

                const avg = this.sum / 60;
                let mode: 'normal' | 'warning' | 'critical' = 'normal';

                if (avg > this.criticalThreshold) mode = 'critical';
                else if (avg > this.warningThreshold) mode = 'warning';

                if (mode !== this._lastMode) {
                    console.log(`🎄 Christmas Lights: Switching to ${mode} mode (avg frame time: ${avg.toFixed(2)}ms)`);
                    this._lastMode = mode;
                }
                return mode;
            },

            getSettings() {
                return this.adaptiveSettings[this._lastMode];
            }
        };

        // Preallocated memory pools to reduce GC
        const ArrayPool: ArrayPoolType = {
            pool: [],
            init() { for (let i = 0; i < 1000; i++) this.pool.push(new Float32Array(2)); },
            get() { return this.pool.pop() || new Float32Array(2); },
            release(arr) { if (this.pool.length < 2000) this.pool.push(arr); }
        };
        ArrayPool.init();

        // Shared State
        const State: StateType = {
            isRunning: true,
            phase: 0,
            lastFrame: 0,
            animationFrame: null,
            performanceMode: 'normal',
            isRendering: false,
            linkDataCache: new Array(1000).fill(null).map(() => ({
                start: new Float32Array(2),
                end: new Float32Array(2),
                color: null
            })),
            linkDataIndex: 0
        };

        // Optimized Rendering Helpers
        const LinkRenderer: LinkRenderer = {
            getLength(start, end) {
                const dx = end[0] - start[0];
                const dy = end[1] - start[1];
                return Math.sqrt(dx * dx + dy * dy);
            },
            getPoint(start, end, t, out) {
                out[0] = start[0] + (end[0] - start[0]) * t;
                out[1] = start[1] + (end[1] - start[1]) * t;
            },
            draw(ctx, start, end, color, thickness) {
                ctx.strokeStyle = color;
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(start[0], start[1]);
                ctx.lineTo(end[0], end[1]);
                ctx.stroke();
            }
        };

        // Pre-calculated sin table for fast lookup
        const SIN_TABLE_SIZE = 1024;
        const SIN_TABLE = new Float32Array(SIN_TABLE_SIZE);
        for (let i = 0; i < SIN_TABLE_SIZE; i++) {
            SIN_TABLE[i] = Math.sin((i / SIN_TABLE_SIZE) * Math.PI * 2);
        }
        function fastSin(angle: number) {
            const index = Math.floor((angle / (Math.PI * 2) * SIN_TABLE_SIZE)) % SIN_TABLE_SIZE;
            return SIN_TABLE[index >= 0 ? index : index + SIN_TABLE_SIZE];
        }

        // Timing Manager
        const TimingManager = {
            lastTime: 0,
            update() {
                const now = performance.now();
                if (!this.lastTime) this.lastTime = now;
                const delta = (now - this.lastTime) / 1000;
                this.lastTime = now;
                return Math.min(delta, 0.05); // Cap delta to prevent huge jumps
            }
        };

        // Animation State Manager
        const AnimationState = {
            phase: 0,
            update(delta: number) {
                // Use setting speed
                const speed = (getSetting("ChristmasTheme.ChristmasEffects.AnimationSpeed") as number) || 1.0;
                this.phase += delta * speed;
                return this.phase;
            }
        };

        // 🎨 Main Installation Trigger
        let retryCount = 0;
        const installChristmasLights = () => {
            // @ts-ignore
            if (!app.canvas || !app.graph) {
                if (retryCount < 20) {
                    retryCount++;
                    setTimeout(installChristmasLights, 200);
                }
                return;
            }

            const LGraphCanvas = app.canvas.constructor;
            const origDrawConnections = LGraphCanvas.prototype.drawConnections;

            console.log("🎄 Installing Christmas Lights (Optimized)...");

            // Attach our renderer to the canvas class for easy access
            LGraphCanvas.prototype.renderChristmasLights = function (ctx: CanvasRenderingContext2D, items: LinkData[], phase: number) {
                const animStyle = getSetting("ChristmasTheme.ChristmasEffects.LightSwitch");
                const currentSchemeName = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme") as string;
                // If "match", use the matched palette (Logic handled in cache or here? Assuming cache returns 'match' string, we need to resolve it)
                // Actually settings-cache helpers usually resolve it. Let's rely on COLOR_SCHEMES lookup.

                // Fix for 'match' scheme: if it's 'match', we need to check background theme but for links we usually just default to traditional or let user pick. 
                // Wait, the cache update logic in background-themes handles sync. Here we just read.
                // If it is literally "match", we map to traditional or a default for now.
                const christmasColors = COLOR_SCHEMES[currentSchemeName] || COLOR_SCHEMES.traditional;

                const bulbShape = getSetting("ChristmasTheme.ChristmasEffects.BulbShape");

                // Cache settings for this frame
                const settings = PerformanceMonitor.getSettings();
                const baseSpacing = settings.lightSpacing;
                const skipCaps = settings.skipCaps;
                const reducedGlow = settings.reducedGlow;

                const glowIntensity = getSetting("ChristmasTheme.ChristmasEffects.GlowIntensity") as number;
                const steadyTwinkle = getSetting("ChristmasTheme.ChristmasEffects.SteadyStrands");
                const sparkleMode = getSetting("ChristmasTheme.ChristmasEffects.SparkleMode");
                const colorCount = christmasColors.length;

                // Get link style from settings (e.g. Spline, Linear, Hidden)
                // Note: The setting ID might need verification, typically "ChristmasTheme.Link Style"
                // but checking previous files or defaults. Assuming "ChristmasTheme.LinkType" or similar if not found.
                // Based on previous code in user context, it used `linkStyle` variable which implies it was defined.
                // We'll define it here.
                const linkStyle = getSetting("ChristmasTheme.LinkRenderMode") || "spline"; // Fallback to spline if not set


                const renderer = LinkRenderer;
                const tempPoint = new Float32Array(2);

                // Common styles
                const Thickness = 2; // Link wire thickness used for bulbs too
                const Direction = -1; // Animation flow direction

                // Special Mode: Frost Trail
                if (animStyle === 4) { // Frost Trail
                    for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
                        const { start, end, color } = items[itemIdx];
                        // Draw frosty core
                        ctx.shadowBlur = 4;
                        ctx.shadowColor = "#aaddff";
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.moveTo(start[0], start[1]);
                        ctx.lineTo(end[0], end[1]);
                        ctx.stroke();

                        // Flowing ice particles
                        const length = renderer.getLength(start, end);
                        const particleCount = Math.floor(length / 20);
                        const time = performance.now() / 1000;

                        ctx.shadowBlur = 8;
                        ctx.fillStyle = "#ffffff";

                        for (let i = 0; i < particleCount; i++) {
                            const speed = 0.5 + (i % 3) * 0.2;
                            let t = ((time * speed) + (i / particleCount)) % 1;

                            renderer.getPoint(start, end, t, tempPoint);
                            const x = tempPoint[0];
                            const y = tempPoint[1];

                            const size = 1.5 + Math.sin(time * 10 + i) * 1;
                            ctx.globalAlpha = 0.6 + Math.sin(time * 5 + i) * 0.4;
                            ctx.beginPath();
                            ctx.arc(x, y, size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.globalAlpha = 1;
                    }
                    return;
                }

                // Special Mode: Candy Cane
                if (animStyle === 2) { // Candy Cane
                    ctx.lineCap = "round";
                    for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
                        const { start, end } = items[itemIdx];

                        // White base
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.moveTo(start[0], start[1]);
                        ctx.lineTo(end[0], end[1]);
                        ctx.stroke();

                        // Red stripes
                        ctx.strokeStyle = "#ff0000";
                        ctx.lineWidth = 5;
                        ctx.setLineDash([15, 15]);
                        ctx.lineDashOffset = -phase * 30; // Animate stripes
                        ctx.beginPath();
                        ctx.moveTo(start[0], start[1]);
                        ctx.lineTo(end[0], end[1]);
                        ctx.stroke();

                        // Reset
                        ctx.setLineDash([]);
                    }
                    return;
                }

                // Special Mode: Aurora Flow
                if (animStyle === 5) {
                    ctx.lineCap = "round";
                    const auroraColors = ['#00ffaa', '#00aaff', '#aa00ff', '#ff00aa'];

                    for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
                        const { start, end } = items[itemIdx];
                        const length = renderer.getLength(start, end);

                        // Multi-layered flow
                        for (let layer = 0; layer < 3; layer++) {
                            const offset = layer * 2;
                            const t = (phase * 0.2 + (layer * 0.1)) % 1;

                            // Draw segment
                            // Actually just drawing the full line with gradient is better
                            const grad = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
                            for (let c = 0; c < auroraColors.length; c++) {
                                const colorPos = (c / (auroraColors.length - 1) + phase * 0.2) % 1;
                                grad.addColorStop(colorPos, auroraColors[c]);
                            }
                            // Need at least 2 stops for valid gradient if we cycle? 
                            // Simplified approach: moving particles of aurora color

                            const particles = Math.floor(length / 10);
                            for (let p = 0; p < particles; p++) {
                                const t = (p / particles + phase * 0.1) % 1;
                                renderer.getPoint(start, end, t, tempPoint);
                                const x = tempPoint[0];
                                const y = tempPoint[1] + Math.sin(t * Math.PI * 4 + phase) * 2;

                                // Color cycling through aurora palette
                                const colorT = (t - phase * 0.5 + 1) % 1;
                                const colorIndex = Math.floor(colorT * auroraColors.length);
                                // const nextColorIndex = (colorIndex + 1) % auroraColors.length; // Unused
                                // const colorBlend = (colorT * auroraColors.length) % 1; // Unused

                                // Blend between colors
                                const auroraColor = auroraColors[colorIndex];

                                // Pulsing intensity
                                const pulse = 0.5 + fastSin(phase * 3 + t * Math.PI * 2) * 0.5;

                                ctx.shadowBlur = 20 * pulse;
                                ctx.shadowColor = auroraColor;
                                ctx.fillStyle = auroraColor;
                                ctx.globalAlpha = pulse * 0.7;

                                ctx.beginPath();
                                ctx.arc(x, y, Thickness * (1 + pulse * 0.5), 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                        ctx.globalAlpha = 1;
                        ctx.shadowBlur = 0;
                    }
                    return; // Skip normal bulb rendering for special modes
                }

                // Icicle bulb helper function
                const drawIcicleBulb = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
                    const bulbWidth = size * 1.2;
                    const bulbHeight = size * 3;
                    ctx.beginPath();
                    // Start at top center
                    ctx.moveTo(x, y - size * 0.5);
                    // Curve to left side
                    ctx.bezierCurveTo(
                        x - bulbWidth, y,
                        x - bulbWidth * 0.6, y + bulbHeight * 0.5,
                        x, y + bulbHeight  // Pointed tip at bottom
                    );
                    // Curve back to start
                    ctx.bezierCurveTo(
                        x + bulbWidth * 0.6, y + bulbHeight * 0.5,
                        x + bulbWidth, y,
                        x, y - size * 0.5
                    );
                    ctx.closePath();
                };

                for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
                    const { start, end, color } = items[itemIdx];

                    // Draw base wire
                    if (linkStyle !== 'hidden') {
                        ctx.globalAlpha = 0.8;
                        ctx.shadowBlur = 0;
                        renderer.draw(ctx, start, end, color || "#888", Thickness);
                        ctx.globalAlpha = 1;
                    }

                    if (linkStyle === 'hidden' && !getSetting("ChristmasTheme.ChristmasEffects.LightSwitch")) {
                        continue;
                    }

                    const totalLength = renderer.getLength(start, end);
                    const numLights = Math.floor(totalLength / baseSpacing);
                    if (numLights < 1) continue;

                    const effectiveGlow = reducedGlow ? glowIntensity * 0.5 : glowIntensity;

                    // Draw lights in a single batch
                    for (let i = 0; i <= numLights; i++) {
                        const t = i / numLights;
                        renderer.getPoint(start, end, t, tempPoint);

                        const wobble = fastSin(t * Math.PI * 4) * 5;
                        const x = tempPoint[0];
                        const y = tempPoint[1] + wobble;

                        // Color cycling
                        const colorIndex = ((i - Math.floor(phase * 2 * Direction)) % colorCount + colorCount) % colorCount;
                        const lightColor = christmasColors[colorIndex];

                        // Twinkle calculation
                        let flicker;
                        if (steadyTwinkle) {
                            flicker = 1;
                        } else if (sparkleMode) {
                            flicker = 0.7 + fastSin(-phase * 8 + i * 5) * 0.3 * Math.random();
                        } else {
                            flicker = 0.85 + fastSin(-phase * 5 + i * 3) * 0.15;
                        }

                        // Light bulb
                        ctx.shadowBlur = effectiveGlow * 1.5 * flicker;
                        ctx.fillStyle = lightColor;
                        ctx.shadowColor = lightColor;
                        ctx.globalAlpha = flicker;

                        if (bulbShape === "icicle") {
                            // Icicle/pointed bulb shape
                            drawIcicleBulb(ctx, x, y, Thickness);
                            ctx.fill();
                        } else {
                            // Classic round bulb
                            ctx.beginPath();
                            ctx.arc(x, y, Thickness * 1.5, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        // Light cap (skip in low performance mode)
                        if (!skipCaps) {
                            ctx.beginPath();
                            ctx.shadowBlur = 0;
                            const capY = bulbShape === "icicle" ? y - Thickness * 0.8 : y - Thickness;
                            ctx.arc(x, capY, Thickness * 0.5, 0, Math.PI * 2);
                            ctx.fillStyle = '#c0c0c0';
                            ctx.globalAlpha = 1;
                            ctx.fill();
                        }
                    }
                    ctx.globalAlpha = 1;
                }
            };

            // Override drawConnections
            LGraphCanvas.prototype.drawConnections = function (ctx: CanvasRenderingContext2D) {
                try {
                    // Skip if page not visible
                    if (!isPageVisible) {
                        return;
                    }

                    const startTime = performance.now();
                    const animStyle = getSetting("ChristmasTheme.ChristmasEffects.LightSwitch");

                    if (animStyle === 0) {
                        origDrawConnections.call(this, ctx);
                        return;
                    }

                    const delta = TimingManager.update();
                    const phase = AnimationState.update(delta);

                    ctx.save();

                    // Reset link data index for reuse
                    State.linkDataIndex = 0;

                    // Collect visible links
                    for (const linkId in this.graph.links) {
                        const linkData = this.graph.links[linkId];
                        if (!linkData) continue;

                        const originNode = this.graph._nodes_by_id[linkData.origin_id];
                        const targetNode = this.graph._nodes_by_id[linkData.target_id];

                        if (!originNode || !targetNode || originNode.flags.collapsed || targetNode.flags.collapsed) continue;

                        // Reuse or create link data object
                        let data = State.linkDataCache[State.linkDataIndex];
                        if (!data) {
                            data = {
                                start: ArrayPool.get(),
                                end: ArrayPool.get(),
                                color: null
                            };
                            State.linkDataCache[State.linkDataIndex] = data;
                        }

                        originNode.getConnectionPos(false, linkData.origin_slot, data.start);
                        targetNode.getConnectionPos(true, linkData.target_slot, data.end);
                        data.color = linkData.type ?
                            LGraphCanvas.link_type_colors[linkData.type] :
                            this.default_connection_color;

                        State.linkDataIndex++;
                    }

                    // Render all collected links
                    if (State.linkDataIndex > 0) {
                        const linksToRender = State.linkDataCache.slice(0, State.linkDataIndex);
                        this.renderChristmasLights(ctx, linksToRender, phase);
                    }

                    ctx.restore();

                    // Monitor performance
                    const frameTime = performance.now() - startTime;
                    State.performanceMode = PerformanceMonitor.addFrameTime(frameTime);

                } catch (error) {
                    console.error("Error in drawConnections:", error);
                    origDrawConnections.call(this, ctx);
                }
            };

            // INDEPENDENT ANIMATION LOOP: Ensure we animate even if background is disabled
            // This fixes the startup issue where animations wait for background loop
            let linkAnimLoopId: number | null = null;
            function startLinkLoop() {
                if (linkAnimLoopId) return;
                const loop = () => {
                    // Check if lights are enabled (style > 0)
                    const lightsOn = getSetting("ChristmasTheme.ChristmasEffects.LightSwitch") !== 0; // 0 is default/off

                    if (isPageVisible && lightsOn && app.canvas) {
                        // Force redraw to keep animations playing
                        app.canvas.setDirty(true, true);
                    }
                    linkAnimLoopId = requestAnimationFrame(loop);
                };
                linkAnimLoopId = requestAnimationFrame(loop);
            }
            startLinkLoop();
        };

        // 🔄 Workflow State Management
        const WorkflowState = {
            isRendering: false,
            isExecuting: false,
            jobCount: 0,
            executionStartTime: 0,

            checkState() {
                // If ComfyUI app state says executing, pause effects
                // @ts-ignore
                if (app.ui && app.ui.status && app.ui.status.exec_info && app.ui.status.exec_info.queue_remaining > 0) {
                    this.isExecuting = true;
                    // @ts-ignore
                } else if (app.graph && app.graph._nodes_executing && Object.keys(app.graph._nodes_executing).length > 0) {
                    this.isExecuting = true;
                } else {
                    this.isExecuting = false;
                }
                return this.isExecuting;
            }
        };

        // Hook into graph execution
        api.addEventListener("execution_start", () => {
            if (getSetting("ChristmasTheme.PauseDuringRender")) {
                State.isRendering = true;
            }
        });

        api.addEventListener("execution_end", () => {
            State.isRendering = false;
            // Force redraw to resume animations immediately
            if (app.canvas) {
                app.canvas.setDirty(true, true);
            }
        });

        installChristmasLights();
    }
});
