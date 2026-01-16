import { app } from "../../scripts/app.js";
import { getSetting, COLOR_SCHEMES } from "./settings-cache.js";
import { isPageVisible, isExecuting } from "./background-themes.js";
const SNOWFLAKE_CONFIG = {
  MIN_SIZE: 8,
  MAX_SIZE: 18,
  FLAKE_COUNTS: {
    high: 50,
    medium: 35,
    low: 20
  },
  BATCH_SIZE: 5
};
const SNOWFLAKE_TYPES = {
  // Branched - 6 arms with side branches
  branched: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      d += `M ${size / 2} ${size / 2} L ${size / 2 + sin * size * 0.45} ${size / 2 - cos * size * 0.45} `;
      const bx = size / 2 + sin * size * 0.25, by = size / 2 - cos * size * 0.25;
      const bLen = size * 0.15;
      const bAngle = Math.PI / 5;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle - bAngle) * bLen} ${by - Math.cos(angle - bAngle) * bLen} `;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle + bAngle) * bLen} ${by - Math.cos(angle + bAngle) * bLen} `;
    }
    return d;
  },
  minimal: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      d += `M ${size / 2} ${size / 2} L ${size / 2 + sin * size * 0.45} ${size / 2 - cos * size * 0.45} `;
      const bx = size / 2 + sin * size * 0.25, by = size / 2 - cos * size * 0.25;
      const bLen = size * 0.12;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle - Math.PI / 4) * bLen} ${by - Math.cos(angle - Math.PI / 4) * bLen} `;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle + Math.PI / 4) * bLen} ${by - Math.cos(angle + Math.PI / 4) * bLen} `;
    }
    return d;
  },
  stellar: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      d += `M ${size / 2} ${size / 2} L ${size / 2 + sin * size * 0.45} ${size / 2 - cos * size * 0.45} `;
      [0.2, 0.32].forEach((pos) => {
        const bx = size / 2 + sin * size * pos, by = size / 2 - cos * size * pos;
        const bLen = size * (0.18 - pos * 0.3);
        d += `M ${bx} ${by} L ${bx + Math.sin(angle - Math.PI / 4) * bLen} ${by - Math.cos(angle - Math.PI / 4) * bLen} `;
        d += `M ${bx} ${by} L ${bx + Math.sin(angle + Math.PI / 4) * bLen} ${by - Math.cos(angle + Math.PI / 4) * bLen} `;
      });
    }
    return d;
  },
  emoji1: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const tipX = size / 2 + sin * size * 0.45, tipY = size / 2 - cos * size * 0.45;
      d += `M ${size / 2} ${size / 2} L ${tipX} ${tipY} `;
      const tip = size * 0.06;
      d += `M ${tipX - cos * tip} ${tipY - sin * tip} L ${tipX} ${tipY} L ${tipX + cos * tip} ${tipY + sin * tip} `;
      const bx = size / 2 + sin * size * 0.27, by = size / 2 - cos * size * 0.27;
      const bLen = size * 0.13;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle - Math.PI / 4) * bLen} ${by - Math.cos(angle - Math.PI / 4) * bLen} `;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle + Math.PI / 4) * bLen} ${by - Math.cos(angle + Math.PI / 4) * bLen} `;
    }
    return d;
  },
  emoji2: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      d += `M ${size / 2 + sin * size * 0.08} ${size / 2 - cos * size * 0.08} L ${size / 2 + sin * size * 0.45} ${size / 2 - cos * size * 0.45} `;
      const cx = size / 2 + sin * size * 0.3, cy = size / 2 - cos * size * 0.3;
      const cLen = size * 0.05;
      d += `M ${cx - cos * cLen} ${cy - sin * cLen} L ${cx + cos * cLen} ${cy + sin * cLen} `;
    }
    return d;
  },
  emoji3: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      d += `M ${size / 2} ${size / 2} L ${size / 2 + sin * size * 0.45} ${size / 2 - cos * size * 0.45} `;
      const cx = size / 2 + sin * size * 0.22, cy = size / 2 - cos * size * 0.22;
      const cLen = size * 0.12;
      const cAngle = Math.PI / 5;
      d += `M ${cx + Math.sin(angle - cAngle) * cLen} ${cy - Math.cos(angle - cAngle) * cLen * 0.7} L ${cx} ${cy} L ${cx + Math.sin(angle + cAngle) * cLen} ${cy - Math.cos(angle + cAngle) * cLen * 0.7} `;
    }
    return d;
  },
  // Dendrite - fernlike with multiple branch levels
  dendrite: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      d += `M ${size / 2} ${size / 2} L ${size / 2 + sin * size * 0.45} ${size / 2 - cos * size * 0.45} `;
      [0.18, 0.28, 0.38].forEach((pos, idx) => {
        const bx = size / 2 + sin * size * pos, by = size / 2 - cos * size * pos;
        const bLen = size * (0.14 - idx * 0.03);
        const bAngle = Math.PI / 4;
        d += `M ${bx} ${by} L ${bx + Math.sin(angle - bAngle) * bLen} ${by - Math.cos(angle - bAngle) * bLen} `;
        d += `M ${bx} ${by} L ${bx + Math.sin(angle + bAngle) * bLen} ${by - Math.cos(angle + bAngle) * bLen} `;
      });
    }
    return d;
  },
  // Ornate - decorative with diamond tips
  ornate: (size) => {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const tipX = size / 2 + sin * size * 0.42, tipY = size / 2 - cos * size * 0.42;
      d += `M ${size / 2} ${size / 2} L ${tipX} ${tipY} `;
      const dSize = size * 0.05;
      d += `M ${tipX} ${tipY - dSize} L ${tipX + dSize * 0.7} ${tipY} L ${tipX} ${tipY + dSize} L ${tipX - dSize * 0.7} ${tipY} Z `;
      const bx = size / 2 + sin * size * 0.22, by = size / 2 - cos * size * 0.22;
      const bLen = size * 0.14;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle - Math.PI / 3) * bLen} ${by - Math.cos(angle - Math.PI / 3) * bLen} `;
      d += `M ${bx} ${by} L ${bx + Math.sin(angle + Math.PI / 3) * bLen} ${by - Math.cos(angle + Math.PI / 3) * bLen} `;
    }
    return d;
  }
};
const FLAKE_TYPE_NAMES = Object.keys(SNOWFLAKE_TYPES);
let cachedCustomImage = null;
function getPerformanceTier() {
  const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory !== void 0 && navigator.deviceMemory <= 2 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isLowEnd) return "low";
  const isHighEnd = navigator.hardwareConcurrency >= 8 && (navigator.deviceMemory === void 0 || navigator.deviceMemory >= 8);
  return isHighEnd ? "high" : "medium";
}
function createSVGSnowflake(size, color, flakeType) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.style.overflow = "visible";
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", SNOWFLAKE_TYPES[flakeType](size));
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", String(Math.max(1, size * 0.06)));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("fill", "none");
  const dot = document.createElementNS(ns, "circle");
  dot.setAttribute("cx", String(size / 2));
  dot.setAttribute("cy", String(size / 2));
  dot.setAttribute("r", String(size * 0.04));
  dot.setAttribute("fill", color);
  svg.appendChild(path);
  svg.appendChild(dot);
  return svg;
}
app.registerExtension({
  name: "Christmas.Theme.SnowEffect",
  async setup() {
    console.log("✨ Initializing Premium Snow Effect with JS animation...");
    try {
      const perfTier = getPerformanceTier();
      const totalFlakes = SNOWFLAKE_CONFIG.FLAKE_COUNTS[perfTier];
      console.log(`❄️ Performance tier: ${perfTier}, using ${totalFlakes} foreground snowflakes (8 designs)`);
      const container = document.createElement("div");
      container.id = "comfy-aether-snow";
      Object.assign(container.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        overflow: "hidden"
      });
      container.style.pointerEvents = "none";
      container.style.zIndex = "50";
      document.body.appendChild(container);
      const style = document.createElement("style");
      style.id = "snowflake-styles";
      style.textContent = `
                .snowflake {
                    position: absolute;
                    pointer-events: none;
                    user-select: none;
                    will-change: transform, filter;
                }
            `;
      document.head.appendChild(style);
      let flakes = [];
      let animationId = null;
      let lastTime = performance.now();
      let snowAnimTime = 0;
      const getSnowflakeColor = () => {
        const colorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
        const christmasColors = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
        switch (colorScheme) {
          case "blue":
            return ["#d4f1f9", "#c8e8f0", "#b8dce8"][Math.floor(Math.random() * 3)];
          case "rainbow":
            return ["#ffb3ba", "#bae1ff", "#baffc9", "#ffffba", "#ffdfba"][Math.floor(Math.random() * 5)];
          case "match":
            const palette = COLOR_SCHEMES[christmasColors] || COLOR_SCHEMES.traditional;
            return palette[Math.floor(Math.random() * palette.length)];
          case "newyear":
            return COLOR_SCHEMES.newyear[Math.floor(Math.random() * 5)];
          default:
            return ["#ffffff", "#f8f9fa", "#f1f3f5"][Math.floor(Math.random() * 3)];
        }
      };
      const getGlowFilter = (color) => {
        const glowIntensity = getSetting("ChristmasTheme.Snowflake.Glow") || 10;
        const glowAmount = Math.min(glowIntensity * 0.4, 8);
        if (glowAmount < 1) return "none";
        return `drop-shadow(0 0 ${glowAmount}px ${color})`;
      };
      const createFlakeEntity = () => {
        const size = SNOWFLAKE_CONFIG.MIN_SIZE + Math.random() * (SNOWFLAKE_CONFIG.MAX_SIZE - SNOWFLAKE_CONFIG.MIN_SIZE);
        const sizeRatio = size / SNOWFLAKE_CONFIG.MAX_SIZE;
        const color = getSnowflakeColor();
        return {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size,
          opacity: 0.3 + Math.random() * 0.2 + sizeRatio * 0.35,
          // Random base 0.3-0.5 plus size factor
          color,
          speed: 12 + Math.random() * 18,
          // Slightly slower
          drift: (Math.random() - 0.5) * 30,
          driftSpeed: 0.3 + Math.random() * 0.4,
          driftOffset: Math.random() * Math.PI * 2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.5,
          flakeType: (() => {
            const type = getSetting("ChristmasTheme.Snowflake.Type");
            if (type === "custom") return "custom";
            if (type === "mix_custom") return Math.random() > 0.5 ? "custom" : FLAKE_TYPE_NAMES[Math.floor(Math.random() * FLAKE_TYPE_NAMES.length)];
            if (type && type !== "random" && FLAKE_TYPE_NAMES.includes(type)) return type;
            return FLAKE_TYPE_NAMES[Math.floor(Math.random() * FLAKE_TYPE_NAMES.length)];
          })(),
          element: null
        };
      };
      const updateFlakeGlow = (flake) => {
        if (flake.element) {
          flake.element.style.filter = getGlowFilter(flake.color);
        }
      };
      const initFlakes = () => {
        container.innerHTML = "";
        flakes = [];
        const snowType = getSetting("ChristmasTheme.Snowflake.Type");
        const snowSrc = getSetting("ChristmasTheme.Snowflake.CustomImage");
        const needsCustomImage = (snowType === "custom" || snowType === "mix_custom") && snowSrc;
        if (needsCustomImage && (!cachedCustomImage || cachedCustomImage.src !== snowSrc)) {
          cachedCustomImage = new Image();
          cachedCustomImage.src = snowSrc;
          console.log("❄️ Caching custom snowflake image");
        }
        for (let i = 0; i < totalFlakes; i++) {
          const flakeData = createFlakeEntity();
          const flake = document.createElement("div");
          flake.className = "snowflake";
          if (flakeData.flakeType === "custom" && cachedCustomImage) {
            const img = cachedCustomImage.cloneNode();
            img.style.width = String(flakeData.size * 2) + "px";
            img.style.height = String(flakeData.size * 2) + "px";
            img.style.objectFit = "contain";
            img.draggable = false;
            flake.appendChild(img);
          } else if (flakeData.flakeType === "custom") {
            const svg = createSVGSnowflake(flakeData.size, flakeData.color, "minimal");
            flake.appendChild(svg);
          } else {
            const svg = createSVGSnowflake(flakeData.size, flakeData.color, flakeData.flakeType);
            flake.appendChild(svg);
          }
          flake.style.opacity = String(flakeData.opacity);
          if (flakeData.flakeType !== "custom") {
            flake.style.filter = getGlowFilter(flakeData.color);
          }
          container.appendChild(flake);
          flakeData.element = flake;
          flakes.push(flakeData);
        }
      };
      const updateFlakeColor = (flake) => {
        var _a;
        flake.color = getSnowflakeColor();
        const svg = (_a = flake.element) == null ? void 0 : _a.querySelector("svg");
        if (svg) {
          const path = svg.querySelector("path");
          const dot = svg.querySelector("circle");
          if (path) path.setAttribute("stroke", flake.color);
          if (dot) dot.setAttribute("fill", flake.color);
        }
        updateFlakeGlow(flake);
      };
      let windowHeight = window.innerHeight;
      let windowWidth = window.innerWidth;
      const handleResize = () => {
        windowHeight = window.innerHeight;
        windowWidth = window.innerWidth;
      };
      window.addEventListener("resize", handleResize);
      const animate = (currentTime) => {
        if (!isPageVisible) {
          animationId = requestAnimationFrame(animate);
          return;
        }
        if (!isExecuting && currentTime - lastTime > 1e3) {
          lastTime = currentTime;
        }
        const deltaTime = isExecuting ? 0 : (currentTime - lastTime) / 1e3;
        if (!isExecuting) {
          lastTime = currentTime;
          snowAnimTime += deltaTime;
        }
        const height = windowHeight;
        const width = windowWidth;
        for (const flake of flakes) {
          if (!isExecuting) {
            flake.y += flake.speed * deltaTime;
            flake.rotation += flake.rotationSpeed * deltaTime;
            if (flake.y > height + 30) {
              flake.y = -30;
              flake.x = Math.random() * width;
              const type = getSetting("ChristmasTheme.Snowflake.Type");
              if (type === "custom") flake.flakeType = "custom";
              else if (type === "mix_custom") flake.flakeType = Math.random() > 0.5 ? "custom" : FLAKE_TYPE_NAMES[Math.floor(Math.random() * FLAKE_TYPE_NAMES.length)];
              else if (type && type !== "random" && FLAKE_TYPE_NAMES.includes(type)) flake.flakeType = type;
              else flake.flakeType = FLAKE_TYPE_NAMES[Math.floor(Math.random() * FLAKE_TYPE_NAMES.length)];
              if (flake.element) {
                flake.element.innerHTML = "";
                if (flake.flakeType === "custom" && cachedCustomImage) {
                  const img = cachedCustomImage.cloneNode();
                  img.style.width = String(flake.size * 2) + "px";
                  img.style.height = String(flake.size * 2) + "px";
                  img.style.objectFit = "contain";
                  img.draggable = false;
                  flake.element.appendChild(img);
                } else if (flake.flakeType === "custom") {
                  const svg = createSVGSnowflake(flake.size, flake.color, "minimal");
                  flake.element.appendChild(svg);
                } else {
                  const svg = createSVGSnowflake(flake.size, flake.color, flake.flakeType);
                  flake.element.appendChild(svg);
                }
              }
              updateFlakeColor(flake);
            }
          }
          const driftX = Math.sin(snowAnimTime * flake.driftSpeed + flake.driftOffset) * flake.drift;
          if (flake.element) {
            flake.element.style.transform = `translate3d(${flake.x + driftX}px, ${flake.y}px, 0) rotate(${flake.rotation}rad)`;
          }
        }
        animationId = requestAnimationFrame(animate);
      };
      const isEnabled = getSetting("ChristmasTheme.Snowflake.Enabled");
      container.style.display = isEnabled ? "block" : "none";
      if (isEnabled) {
        initFlakes();
        animationId = requestAnimationFrame(animate);
      }
      const handleVisibility = () => {
        if (document.visibilityState !== "hidden") {
          lastTime = performance.now();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      let lastColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
      let lastGlow = getSetting("ChristmasTheme.Snowflake.Glow");
      let lastEnabled = getSetting("ChristmasTheme.Snowflake.Enabled");
      const checkSettings = setInterval(() => {
        const currentEnabled = getSetting("ChristmasTheme.Snowflake.Enabled");
        const currentColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
        const currentGlow = getSetting("ChristmasTheme.Snowflake.Glow");
        if (currentEnabled !== lastEnabled) {
          if (currentEnabled === 1 || currentEnabled === true) {
            container.style.display = "block";
            if (flakes.length === 0) {
              initFlakes();
              if (!animationId) animationId = requestAnimationFrame(animate);
            }
          } else {
            container.style.display = "none";
          }
          lastEnabled = currentEnabled;
        }
        if (currentColorScheme !== lastColorScheme) {
          flakes.forEach(updateFlakeColor);
          lastColorScheme = currentColorScheme;
        }
        if (currentGlow !== lastGlow) {
          flakes.forEach(updateFlakeGlow);
          lastGlow = currentGlow;
        }
        if (!currentEnabled && flakes.length > 0) {
          flakes = [];
          container.innerHTML = "";
        }
      }, 500);
      return () => {
        clearInterval(checkSettings);
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("resize", handleResize);
        if (animationId) cancelAnimationFrame(animationId);
        container.remove();
        style.remove();
      };
    } catch (error) {
      console.error("❌ Failed to initialize Snow Effect:", error);
    }
  }
});
//# sourceMappingURL=aether-snow.js.map
