import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { initSettingsCache, getSetting, COLOR_SCHEMES } from "./settings-cache.js";
import { isPageVisible } from "./background-themes.js";
app.registerExtension({
  name: "Christmas.Theme.LightSwitch",
  async setup() {
    initSettingsCache();
    const PerformanceMonitor = {
      frameTimeHistory: new Float32Array(60),
      currentIndex: 0,
      sum: 0,
      warningThreshold: 8,
      // reduced threshold
      criticalThreshold: 16,
      _lastMode: "normal",
      adaptiveSettings: {
        normal: { lightSpacing: 15, skipCaps: false, reducedGlow: false },
        warning: { lightSpacing: 25, skipCaps: true, reducedGlow: false },
        critical: { lightSpacing: 40, skipCaps: true, reducedGlow: true }
      },
      addFrameTime(time) {
        this.sum -= this.frameTimeHistory[this.currentIndex];
        this.frameTimeHistory[this.currentIndex] = time;
        this.sum += time;
        this.currentIndex = (this.currentIndex + 1) % 60;
        const avg = this.sum / 60;
        let mode = "normal";
        if (avg > this.criticalThreshold) mode = "critical";
        else if (avg > this.warningThreshold) mode = "warning";
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
    const ArrayPool = {
      pool: [],
      init() {
        for (let i = 0; i < 1e3; i++) this.pool.push(new Float32Array(2));
      },
      get() {
        return this.pool.pop() || new Float32Array(2);
      },
      release(arr) {
        if (this.pool.length < 2e3) this.pool.push(arr);
      }
    };
    ArrayPool.init();
    const State = {
      isRunning: true,
      phase: 0,
      lastFrame: 0,
      animationFrame: null,
      performanceMode: "normal",
      isRendering: false,
      linkDataCache: new Array(1e3).fill(null).map(() => ({
        start: new Float32Array(2),
        end: new Float32Array(2),
        color: null
      })),
      linkDataIndex: 0
    };
    const LinkRenderers = {
      spline: {
        getLength(start, end) {
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const dist = Math.sqrt(dx * dx + dy * dy);
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
          const mt = 1 - t;
          const mt2 = mt * mt;
          const mt3 = mt2 * mt;
          const t2 = t * t;
          const t3 = t2 * t;
          out[0] = mt3 * p0x + 3 * mt2 * t * p1x + 3 * mt * t2 * p2x + t3 * p3x;
          out[1] = mt3 * p0y + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * p3y;
        },
        tracePath(ctx, start, end) {
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          const bendDistance = Math.min(dist * 0.5, 100);
          ctx.moveTo(start[0], start[1]);
          ctx.bezierCurveTo(start[0] + bendDistance, start[1], end[0] - bendDistance, end[1], end[0], end[1]);
        },
        draw(ctx, start, end, color, thickness) {
          ctx.beginPath();
          this.tracePath(ctx, start, end);
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
        tracePath(ctx, start, end) {
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(end[0], end[1]);
        },
        draw(ctx, start, end, color, thickness) {
          ctx.beginPath();
          this.tracePath(ctx, start, end);
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
        tracePath(ctx, start, end) {
          const midX = (start[0] + end[0]) / 2;
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(midX, start[1]);
          ctx.lineTo(midX, end[1]);
          ctx.lineTo(end[0], end[1]);
        },
        draw(ctx, start, end, color, thickness) {
          ctx.beginPath();
          this.tracePath(ctx, start, end);
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
        tracePath(ctx, start, end) {
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(end[0], end[1]);
        },
        draw() {
        }
      }
    };
    const SIN_TABLE_SIZE = 1024;
    const SIN_TABLE = new Float32Array(SIN_TABLE_SIZE);
    for (let i = 0; i < SIN_TABLE_SIZE; i++) {
      SIN_TABLE[i] = Math.sin(i / SIN_TABLE_SIZE * Math.PI * 2);
    }
    function fastSin(angle) {
      const index = Math.floor(angle / (Math.PI * 2) * SIN_TABLE_SIZE) % SIN_TABLE_SIZE;
      return SIN_TABLE[index >= 0 ? index : index + SIN_TABLE_SIZE];
    }
    const TimingManager = {
      lastTime: 0,
      update() {
        const now = performance.now();
        if (!this.lastTime) this.lastTime = now;
        const delta = (now - this.lastTime) / 1e3;
        this.lastTime = now;
        return Math.min(delta, 0.05);
      }
    };
    const AnimationState = {
      phase: 0,
      update(delta) {
        const speed = getSetting("ChristmasTheme.ChristmasEffects.AnimationSpeed") || 1;
        this.phase += delta * speed;
        return this.phase;
      }
    };
    let retryCount = 0;
    const installChristmasLights = () => {
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
      LGraphCanvas.prototype.renderChristmasLights = function(ctx, items, phase) {
        getSetting("ChristmasTheme.ChristmasEffects.LightSwitch");
        const currentSchemeName = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
        const christmasColors = COLOR_SCHEMES[currentSchemeName] || COLOR_SCHEMES.traditional;
        const bulbShape = getSetting("ChristmasTheme.ChristmasEffects.BulbShape");
        const settings = PerformanceMonitor.getSettings();
        const baseSpacing = settings.lightSpacing;
        const skipCaps = settings.skipCaps;
        const reducedGlow = settings.reducedGlow;
        const glowIntensity = getSetting("ChristmasTheme.ChristmasEffects.GlowIntensity");
        const colorCount = christmasColors.length;
        const linkStyle = getSetting("ChristmasTheme.LinkRenderMode") || "spline";
        const renderer = LinkRenderers[linkStyle] || LinkRenderers.spline;
        const tempPoint = new Float32Array(2);
        const Thickness = getSetting("ChristmasTheme.ChristmasEffects.Thickness") || 3;
        const Direction = -1;
        const effectMode = getSetting("ChristmasTheme.ChristmasEffects.Twinkle");
        const candyCaneMode = effectMode === "candycane";
        const frostMode = effectMode === "frost";
        const auroraMode = effectMode === "aurora";
        if (candyCaneMode || frostMode || auroraMode) {
          for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
            const { start, end, color } = items[itemIdx];
            const totalLength = renderer.getLength(start, end);
            if (candyCaneMode) {
              const stripeWidth = 15;
              const speed = 45;
              ctx.beginPath();
              renderer.tracePath(ctx, start, end);
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = Thickness * 2;
              ctx.lineCap = "round";
              ctx.stroke();
              ctx.beginPath();
              renderer.tracePath(ctx, start, end);
              ctx.strokeStyle = "#ff0000";
              ctx.lineWidth = Thickness * 2;
              ctx.lineCap = "round";
              ctx.setLineDash([stripeWidth, stripeWidth]);
              ctx.lineDashOffset = -phase * speed;
              ctx.globalAlpha = 0.9;
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.globalAlpha = 1;
            } else if (frostMode) {
              const numCrystals = Math.floor(totalLength / baseSpacing);
              const frostColors = ["#e0ffff", "#b0e0e6", "#87ceeb", "#add8e6", "#ffffff"];
              for (let i = 0; i <= numCrystals; i++) {
                const t = i / numCrystals;
                renderer.getPoint(start, end, t, tempPoint);
                const shimmer = 0.6 + fastSin(-phase * 4 + i * 2) * 0.4;
                const crystalColor = frostColors[i % frostColors.length];
                ctx.shadowBlur = 15 * shimmer;
                ctx.shadowColor = "#87ceeb";
                ctx.fillStyle = crystalColor;
                ctx.globalAlpha = shimmer * 0.8;
                const size = Thickness * (1 + shimmer * 0.5);
                ctx.beginPath();
                for (let p = 0; p < 6; p++) {
                  const angle = p / 6 * Math.PI * 2 - Math.PI / 2;
                  const px = tempPoint[0] + Math.cos(angle) * size;
                  const py = tempPoint[1] + Math.sin(angle) * size;
                  if (p === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(tempPoint[0], tempPoint[1], size * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = shimmer;
                ctx.fill();
              }
            } else if (auroraMode) {
              const numPoints = Math.floor(totalLength / 5);
              const auroraColors = ["#00ff88", "#00ffcc", "#00ccff", "#0088ff", "#8800ff", "#ff00ff"];
              for (let i = 0; i <= numPoints; i++) {
                const t = i / numPoints;
                renderer.getPoint(start, end, t, tempPoint);
                const waveOffset = fastSin(t * Math.PI * 3 - phase * 6) * 8;
                const x = tempPoint[0];
                const y = tempPoint[1] + waveOffset;
                const colorT = ((t - phase * 1.5) % 1 + 1) % 1;
                const colorIndex = Math.floor(colorT * auroraColors.length) % auroraColors.length;
                const auroraColor = auroraColors[colorIndex];
                const pulse = 0.5 + fastSin(-phase * 6 + t * Math.PI * 2) * 0.5;
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
          return;
        }
        const drawIcicleBulb = (ctx2, x, y, size) => {
          const bulbWidth = size * 1.2;
          const bulbHeight = size * 3;
          ctx2.beginPath();
          ctx2.moveTo(x, y - size * 0.5);
          ctx2.bezierCurveTo(
            x - bulbWidth,
            y,
            x - bulbWidth * 0.6,
            y + bulbHeight * 0.5,
            x,
            y + bulbHeight
            // Pointed tip at bottom
          );
          ctx2.bezierCurveTo(
            x + bulbWidth * 0.6,
            y + bulbHeight * 0.5,
            x + bulbWidth,
            y,
            x,
            y - size * 0.5
          );
          ctx2.closePath();
        };
        for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
          const { start, end, color } = items[itemIdx];
          if (linkStyle !== "hidden") {
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = 0;
            renderer.draw(ctx, start, end, color || "#888", Thickness);
            ctx.globalAlpha = 1;
          }
          if (linkStyle === "hidden" && !getSetting("ChristmasTheme.ChristmasEffects.LightSwitch")) {
            continue;
          }
          const totalLength = renderer.getLength(start, end);
          const numLights = Math.floor(totalLength / baseSpacing);
          if (numLights < 1) continue;
          const effectiveGlow = reducedGlow ? glowIntensity * 0.5 : glowIntensity;
          for (let i = 0; i <= numLights; i++) {
            const t = i / numLights;
            renderer.getPoint(start, end, t, tempPoint);
            const wobble = fastSin(t * Math.PI * 4) * 5;
            const x = tempPoint[0];
            const y = tempPoint[1] + wobble;
            const colorIndex = ((i - Math.floor(phase * 2 * Direction)) % colorCount + colorCount) % colorCount;
            const lightColor = christmasColors[colorIndex];
            let flicker;
            if (effectMode === "steady") {
              flicker = 1;
            } else if (effectMode === "sparkle") {
              flicker = 0.7 + fastSin(-phase * 8 + i * 5) * 0.3 * Math.random();
            } else {
              flicker = 0.85 + fastSin(-phase * 5 + i * 3) * 0.15;
            }
            ctx.shadowBlur = effectiveGlow * 1.5 * flicker;
            ctx.fillStyle = lightColor;
            ctx.shadowColor = lightColor;
            ctx.globalAlpha = flicker;
            if (bulbShape === "icicle") {
              drawIcicleBulb(ctx, x, y, Thickness);
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(x, y, Thickness * 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
            if (!skipCaps) {
              ctx.beginPath();
              ctx.shadowBlur = 0;
              const capY = bulbShape === "icicle" ? y - Thickness * 0.8 : y - Thickness;
              ctx.arc(x, capY, Thickness * 0.5, 0, Math.PI * 2);
              ctx.fillStyle = "#c0c0c0";
              ctx.globalAlpha = 1;
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        }
      };
      LGraphCanvas.prototype.drawConnections = function(ctx) {
        try {
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
          State.linkDataIndex = 0;
          for (const linkId in this.graph.links) {
            const linkData = this.graph.links[linkId];
            if (!linkData) continue;
            const originNode = this.graph._nodes_by_id[linkData.origin_id];
            const targetNode = this.graph._nodes_by_id[linkData.target_id];
            if (!originNode || !targetNode || originNode.flags.collapsed || targetNode.flags.collapsed) continue;
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
            data.color = linkData.type ? LGraphCanvas.link_type_colors[linkData.type] : this.default_connection_color;
            State.linkDataIndex++;
          }
          if (State.linkDataIndex > 0) {
            const linksToRender = State.linkDataCache.slice(0, State.linkDataIndex);
            this.renderChristmasLights(ctx, linksToRender, phase);
          }
          ctx.restore();
          const frameTime = performance.now() - startTime;
          State.performanceMode = PerformanceMonitor.addFrameTime(frameTime);
        } catch (error) {
          console.error("Error in drawConnections:", error);
          origDrawConnections.call(this, ctx);
        }
      };
      let linkAnimLoopId = null;
      function startLinkLoop() {
        if (linkAnimLoopId) return;
        const loop = () => {
          const lightsOn = getSetting("ChristmasTheme.ChristmasEffects.LightSwitch") !== 0;
          if (isPageVisible && lightsOn && app.canvas) {
            app.canvas.setDirty(true, true);
          }
          linkAnimLoopId = requestAnimationFrame(loop);
        };
        linkAnimLoopId = requestAnimationFrame(loop);
      }
      startLinkLoop();
    };
    api.addEventListener("execution_start", () => {
      if (getSetting("ChristmasTheme.PauseDuringRender")) {
        State.isRendering = true;
      }
    });
    api.addEventListener("execution_end", () => {
      State.isRendering = false;
      if (app.canvas) {
        app.canvas.setDirty(true, true);
      }
    });
    installChristmasLights();
  }
});
//# sourceMappingURL=link_animations.js.map
