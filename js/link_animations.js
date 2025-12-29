import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { getSetting, updateCache, initSettingsCache, loadSettingFromStorage, COLOR_SCHEMES } from "./settings-cache.js";
import { isPageVisible } from "./background-themes.js";

app.registerExtension({
    name: "Christmas.Theme.LightSwitch",
    async setup() {
        // Initialize settings cache first
        initSettingsCache();

        // 🔮 Basic Constants
        const PHI = 1.618033988749895;

        // Enhanced Performance Monitoring with adaptive response
        const PerformanceMonitor = {
            frameTimeHistory: new Float32Array(60), // Use typed array
            currentIndex: 0,
            sum: 0, // Running sum for O(1) average calculation
            warningThreshold: 16.67, // 60fps threshold
            criticalThreshold: 33.33, // 30fps threshold
            _lastMode: 'normal',

            // Adaptive settings based on performance
            adaptiveSettings: {
                normal: { lightSpacing: 30, skipCaps: false, reducedGlow: false },
                warning: { lightSpacing: 45, skipCaps: true, reducedGlow: false },
                critical: { lightSpacing: 60, skipCaps: true, reducedGlow: true }
            },

            addFrameTime(time) {
                // O(1) running average using sum
                this.sum -= this.frameTimeHistory[this.currentIndex];
                this.frameTimeHistory[this.currentIndex] = time;
                this.sum += time;
                this.currentIndex = (this.currentIndex + 1) % this.frameTimeHistory.length;

                const avgFrameTime = this.sum / this.frameTimeHistory.length;

                if (avgFrameTime > this.criticalThreshold) {
                    this._lastMode = 'critical';
                } else if (avgFrameTime > this.warningThreshold) {
                    this._lastMode = 'warning';
                } else {
                    this._lastMode = 'normal';
                }
                return this._lastMode;
            },

            getSettings() {
                return this.adaptiveSettings[this._lastMode];
            }
        };

        // Add Performance Settings
        app.ui.settings.addSetting({
            id: "ChristmasTheme.PauseDuringRender",
            name: "⏸️ Pause Effects During Render",
            type: "combo",
            options: [
                { value: true, text: "✅ Enabled" },
                { value: false, text: "❌ Disabled" }
            ],
            defaultValue: true,
            section: "Performance",
            tooltip: "Pause animations during rendering to improve performance",
            onChange: (value) => updateCache("ChristmasTheme.PauseDuringRender", value)
        });

        // Optimized Object Pool with pre-allocation
        const ArrayPool = {
            pool: [],

            init() {
                // Pre-allocate 200 arrays
                for (let i = 0; i < 200; i++) {
                    this.pool.push(new Float32Array(2));
                }
            },

            get() {
                return this.pool.length > 0 ? this.pool.pop() : new Float32Array(2);
            },

            release(array) {
                if (this.pool.length < 300) {
                    this.pool.push(array);
                }
            }
        };
        ArrayPool.init();

        // ⚡ State Management System
        const State = {
            isRunning: false,
            phase: 0,
            lastFrame: performance.now(),
            animationFrame: null,
            performanceMode: 'normal',
            isRendering: false,
            // Reusable link data array (avoid creating new arrays each frame)
            linkDataCache: [],
            linkDataIndex: 0
        };

        // 🎭 Animation State Controller
        const AnimationState = {
            targetPhase: 0,
            Direction: 1,
            transitionSpeed: PHI,
            smoothFactor: 0.95,

            update(delta) {
                const flowDirection = getSetting("ChristmasTheme.ChristmasEffects.Direction");

                if (this.Direction !== flowDirection) {
                    this.Direction = flowDirection;
                    this.targetPhase = State.phase + Math.PI * 2 * this.Direction;
                }

                const phaseStep = this.transitionSpeed * delta * PHI;

                if (Math.abs(this.targetPhase - State.phase) > 0.01) {
                    State.phase += Math.sign(this.targetPhase - State.phase) * phaseStep;
                } else {
                    State.phase = (State.phase + phaseStep * this.Direction) % (Math.PI * 2);
                    this.targetPhase = State.phase;
                }

                return State.phase;
            }
        };

        // ⚙️ Performance-Optimized Timing System
        const TimingManager = {
            smoothDelta: 0,
            frameCount: 0,

            update() {
                const now = performance.now();
                const rawDelta = Math.min((now - State.lastFrame) / 1000, 1 / 30);
                State.lastFrame = now;

                this.frameCount++;
                this.smoothDelta = this.smoothDelta * AnimationState.smoothFactor +
                    rawDelta * (1 - AnimationState.smoothFactor);
                return this.smoothDelta;
            }
        };

        // 🎨 Christmas Animation Settings
        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.LightSwitch",
            name: "🎄 Christmas Lights",
            type: "combo",
            options: [
                { value: 0, text: "⭘️ Off" },
                { value: 1, text: "🎄 On" }
            ],
            defaultValue: 1,
            section: "Christmas Effects",
            onChange: (value) => updateCache("ChristmasTheme.ChristmasEffects.LightSwitch", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.ColorScheme",
            name: "🎨 Color Scheme",
            type: "combo",
            options: [
                { value: "traditional", text: " 🎄 Traditional" },
                { value: "warm", text: " 🔆 Warm White" },
                { value: "cool", text: " ❄️ Cool White" },
                { value: "multicolor", text: " 🌈 Multicolor" },
                { value: "pastel", text: " 🎀 Pastel" },
                { value: "newyear", text: " 🎉 New Year's Eve" }
            ],
            defaultValue: "traditional",
            section: "Christmas Effects",
            onChange: (value) => updateCache("ChristmasTheme.ChristmasEffects.ColorScheme", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.Twinkle",
            name: "✨ Light Effect",
            type: "combo",
            options: [
                { value: "steady", text: "Steady" },
                { value: "gentle", text: "Gentle Twinkle" },
                { value: "sparkle", text: "Sparkle" },
                { value: "candycane", text: "🍬 Candy Cane" },
                { value: "frost", text: "❄️ Frost Trail" },
                { value: "aurora", text: "🌌 Aurora Flow" }
            ],
            defaultValue: "gentle",
            section: "Christmas Effects",
            onChange: (value) => updateCache("ChristmasTheme.ChristmasEffects.Twinkle", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.Thickness",
            name: "💫 Light Size",
            type: "slider",
            default: 3,
            min: 1,
            max: 10,
            step: 0.5,
            section: "Christmas Effects",
            onChange: (value) => updateCache("ChristmasTheme.ChristmasEffects.Thickness", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.GlowIntensity",
            name: "✨ Glow Intensity",
            type: "slider",
            default: 20,
            min: 0,
            max: 30,
            step: 1,
            section: "Christmas Effects",
            onChange: (value) => updateCache("ChristmasTheme.ChristmasEffects.GlowIntensity", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.Direction",
            name: "🔄 Flow Direction",
            type: "combo",
            options: [
                { value: -1, text: "Forward ➡️" },
                { value: 1, text: "Reverse ⬅️" }
            ],
            defaultValue: -1,
            section: "Christmas Effects",
            onChange: (value) => updateCache("ChristmasTheme.ChristmasEffects.Direction", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.BulbShape",
            name: "💡 Bulb Shape",
            type: "combo",
            options: [
                { value: "classic", text: "🔴 Classic Round" },
                { value: "icicle", text: "❄️ Icicle Point" }
            ],
            defaultValue: "classic",
            section: "Christmas Effects",
            onChange: (value) => updateCache("ChristmasTheme.ChristmasEffects.BulbShape", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Link Style",
            name: "🔗 Link Style",
            type: "combo",
            options: [
                { value: "spline", text: "Spline" },
                { value: "straight", text: "Straight" },
                { value: "linear", text: "Linear" },
                { value: "hidden", text: "Hidden" }
            ],
            defaultValue: "spline",
            section: "Link Style",
            onChange: (value) => updateCache("ChristmasTheme.Link Style", value)
        });

        // Add Snowflake Settings
        app.ui.settings.addSetting({
            id: "ChristmasTheme.Snowflake.Enabled",
            name: "❄️ Snow Effect",
            type: "combo",
            options: [
                { value: 0, text: "⭘️ Off" },
                { value: 1, text: "❄️ On" }
            ],
            defaultValue: 1,
            section: "Snowflake",
            onChange: (value) => {
                updateCache("ChristmasTheme.Snowflake.Enabled", value);
                if (window.snowflakeState) {
                    if (!value) {
                        window.snowflakeState.flakes = [];
                        window.snowflakeState.currentBatch = 0;
                        window.snowflakeState.renderSnowflakes();
                        const snowContainer = document.getElementById('comfy-aether-snow');
                        if (snowContainer) {
                            snowContainer.style.display = 'none';
                        }
                    } else {
                        if (window.snowflakeState.flakes.length === 0) {
                            window.snowflakeState.isInitializing = true;
                            const snowContainer = document.getElementById('comfy-aether-snow');
                            if (snowContainer) {
                                snowContainer.style.display = 'block';
                            }
                            window.snowflakeState.addBatch();
                        }
                    }
                }
            }
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Snowflake.ColorScheme",
            name: "❄️ Snowflake Color",
            type: "combo",
            options: [
                { value: "white", text: "❄️ Classic White" },
                { value: "blue", text: "💠 Ice Blue" },
                { value: "rainbow", text: "🌈 Rainbow" },
                { value: "match", text: "🎨 Match Lights" },
                { value: "newyear", text: "🎉 New Year's Eve" }
            ],
            defaultValue: "white",
            section: "Snowflake",
            onChange: (value) => updateCache("ChristmasTheme.Snowflake.ColorScheme", value)
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Snowflake.Glow",
            name: "✨ Snowflake Glow",
            type: "slider",
            default: 10,
            min: 0,
            max: 20,
            step: 1,
            section: "Snowflake",
            onChange: (value) => updateCache("ChristmasTheme.Snowflake.Glow", value)
        });

        // Load stored values AFTER settings are registered
        loadSettingFromStorage("ChristmasTheme.PauseDuringRender");
        loadSettingFromStorage("ChristmasTheme.ChristmasEffects.LightSwitch");
        loadSettingFromStorage("ChristmasTheme.ChristmasEffects.ColorScheme");
        loadSettingFromStorage("ChristmasTheme.ChristmasEffects.Twinkle");
        loadSettingFromStorage("ChristmasTheme.ChristmasEffects.Thickness");
        loadSettingFromStorage("ChristmasTheme.ChristmasEffects.GlowIntensity");
        loadSettingFromStorage("ChristmasTheme.ChristmasEffects.Direction");
        loadSettingFromStorage("ChristmasTheme.ChristmasEffects.BulbShape");
        loadSettingFromStorage("ChristmasTheme.Link Style");
        loadSettingFromStorage("ChristmasTheme.Snowflake.Enabled");
        loadSettingFromStorage("ChristmasTheme.Snowflake.ColorScheme");
        loadSettingFromStorage("ChristmasTheme.Snowflake.Glow");

        // 🛠 Override default connection drawing
        const origDrawConnections = LGraphCanvas.prototype.drawConnections;

        LGraphCanvas.prototype.drawConnections = function (ctx) {
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

        // Optimized Link Renderers with reduced function calls
        const LinkRenderers = {
            spline: {
                getLength(start, end) {
                    const dx = end[0] - start[0];
                    const dy = end[1] - start[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    // Approximate spline length (slightly longer than straight)
                    return dist * 1.15;
                },

                getPoint(start, end, t, out) {
                    const dx = end[0] - start[0];
                    const dy = end[1] - start[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const bendDistance = Math.min(dist * 0.5, 100);

                    const p0x = start[0], p0y = start[1];
                    const p1x = start[0] + bendDistance, p1y = start[1];
                    const p2x = end[0] - bendDistance, p2y = end[1];
                    const p3x = end[0], p3y = end[1];

                    const t2 = t * t;
                    const t3 = t2 * t;
                    const mt = 1 - t;
                    const mt2 = mt * mt;
                    const mt3 = mt2 * mt;

                    out[0] = mt3 * p0x + 3 * mt2 * t * p1x + 3 * mt * t2 * p2x + t3 * p3x;
                    out[1] = mt3 * p0y + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * p3y;
                },

                draw(ctx, start, end, color, thickness) {
                    const dx = end[0] - start[0];
                    const dy = end[1] - start[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const bendDistance = Math.min(dist * 0.5, 100);

                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.bezierCurveTo(
                        start[0] + bendDistance, start[1],
                        end[0] - bendDistance, end[1],
                        end[0], end[1]
                    );
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },

            straight: {
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
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },

            linear: {
                getLength(start, end) {
                    const midX = (start[0] + end[0]) / 2;
                    return Math.abs(midX - start[0]) + Math.abs(end[1] - start[1]) + Math.abs(end[0] - midX);
                },

                getPoint(start, end, t, out) {
                    const midX = (start[0] + end[0]) / 2;

                    if (t <= 0.33) {
                        const segmentT = t / 0.33;
                        out[0] = start[0] + (midX - start[0]) * segmentT;
                        out[1] = start[1];
                    } else if (t <= 0.67) {
                        const segmentT = (t - 0.33) / 0.34;
                        out[0] = midX;
                        out[1] = start[1] + (end[1] - start[1]) * segmentT;
                    } else {
                        const segmentT = (t - 0.67) / 0.33;
                        out[0] = midX + (end[0] - midX) * segmentT;
                        out[1] = end[1];
                    }
                },

                draw(ctx, start, end, color, thickness) {
                    const midX = (start[0] + end[0]) / 2;
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(midX, start[1]);
                    ctx.lineTo(midX, end[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },

            hidden: {
                getLength(start, end) {
                    const dx = end[0] - start[0];
                    const dy = end[1] - start[1];
                    return Math.sqrt(dx * dx + dy * dy);
                },
                getPoint(start, end, t, out) {
                    out[0] = start[0] + (end[0] - start[0]) * t;
                    out[1] = start[1] + (end[1] - start[1]) * t;
                },
                draw() { }
            }
        };

        // Reusable point array for getPoint calls
        const tempPoint = new Float32Array(2);

        // Pre-calculate sin lookup table for twinkle effects
        const SIN_TABLE_SIZE = 360;
        const sinTable = new Float32Array(SIN_TABLE_SIZE);
        for (let i = 0; i < SIN_TABLE_SIZE; i++) {
            sinTable[i] = Math.sin((i / SIN_TABLE_SIZE) * Math.PI * 2);
        }
        function fastSin(x) {
            const idx = ((x % (Math.PI * 2)) / (Math.PI * 2) * SIN_TABLE_SIZE) | 0;
            return sinTable[(idx + SIN_TABLE_SIZE) % SIN_TABLE_SIZE];
        }

        // 🎄 Optimized Christmas Lights Pattern
        LGraphCanvas.prototype.renderChristmasLights = function (ctx, items, phase) {
            const Direction = AnimationState.Direction;
            const Thickness = getSetting("ChristmasTheme.ChristmasEffects.Thickness");
            const glowIntensity = getSetting("ChristmasTheme.ChristmasEffects.GlowIntensity");
            const colorScheme = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
            const twinkleMode = getSetting("ChristmasTheme.ChristmasEffects.Twinkle");
            const linkStyle = getSetting("ChristmasTheme.Link Style");
            const bulbShape = getSetting("ChristmasTheme.ChristmasEffects.BulbShape");

            const renderer = LinkRenderers[linkStyle];
            const christmasColors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.traditional;
            const colorCount = christmasColors.length;

            // Get adaptive settings based on current performance
            const perfSettings = PerformanceMonitor.getSettings();
            const baseSpacing = perfSettings.lightSpacing;
            const skipCaps = perfSettings.skipCaps;
            const reducedGlow = perfSettings.reducedGlow;

            // Pre-calculate twinkle function based on mode
            const steadyTwinkle = twinkleMode === "steady";
            const sparkleMode = twinkleMode === "sparkle";
            const candyCaneMode = twinkleMode === "candycane";
            const frostMode = twinkleMode === "frost";
            const auroraMode = twinkleMode === "aurora";

            // Special rendering for new animation modes
            if (candyCaneMode || frostMode || auroraMode) {
                for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
                    const { start, end, color } = items[itemIdx];
                    const totalLength = renderer.getLength(start, end);

                    if (candyCaneMode) {
                        // 🍬 Candy Cane: Animated diagonal stripes
                        const stripeWidth = 15;
                        const numSegments = Math.floor(totalLength / 3);

                        for (let i = 0; i <= numSegments; i++) {
                            const t = i / numSegments;
                            renderer.getPoint(start, end, t, tempPoint);

                            // Flowing stripe pattern
                            const stripePhase = (t * totalLength / stripeWidth - phase * 3) % 1;
                            const isRed = stripePhase < 0.5;

                            ctx.fillStyle = isRed ? '#ff0000' : '#ffffff';
                            ctx.shadowBlur = isRed ? 8 : 4;
                            ctx.shadowColor = isRed ? '#ff0000' : '#ffffff';
                            ctx.globalAlpha = 0.9;

                            ctx.beginPath();
                            ctx.arc(tempPoint[0], tempPoint[1], Thickness * 1.2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else if (frostMode) {
                        // ❄️ Frost Trail: Icy crystals with spreading glow
                        const numCrystals = Math.floor(totalLength / baseSpacing);
                        const frostColors = ['#e0ffff', '#b0e0e6', '#87ceeb', '#add8e6', '#ffffff'];

                        for (let i = 0; i <= numCrystals; i++) {
                            const t = i / numCrystals;
                            renderer.getPoint(start, end, t, tempPoint);

                            // Crystal shimmer effect
                            const shimmer = 0.6 + fastSin(phase * 4 + i * 2) * 0.4;
                            const crystalColor = frostColors[i % frostColors.length];

                            // Outer glow
                            ctx.shadowBlur = 15 * shimmer;
                            ctx.shadowColor = '#87ceeb';
                            ctx.fillStyle = crystalColor;
                            ctx.globalAlpha = shimmer * 0.8;

                            // Draw crystal shape (6-pointed)
                            const size = Thickness * (1 + shimmer * 0.5);
                            ctx.beginPath();
                            for (let p = 0; p < 6; p++) {
                                const angle = (p / 6) * Math.PI * 2 - Math.PI / 2;
                                const px = tempPoint[0] + Math.cos(angle) * size;
                                const py = tempPoint[1] + Math.sin(angle) * size;
                                if (p === 0) ctx.moveTo(px, py);
                                else ctx.lineTo(px, py);
                            }
                            ctx.closePath();
                            ctx.fill();

                            // Inner bright core
                            ctx.beginPath();
                            ctx.arc(tempPoint[0], tempPoint[1], size * 0.3, 0, Math.PI * 2);
                            ctx.fillStyle = '#ffffff';
                            ctx.globalAlpha = shimmer;
                            ctx.fill();
                        }
                    } else if (auroraMode) {
                        // 🌌 Aurora Flow: Undulating rainbow waves
                        const numPoints = Math.floor(totalLength / 5);
                        const auroraColors = ['#00ff88', '#00ffcc', '#00ccff', '#0088ff', '#8800ff', '#ff00ff'];

                        for (let i = 0; i <= numPoints; i++) {
                            const t = i / numPoints;
                            renderer.getPoint(start, end, t, tempPoint);

                            // Undulating wave offset
                            const waveOffset = fastSin(t * Math.PI * 3 + phase * 2) * 8;
                            const x = tempPoint[0];
                            const y = tempPoint[1] + waveOffset;

                            // Color cycling through aurora palette
                            const colorT = (t - phase * 0.5 + 1) % 1;
                            const colorIndex = Math.floor(colorT * auroraColors.length);
                            const nextColorIndex = (colorIndex + 1) % auroraColors.length;
                            const colorBlend = (colorT * auroraColors.length) % 1;

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
            const drawIcicleBulb = (ctx, x, y, size) => {
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
                    renderer.draw(ctx, start, end, color, Thickness);
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

        // 🔄 Workflow State Management
        const WorkflowState = {
            isRendering: false,
            isExecuting: false,
            jobCount: 0,
            executionStartTime: 0,

            checkState() {
                const currentQueueLength = (app.queue && Array.isArray(app.queue)) ? app.queue.length : 0;
                const isGraphRunning = app.graph && (app.graph._is_running === true);
                const minExecutionTime = 5000;
                const isWithinExecutionWindow = (Date.now() - this.executionStartTime) < minExecutionTime;

                return this.isRendering || this.isExecuting || isGraphRunning ||
                    this.jobCount > 0 || currentQueueLength > 0 || isWithinExecutionWindow;
            },

            startExecution() {
                this.isRendering = true;
                this.isExecuting = true;
                this.jobCount++;
                this.executionStartTime = Date.now();
            },

            reset() {
                const queueLength = (app.queue && Array.isArray(app.queue)) ? app.queue.length : 0;
                const isGraphRunning = app.graph && (app.graph._is_running === true);
                const minExecutionTime = 5000;
                const isWithinExecutionWindow = (Date.now() - this.executionStartTime) < minExecutionTime;

                if (queueLength === 0 && !isGraphRunning && !isWithinExecutionWindow) {
                    this.isRendering = false;
                    this.isExecuting = false;
                    this.jobCount = 0;
                    this.resumeAnimations();
                }
            },

            resumeAnimations() {
                if (State.animationFrame) {
                    cancelAnimationFrame(State.animationFrame);
                    State.animationFrame = null;
                }

                if (app.graph && app.graph.canvas) {
                    app.graph.setDirtyCanvas(true, true);
                }

                const snowContainer = document.getElementById('comfy-aether-snow');
                if (snowContainer) {
                    snowContainer.style.display = 'block';
                }

                State.animationFrame = requestAnimationFrame(animate);
            }
        };

        // Monitor queue events
        const origQueuePrompt = app.queuePrompt;
        app.queuePrompt = function () {
            WorkflowState.startExecution();

            const result = origQueuePrompt.apply(this, arguments);

            if (result && typeof result.then === 'function') {
                result.finally(() => {
                    [5000, 6000, 7000].forEach(delay => {
                        setTimeout(() => WorkflowState.reset(), delay);
                    });
                });
            }

            return result;
        };

        app.eventBus?.addEventListener("execution_complete", () => {
            [5000, 6000, 7000].forEach(delay => {
                setTimeout(() => WorkflowState.reset(), delay);
            });
        });

        // 🎬 Enhanced Animation Loop
        function animate() {
            // Skip if page not visible
            if (!isPageVisible) {
                State.animationFrame = requestAnimationFrame(animate);
                return;
            }

            const shouldAnimate = getSetting("ChristmasTheme.ChristmasEffects.LightSwitch") > 0;
            const isPaused = WorkflowState.checkState() && getSetting("ChristmasTheme.PauseDuringRender");

            const snowContainer = document.getElementById('comfy-aether-snow');
            if (snowContainer) {
                snowContainer.style.display = isPaused ? 'none' : 'block';
            }

            if (shouldAnimate && !isPaused) {
                app.graph.setDirtyCanvas(true, true);
                State.animationFrame = requestAnimationFrame(animate);
            } else if (isPaused) {
                if (State.animationFrame) {
                    cancelAnimationFrame(State.animationFrame);
                    State.animationFrame = null;
                }
            } else {
                State.animationFrame = requestAnimationFrame(animate);
            }
        }

        // Initialize Animation System
        animate();

        // 🧹 Cleanup on Extension Unload
        return () => {
            if (State.animationFrame) {
                cancelAnimationFrame(State.animationFrame);
                State.animationFrame = null;
            }
        };
    }
});