import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
    name: "Christmas.Theme.LightSwitch",
    async setup() {
        // 🔮 Basic Constants
        const PHI = 1.618033988749895;

        // Add Performance Monitoring
        const PerformanceMonitor = {
            frameTimeHistory: new Array(60).fill(0),
            currentIndex: 0,
            warningThreshold: 16.67, // 60fps threshold
            criticalThreshold: 33.33, // 30fps threshold
            
            addFrameTime(time) {
                this.frameTimeHistory[this.currentIndex] = time;
                this.currentIndex = (this.currentIndex + 1) % this.frameTimeHistory.length;
                
                const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
                
                if (avgFrameTime > this.criticalThreshold) {
                    console.warn('Performance Critical: Average frame time:', avgFrameTime.toFixed(2), 'ms');
                    return 'critical';
                } else if (avgFrameTime > this.warningThreshold) {
                    console.warn('Performance Warning: Average frame time:', avgFrameTime.toFixed(2), 'ms');
                    return 'warning';
                }
                return 'normal';
            }
        };

        // Add Performance Settings
        app.ui.settings.addSetting({
            id: "ChristmasTheme.PauseDuringRender",
            name: "⏸️ Pause Effects During Render",
            type: "combo",
            options: [
                {value: true, text: "✅ Enabled"},
                {value: false, text: "❌ Disabled"}
            ],
            defaultValue: true,
            section: "Performance",
            tooltip: "Pause animations during rendering to improve performance"
        });

        // Reusable Arrays Pool
        const ArrayPool = {
            float32Pool: [],
            
            getFloat32Array(size) {
                if (this.float32Pool.length > 0) {
                    return this.float32Pool.pop();
                }
                return new Float32Array(2);
            },
            
            releaseFloat32Array(array) {
                if (this.float32Pool.length < 100) { // Limit pool size
                    this.float32Pool.push(array);
                }
            }
        };

        // ⚡ State Management System
        const State = {
            isRunning: false,
            phase: 0,
            lastFrame: performance.now(),
            animationFrame: null,
            renderQueue: new Map(), // Reuse render queue
            performanceMode: 'normal',
            isRendering: false  // Add this new state property
        };

        // 🎭 Animation State Controller
        const AnimationState = {
            targetPhase: 0,
            Direction: 1,
            transitionSpeed: PHI,
            smoothFactor: 0.95,
            
            update(delta) {
                const flowDirection = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.Direction", 1);
                
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
                const rawDelta = Math.min((now - State.lastFrame) / 1000, 1/30);
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
                {value: 0, text: "⭘️ Off"},
                {value: 1, text: "🎄 On"}
            ],
            defaultValue: 1,
            section: "Christmas Effects"
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.ColorScheme",
            name: "🎨 Color Scheme",
            type: "combo",
            options: [
                {value: "traditional", text: " 🎄 Traditional"},
                {value: "warm", text: " 🔆 Warm White"},
                {value: "cool", text: " ❄️ Cool White"},
                {value: "multicolor", text: " 🌈 Multicolor"},
                {value: "pastel", text: " 🎀 Pastel"},
                {value: "newyear", text: " 🎉 New Year's Eve"}
            ],
            defaultValue: "traditional",
            section: "Christmas Effects"
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.Twinkle",
            name: "✨ Light Effect",
            type: "combo",
            options: [
                {value: "steady", text: "Steady"},
                {value: "gentle", text: "Gentle Twinkle"},
                {value: "sparkle", text: "Sparkle"}
            ],
            defaultValue: "gentle",
            section: "Christmas Effects"
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.Thickness",
            name: "💫 Light Size",
            type: "slider",
            default: 3,
            min: 1,
            max: 10,
            step: 0.5,
            section: "Christmas Effects"
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.GlowIntensity",
            name: "✨ Glow Intensity",
            type: "slider",
            default: 20,
            min: 0,
            max: 30,
            step: 1,
            section: "Christmas Effects"
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.ChristmasEffects.Direction",
            name: "🔄 Flow Direction",
            type: "combo",
            options: [
                {value: 1, text: "Forward ➡️"},
                {value: -1, text: "Reverse ⬅️"}
            ],
            defaultValue: 1,
            section: "Christmas Effects"
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Link Style",
            name: "🔗 Link Style",
            type: "combo",
            options: [
                {value: "spline", text: "Spline"},
                {value: "straight", text: "Straight"},
                {value: "linear", text: "Linear"},
                {value: "hidden", text: "Hidden"}
            ],
            defaultValue: "spline",
            section: "Link Style"
        });

        // Add Snowflake Settings
        app.ui.settings.addSetting({
            id: "ChristmasTheme.Snowflake.Enabled",
            name: "❄️ Snow Effect",
            type: "combo",
            options: [
                {value: 0, text: "⭘️ Off"},
                {value: 1, text: "❄️ On"}
            ],
            defaultValue: 1,
            section: "Snowflake",
            onChange: (value) => {
                if (window.snowflakeState) {
                    if (!value) {
                        // Clear existing snowflakes
                        window.snowflakeState.flakes = [];
                        window.snowflakeState.currentBatch = 0;
                        window.snowflakeState.renderSnowflakes();
                        const snowContainer = document.getElementById('comfy-aether-snow');
                        if (snowContainer) {
                            snowContainer.style.display = 'none';
                        }
                    } else {
                        // Only start new batch if turning on and no flakes exist
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
                {value: "white", text: "❄️ Classic White"},
                {value: "blue", text: "💠 Ice Blue"},
                {value: "rainbow", text: "🌈 Rainbow"},
                {value: "match", text: "🎨 Match Lights"},
                {value: "newyear", text: "🎉 New Year's Eve"}
            ],
            defaultValue: "white",
            section: "Snowflake"
        });

        app.ui.settings.addSetting({
            id: "ChristmasTheme.Snowflake.Glow",
            name: "✨ Snowflake Glow",
            type: "slider",
            default: 10,
            min: 0,
            max: 20,
            step: 1,
            section: "Snowflake"
        });

        // 🛠 Override default connection drawing
        const origDrawConnections = LGraphCanvas.prototype.drawConnections;
        
        LGraphCanvas.prototype.drawConnections = function(ctx) {
            try {
                const startTime = performance.now();
                const animStyle = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.LightSwitch", 1);
                
                if (animStyle === 0) {
                    origDrawConnections.call(this, ctx);
                    return;
                }

                const delta = TimingManager.update();
                const phase = AnimationState.update(delta);

                ctx.save();
                
                // Clear existing render queue
                State.renderQueue.clear();
                
                for (const linkId in this.graph.links) {
                    const linkData = this.graph.links[linkId];
                    if (!linkData) continue;

                    const originNode = this.graph._nodes_by_id[linkData.origin_id];
                    const targetNode = this.graph._nodes_by_id[linkData.target_id];
                    
                    if (!originNode || !targetNode || originNode.flags.collapsed || targetNode.flags.collapsed) continue;

                    const startPos = ArrayPool.getFloat32Array(2);
                    const endPos = ArrayPool.getFloat32Array(2);

                    originNode.getConnectionPos(false, linkData.origin_slot, startPos);
                    targetNode.getConnectionPos(true, linkData.target_slot, endPos);

                    const color = linkData.type ? 
                        LGraphCanvas.link_type_colors[linkData.type] : 
                        this.default_connection_color;

                    if (!State.renderQueue.has(1)) {
                        State.renderQueue.set(1, []);
                    }
                    State.renderQueue.get(1).push({
                        start: startPos,
                        end: endPos,
                        color: color,
                        linkId: linkId
                    });
                }

                // Process render queue
                State.renderQueue.forEach((items) => {
                    this.renderChristmasLights(ctx, items, phase);
                });

                // Release arrays back to pool
                State.renderQueue.get(1)?.forEach(item => {
                    ArrayPool.releaseFloat32Array(item.start);
                    ArrayPool.releaseFloat32Array(item.end);
                });

                ctx.restore();

                // Monitor performance
                const frameTime = performance.now() - startTime;
                State.performanceMode = PerformanceMonitor.addFrameTime(frameTime);
                
            } catch (error) {
                console.error("Error in drawConnections:", error, error.stack);
                origDrawConnections.call(this, ctx);
            }
        };

        // Link rendering functions with path calculations
        const LinkRenderers = {
            spline: {
                getLength: function(start, end) {
                    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                    const bendDistance = Math.min(dist * 0.5, 100);
                    
                    // Increase samples for more accurate length calculation
                    const samples = 40;
                    let length = 0;
                    let prevPoint = this.getPoint(start, end, 0);
                    
                    for (let i = 1; i <= samples; i++) {
                        const t = i / samples;
                        const point = this.getPoint(start, end, t);
                        length += Math.sqrt(
                            Math.pow(point[0] - prevPoint[0], 2) + 
                            Math.pow(point[1] - prevPoint[1], 2)
                        );
                        prevPoint = point;
                    }
                    
                    return length;
                },
                
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    // Increase samples for smoother spacing
                    const samples = 40;
                    let accumulatedLength = 0;
                    let prevPoint = this.getPoint(start, end, 0);
                    
                    for (let i = 1; i <= samples; i++) {
                        const t = i / samples;
                        const point = this.getPoint(start, end, t);
                        const segmentLength = Math.sqrt(
                            Math.pow(point[0] - prevPoint[0], 2) + 
                            Math.pow(point[1] - prevPoint[1], 2)
                        );
                        
                        accumulatedLength += segmentLength;
                        
                        if (accumulatedLength >= targetDist) {
                            const prevT = (i - 1) / samples;
                            const excess = accumulatedLength - targetDist;
                            return prevT + ((t - prevT) * (1 - excess / segmentLength));
                        }
                        
                        prevPoint = point;
                    }
                    
                    return 1;
                },
                
                getPoint: function(start, end, t) {
                    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                    const bendDistance = Math.min(dist * 0.5, 100);
                    
                    const p0 = { x: start[0], y: start[1] };
                    const p1 = { x: start[0] + bendDistance, y: start[1] };
                    const p2 = { x: end[0] - bendDistance, y: end[1] };
                    const p3 = { x: end[0], y: end[1] };
                    
                    const cx = 3 * (p1.x - p0.x);
                    const bx = 3 * (p2.x - p1.x) - cx;
                    const ax = p3.x - p0.x - cx - bx;
                    
                    const cy = 3 * (p1.y - p0.y);
                    const by = 3 * (p2.y - p1.y) - cy;
                    const ay = p3.y - p0.y - cy - by;
                    
                    const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
                    const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;
                    
                    return [x, y];
                },
                draw: function(ctx, start, end, color, Thickness) {
                    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                    const bendDistance = Math.min(dist * 0.5, 100);
                    
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.bezierCurveTo(
                        start[0] + bendDistance, start[1],
                        end[0] - bendDistance, end[1],
                        end[0], end[1]
                    );
                    ctx.strokeStyle = color;
                    ctx.lineWidth = Thickness * 0.8;
                    ctx.stroke();
                }
            },
            
            straight: {
                getLength: function(start, end) {
                    return Math.sqrt(
                        Math.pow(end[0] - start[0], 2) + 
                        Math.pow(end[1] - start[1], 2)
                    );
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, Thickness) {
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = Thickness * 0.8;
                    ctx.stroke();
                }
            },
            
            linear: {
                getLength: function(start, end) {
                    const midX = (start[0] + end[0]) / 2;
                    const horizontalLength1 = Math.abs(midX - start[0]);
                    const verticalLength = Math.abs(end[1] - start[1]);
                    const horizontalLength2 = Math.abs(end[0] - midX);
                    
                    return horizontalLength1 + verticalLength + horizontalLength2;
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    const midX = (start[0] + end[0]) / 2;
                    const horizontalLength1 = Math.abs(midX - start[0]);
                    const verticalLength = Math.abs(end[1] - start[1]);
                    const horizontalLength2 = Math.abs(end[0] - midX);
                    
                    // Calculate segment proportions of total length
                    const segment1Proportion = horizontalLength1 / totalLength;
                    const segment2Proportion = verticalLength / totalLength;
                    const segment3Proportion = horizontalLength2 / totalLength;
                    
                    const normalizedDist = targetDist / totalLength;
                    
                    // Determine which segment we're in and calculate appropriate t
                    if (normalizedDist <= segment1Proportion) {
                        // First horizontal segment
                        return (normalizedDist / segment1Proportion) * 0.33;
                    } else if (normalizedDist <= segment1Proportion + segment2Proportion) {
                        // Vertical segment
                        const segmentProgress = (normalizedDist - segment1Proportion) / segment2Proportion;
                        return 0.33 + (segmentProgress * 0.34);
                    } else {
                        // Final horizontal segment
                        const segmentProgress = (normalizedDist - (segment1Proportion + segment2Proportion)) / segment3Proportion;
                        return 0.67 + (segmentProgress * 0.33);
                    }
                },
                getPoint: function(start, end, t) {
                    const midX = (start[0] + end[0]) / 2;
                    
                    if (t <= 0.33) {
                        // First horizontal segment
                        const segmentT = t / 0.33;
                        return [
                            start[0] + (midX - start[0]) * segmentT,
                            start[1]
                        ];
                    } else if (t <= 0.67) {
                        // Vertical segment
                        const segmentT = (t - 0.33) / 0.34;
                        return [
                            midX,
                            start[1] + (end[1] - start[1]) * segmentT
                        ];
                    } else {
                        // Final horizontal segment
                        const segmentT = (t - 0.67) / 0.33;
                        return [
                            midX + (end[0] - midX) * segmentT,
                            end[1]
                        ];
                    }
                },
                draw: function(ctx, start, end, color, Thickness) {
                    const midX = (start[0] + end[0]) / 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(midX, start[1]);
                    ctx.lineTo(midX, end[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = Thickness * 0.8;
                    ctx.stroke();
                }
            },
            
            hidden: {
                getLength: function(start, end) {
                    return Math.sqrt(
                        Math.pow(end[0] - start[0], 2) + 
                        Math.pow(end[1] - start[1], 2)
                    );
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, Thickness) {
                    // Don't render anything
                }
            }
        };

        // 🎄 Christmas Lights Pattern
        LGraphCanvas.prototype.renderChristmasLights = function(ctx, items, phase) {
            const Direction = AnimationState.Direction;
            const Thickness = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.GlowIntensity", 10);
            const colorScheme = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.ColorScheme", "traditional");
            const twinkleMode = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.Twinkle", "gentle");
            const linkStyle = app.ui.settings.getSettingValue("ChristmasTheme.Link Style", "spline");
            
            // Color schemes
            const colorSchemes = {
                traditional: [
                    '#ff0000', // Red
                    '#00ff00', // Green
                    '#ffff00', // Yellow
                    '#0000ff', // Blue
                    '#ffffff'  // White
                ],
                warm: [
                    '#ffd700', // Warm gold
                    '#ffb347', // Warm yellow
                    '#ffa07a', // Light salmon
                    '#ff8c69', // Salmon
                    '#fff0f5'  // Warm white
                ],
                cool: [
                    '#f0ffff', // Cool white
                    '#e0ffff', // Light cyan
                    '#b0e2ff', // Light blue
                    '#87cefa', // Light sky blue
                    '#b0c4de'  // Light steel blue
                ],
                multicolor: [
                    '#ff1493', // Deep pink
                    '#00ff7f', // Spring green
                    '#ff4500', // Orange red
                    '#4169e1', // Royal blue
                    '#9370db'  // Medium purple
                ],
                pastel: [
                    '#ffb6c1', // Light pink
                    '#98fb98', // Pale green
                    '#87ceeb', // Sky blue
                    '#dda0dd', // Plum
                    '#f0e68c'  // Khaki
                ],
                newyear: [
                    '#00ffff', // Electric Cyan/Neon Blue
                    '#ff1493', // Deep Pink/Hot Pink
                    '#ffd700', // Gold
                    '#4b0082', // Indigo (night sky)
                    '#7fff00'  // Electric Lime
                ]
            };

            // Get current zoom level for spacing adjustment
            const zoomLevel = this.ds ? this.ds.scale : 1;
            
            items.forEach(({start, end, color}) => {
                // Draw base string (wire) with original link color
                if (linkStyle !== 'hidden') {
                    ctx.globalAlpha = 0.8;
                    ctx.shadowBlur = 0;
                    LinkRenderers[linkStyle].draw(ctx, start, end, color, Thickness);
                    ctx.globalAlpha = 1;
                }
                
                if (linkStyle === 'hidden' && !app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.LightSwitch", 1)) {
                    return;
                }
                
                // Calculate total path length for even spacing
                const totalLength = LinkRenderers[linkStyle].getLength(start, end);
                const baseSpacing = 30;
                const numLights = Math.floor(totalLength / baseSpacing);
                
                // Select colors based on scheme
                const christmasColors = colorSchemes[colorScheme] || colorSchemes.traditional;
                
                // Configure twinkle effect
                const getTwinkle = (i, phase) => {
                    switch(twinkleMode) {
                        case "steady":
                            return 1;
                        case "gentle":
                            return 0.85 + Math.sin(-phase * 5 + i * 3) * 0.15;
                        case "sparkle":
                            return 0.7 + Math.sin(-phase * 8 + i * 5) * 0.3 * Math.random();
                        default:
                            return 0.85 + Math.sin(-phase * 5 + i * 3) * 0.15;
                    }
                };
                
                // Draw lights with even spacing
                const baseBatchSize = 5;
                const dynamicBatchSize = Math.max(
                    baseBatchSize,
                    Math.floor(numLights / (60 / TimingManager.smoothDelta))
                );
                const batchSize = Math.min(dynamicBatchSize, Math.ceil(numLights * 0.2));
                
                for (let batch = 0; batch <= numLights; batch += batchSize) {
                    const endBatch = Math.min(batch + batchSize, numLights + 1);
                    
                    for (let i = batch; i < endBatch; i++) {
                        // Calculate target distance along path for this light
                        const targetDist = (i / numLights) * totalLength;
                        // Get normalized t parameter for even spacing
                        const t = LinkRenderers[linkStyle].getNormalizedT(start, end, targetDist, totalLength);
                        const wobble = Math.sin(t * Math.PI * 4 - phase * Direction * 0) * 5;
                        
                        const pos = LinkRenderers[linkStyle].getPoint(start, end, t);
                        const x = pos[0];
                        const y = pos[1] + wobble;
                        
                        // Light color cycling - match the Direction
                        const colorIndex = (i - Math.floor(phase * 2 * Direction)) % christmasColors.length;
                        const adjustedIndex = colorIndex < 0 ? christmasColors.length + colorIndex : colorIndex;
                        const lightColor = christmasColors[adjustedIndex];
                        
                        // Apply twinkle effect
                        const flicker = getTwinkle(i, phase);
                        
                        // Light bulb with glow
                        ctx.beginPath();
                        ctx.shadowBlur = glowIntensity * 1.5 * flicker;
                        ctx.arc(x, y, Thickness * 1.5, 0, Math.PI * 2);
                        ctx.fillStyle = lightColor;
                        ctx.shadowColor = lightColor;
                        ctx.globalAlpha = flicker;
                        ctx.fill();
                        
                        // Light cap
                        ctx.beginPath();
                        ctx.shadowBlur = 0; // No Glow on cap
                        ctx.arc(x, y - Thickness, Thickness * 0.5, 0, Math.PI * 2);
                        ctx.fillStyle = '#silver';
                        ctx.globalAlpha = 1;
                        ctx.fill();
                    }
                }
                ctx.globalAlpha = 1;
            });
        };

        // 🔄 Improved State Management System
        const WorkflowState = {
            isRendering: false,
            isExecuting: false,
            jobCount: 0,
            lastQueueLength: 0,
            executionStartTime: 0,
            
            checkState() {
                // Safely check queue length and execution state
                const currentQueueLength = (app.queue && Array.isArray(app.queue)) ? app.queue.length : 0;
                const isGraphRunning = app.graph && (app.graph._is_running === true);
                
                // Check if we're still within the minimum execution time window
                const minExecutionTime = 5000; // 5 seconds minimum execution time
                const isWithinExecutionWindow = (Date.now() - this.executionStartTime) < minExecutionTime;
                
                const isProcessing = this.isRendering || 
                                   this.isExecuting || 
                                   isGraphRunning || 
                                   this.jobCount > 0 ||
                                   currentQueueLength > 0 ||
                                   isWithinExecutionWindow;
                
                // Debug state
                if (isProcessing) {
                    console.log("Processing state:", {
                        isRendering: this.isRendering,
                        isExecuting: this.isExecuting,
                        graphRunning: isGraphRunning,
                        jobCount: this.jobCount,
                        queueLength: currentQueueLength,
                        executionTime: Date.now() - this.executionStartTime,
                        isWithinWindow: isWithinExecutionWindow
                    });
                }
                
                return isProcessing;
            },
            
            startExecution() {
                this.isRendering = true;
                this.isExecuting = true;
                this.jobCount++;
                this.executionStartTime = Date.now();
                console.log("Starting execution at:", this.executionStartTime);
            },
            
            reset() {
                // Safely check conditions
                const queueLength = (app.queue && Array.isArray(app.queue)) ? app.queue.length : 0;
                const isGraphRunning = app.graph && (app.graph._is_running === true);
                const minExecutionTime = 5000; // 5 seconds minimum execution time
                const isWithinExecutionWindow = (Date.now() - this.executionStartTime) < minExecutionTime;
                
                console.log("Reset check:", {
                    queueLength,
                    isGraphRunning,
                    executionTime: Date.now() - this.executionStartTime,
                    isWithinWindow: isWithinExecutionWindow
                });
                
                // Only reset if all conditions are met
                if (queueLength === 0 && !isGraphRunning && !isWithinExecutionWindow) {
                    console.log("Reset conditions met, resuming animations");
                    this.isRendering = false;
                    this.isExecuting = false;
                    this.jobCount = 0;
                    
                    // Force animation resume
                    this.resumeAnimations();
                } else {
                    console.log("Reset attempted but conditions not met");
                }
            },

            resumeAnimations() {
                console.log("Attempting to resume animations");
                
                // Cancel any existing animation frame first
                if (State.animationFrame) {
                    cancelAnimationFrame(State.animationFrame);
                    State.animationFrame = null;
                }
                
                // Force a canvas update
                if (app.graph && app.graph.canvas) {
                    app.graph.setDirtyCanvas(true, true);
                }
                
                // Ensure snow is visible if it was hidden
                const snowContainer = document.getElementById('comfy-aether-snow');
                if (snowContainer) {
                    snowContainer.style.display = 'block';
                }

                // Start a new animation frame
                console.log("Starting new animation frame");
                State.animationFrame = requestAnimationFrame(animate);
            }
        };

        // Monitor queue events
        const origQueuePrompt = app.queuePrompt;
        app.queuePrompt = function() {
            WorkflowState.startExecution();
            console.log("Starting render - pausing animations");
            
            const result = origQueuePrompt.apply(this, arguments);
            
            if (result && typeof result.then === 'function') {
                result.finally(() => {
                    console.log("Queue prompt completed");
                    // Add multiple reset attempts with increasing delays
                    [5000, 6000, 7000].forEach(delay => {
                        setTimeout(() => {
                            WorkflowState.reset();
                        }, delay);
                    });
                });
            }
            
            return result;
        };

        // Add event listener for workflow execution complete
        app.eventBus?.addEventListener("execution_complete", () => {
            console.log("Execution complete event received");
            // Add multiple reset attempts with increasing delays
            [5000, 6000, 7000].forEach(delay => {
                setTimeout(() => {
                    WorkflowState.reset();
                }, delay);
            });
        });

        // 🎬 Enhanced Animation Loop
        function animate() {
            const shouldAnimate = app.ui.settings.getSettingValue("ChristmasTheme.ChristmasEffects.LightSwitch", 1) > 0;
            const isPaused = WorkflowState.checkState() && 
                           app.ui.settings.getSettingValue("ChristmasTheme.PauseDuringRender", true);
            
            // Handle snow animation pause
            const snowContainer = document.getElementById('comfy-aether-snow');
            if (snowContainer) {
                snowContainer.style.display = isPaused ? 'none' : 'block';
            }
            
            // Handle Christmas lights animation
            if (shouldAnimate && !isPaused) {
                app.graph.setDirtyCanvas(true, true);
                // Continue animation loop
                State.animationFrame = requestAnimationFrame(animate);
            } else if (isPaused) {
                console.log("Animation paused, clearing animation frame");
                if (State.animationFrame) {
                    cancelAnimationFrame(State.animationFrame);
                    State.animationFrame = null;
                }
            } else {
                // Continue animation loop even if not drawing
                State.animationFrame = requestAnimationFrame(animate);
            }
        }

        // Initialize Animation System
        console.log("Initializing animation system");
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