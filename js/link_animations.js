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
    const LinkRenderer = {
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
        const animStyle = getSetting("ChristmasTheme.ChristmasEffects.LightSwitch");
        const currentSchemeName = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
        const christmasColors = COLOR_SCHEMES[currentSchemeName] || COLOR_SCHEMES.traditional;
        const bulbShape = getSetting("ChristmasTheme.ChristmasEffects.BulbShape");
        const settings = PerformanceMonitor.getSettings();
        const baseSpacing = settings.lightSpacing;
        const skipCaps = settings.skipCaps;
        const reducedGlow = settings.reducedGlow;
        const glowIntensity = getSetting("ChristmasTheme.ChristmasEffects.GlowIntensity");
        const steadyTwinkle = getSetting("ChristmasTheme.ChristmasEffects.SteadyStrands");
        const sparkleMode = getSetting("ChristmasTheme.ChristmasEffects.SparkleMode");
        const colorCount = christmasColors.length;
        const linkStyle = getSetting("ChristmasTheme.LinkRenderMode") || "spline";
        const renderer = LinkRenderer;
        const tempPoint = new Float32Array(2);
        const Thickness = 2;
        const Direction = -1;
        if (animStyle === 4) {
          for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
            const { start, end, color } = items[itemIdx];
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#aaddff";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
            const length = renderer.getLength(start, end);
            const particleCount = Math.floor(length / 20);
            const time = performance.now() / 1e3;
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#ffffff";
            for (let i = 0; i < particleCount; i++) {
              const speed = 0.5 + i % 3 * 0.2;
              let t = (time * speed + i / particleCount) % 1;
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
        if (animStyle === 2) {
          ctx.lineCap = "round";
          for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
            const { start, end } = items[itemIdx];
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 5;
            ctx.setLineDash([15, 15]);
            ctx.lineDashOffset = -phase * 30;
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          return;
        }
        if (animStyle === 5) {
          ctx.lineCap = "round";
          const auroraColors = ["#00ffaa", "#00aaff", "#aa00ff", "#ff00aa"];
          for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
            const { start, end } = items[itemIdx];
            const length = renderer.getLength(start, end);
            for (let layer = 0; layer < 3; layer++) {
              const grad = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
              for (let c = 0; c < auroraColors.length; c++) {
                const colorPos = (c / (auroraColors.length - 1) + phase * 0.2) % 1;
                grad.addColorStop(colorPos, auroraColors[c]);
              }
              const particles = Math.floor(length / 10);
              for (let p = 0; p < particles; p++) {
                const t2 = (p / particles + phase * 0.1) % 1;
                renderer.getPoint(start, end, t2, tempPoint);
                const x = tempPoint[0];
                const y = tempPoint[1] + Math.sin(t2 * Math.PI * 4 + phase) * 2;
                const colorT = (t2 - phase * 0.5 + 1) % 1;
                const colorIndex = Math.floor(colorT * auroraColors.length);
                const auroraColor = auroraColors[colorIndex];
                const pulse = 0.5 + fastSin(phase * 3 + t2 * Math.PI * 2) * 0.5;
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
            if (steadyTwinkle) {
              flicker = 1;
            } else if (sparkleMode) {
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
