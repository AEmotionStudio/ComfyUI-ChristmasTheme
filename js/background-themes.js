import { app } from "../../scripts/app.js";
import { initSettingsCache, updateCache, loadSettingFromStorage, getSetting, BACKGROUND_THEMES, COLOR_SCHEMES } from "./settings-cache.js";
let extensionSetupComplete = false;
let isInitialSetup = true;
let isPageVisible = true;
document.addEventListener("visibilitychange", () => {
  isPageVisible = document.visibilityState === "visible";
});
let isExecuting = false;
let executionEndTime = 0;
let originalDrawBackCanvas = null;
let starEntities = [];
let shootingStars = [];
let nebulaEntities = [];
let starInitialized = false;
let bgSnowflakeEntities = [];
let bgSnowflakesInitialized = false;
let lastBgColorScheme = null;
let lastBgSnowflakeColorScheme = null;
let customSnowImage = null;
let customSnowImageSrc = null;
let fireworkRockets = [];
let fireworkParticles = [];
let fireworkSparks = [];
let lastFireworkTime = 0;
let animationLoopId = null;
const FIREWORK_PALETTES = [
  ["#ff6b6b", "#ff8787", "#ffa8a8"],
  // Red gradient
  ["#ffd93d", "#ffe066", "#fff3bf"],
  // Gold gradient
  ["#6bcb77", "#8ce99a", "#b2f2bb"],
  // Green gradient
  ["#4d96ff", "#74c0fc", "#a5d8ff"],
  // Blue gradient
  ["#ff85c1", "#f783ac", "#faa2c1"],
  // Pink gradient
  ["#a855f7", "#c084fc", "#d8b4fe"],
  // Purple gradient
  ["#00d4ff", "#22d3ee", "#67e8f9"],
  // Cyan gradient
  ["#ffffff", "#f8f9fa", "#e9ecef"],
  // White/silver
  ["#ffd700", "#ffec99", "#fff9db"]
  // Bright gold
];
const EXPLOSION_TYPES = ["chrysanthemum", "willow", "palm", "ring", "crackle", "peony"];
function createFireworkRocket(width, height, _isFinale) {
  const palette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
  const explosionType = EXPLOSION_TYPES[Math.floor(Math.random() * EXPLOSION_TYPES.length)];
  return {
    x: Math.random() * width * 0.8 + width * 0.1,
    y: height - 30,
    vx: (Math.random() - 0.5) * 3,
    vy: -12 - Math.random() * 6,
    palette,
    explosionType,
    trail: [],
    trailTimer: 0,
    age: 0,
    exploded: false,
    size: 2 + Math.random()
  };
}
function createExplosionParticles(x, y, palette, explosionType) {
  const particles = [];
  const primaryColor = palette[0];
  const secondaryColor = palette[1];
  const tertiaryColor = palette[2];
  switch (explosionType) {
    case "chrysanthemum": {
      const count = 80 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.2;
        const speed = 3 + Math.random() * 3;
        const colorChoice = Math.random();
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colorChoice < 0.5 ? primaryColor : colorChoice < 0.8 ? secondaryColor : tertiaryColor,
          alpha: 1,
          size: 2 + Math.random() * 1.5,
          decay: 8e-3 + Math.random() * 4e-3,
          trail: [],
          hasTrail: true,
          gravity: 0.03
        });
      }
      break;
    }
    case "willow": {
      const count = 60 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.15;
        const speed = 2 + Math.random() * 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 1,
          size: 1.5 + Math.random(),
          decay: 5e-3 + Math.random() * 3e-3,
          trail: [],
          hasTrail: true,
          gravity: 0.08
          // Heavy gravity for drooping effect
        });
      }
      break;
    }
    case "palm": {
      const count = 50 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count;
        const speed = 4 + Math.random() * 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: primaryColor,
          alpha: 1,
          size: 3 + Math.random() * 2,
          decay: 0.012 + Math.random() * 5e-3,
          trail: [],
          hasTrail: true,
          gravity: 0.04
        });
      }
      break;
    }
    case "ring": {
      const count = 40;
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count;
        const speed = 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: palette[i % palette.length],
          alpha: 1,
          size: 2.5,
          decay: 0.015,
          trail: [],
          hasTrail: false,
          gravity: 0.02
        });
      }
      break;
    }
    case "crackle": {
      const count = 30;
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.3;
        const speed = 2 + Math.random() * 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: primaryColor,
          alpha: 1,
          size: 2 + Math.random(),
          decay: 0.02,
          trail: [],
          hasTrail: true,
          gravity: 0.05,
          crackle: true,
          crackleTime: 0.3 + Math.random() * 0.3
        });
      }
      break;
    }
    case "peony":
    default: {
      const count = 70 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.25;
        const speed = 2.5 + Math.random() * 2.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 1,
          size: 2 + Math.random() * 1.5,
          decay: 0.01 + Math.random() * 5e-3,
          trail: [],
          hasTrail: Math.random() > 0.3,
          gravity: 0.04
        });
      }
    }
  }
  const sparkCount = 20 + Math.floor(Math.random() * 15);
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    fireworkSparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      size: 0.5 + Math.random() * 0.5,
      decay: 0.03 + Math.random() * 0.02,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  return particles;
}
function hexToRgbString(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
function updateFlakeRgba(flake) {
  flake.rgb = hexToRgbString(flake.color);
  flake.rgbaStrings = [
    `rgba(${flake.rgb}, 0.4)`,
    `rgba(${flake.rgb}, 0.15)`,
    `rgba(${flake.rgb}, 0)`
  ];
}
function updateBgSnowflakeColors() {
  for (const flake of bgSnowflakeEntities) {
    flake.color = getBgSnowflakeColor();
    updateFlakeRgba(flake);
  }
}
let countdownElement = null;
let countdownInterval = null;
function createCountdownElement() {
  if (countdownElement) return countdownElement;
  const now = /* @__PURE__ */ new Date();
  let targetYear = now.getFullYear();
  if (now.getMonth() > 0 || now.getMonth() === 0 && now.getDate() > 1) {
    targetYear++;
  }
  const container = document.createElement("div");
  container.id = "christmas-theme-countdown";
  container.innerHTML = `
        <style>
            #christmas-theme-countdown {
                position: fixed;
                bottom: 4px;
                left: 120px;
                background: #121212;
                border: 1px solid #2a2a2a;
                border-radius: 6px;
                padding: 7px 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #e0e0e0;
                z-index: 50;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            #christmas-theme-countdown .countdown-title {
                font-size: 10px;
                color: #b0b0b0;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                width: 100%;
            }
            #christmas-theme-countdown .countdown-title svg {
                width: 12px;
                height: 12px;
                fill: none;
                stroke: #ffd700;
                stroke-width: 2;
                stroke-linecap: round;
                vertical-align: middle;
                flex-shrink: 0;
                position: relative;
                top: -1px;
            }
            #christmas-theme-countdown .countdown-grid {
                display: flex;
                align-items: flex-start;
                gap: 2px;
                margin-left: 5px;
            }
            #christmas-theme-countdown .countdown-segment {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 22px;
            }
            #christmas-theme-countdown .countdown-segment span:first-child {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                font-variant-numeric: tabular-nums;
                line-height: 1.1;
            }
            #christmas-theme-countdown .countdown-segment .label {
                font-size: 8px;
                color: #aaa;
                margin-top: 1px;
            }
            #christmas-theme-countdown .countdown-sep {
                font-size: 14px;
                font-weight: 600;
                color: #666;
                line-height: 1.1;
            }
            #christmas-theme-countdown.celebration {
                animation: celebrate 0.3s ease-in-out infinite;
                border-color: #ffd700;
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
            }
            @keyframes celebrate {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        </style>
        <div class="countdown-title">
            <svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83"/><circle cx="12" cy="12" r="2"/></svg>
            New Year ${targetYear}
            <svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div class="countdown-grid">
            <div class="countdown-segment"><span id="countdown-days">00</span><span class="label">Days</span></div>
            <div class="countdown-sep">:</div>
            <div class="countdown-segment"><span id="countdown-hours">00</span><span class="label">Hrs</span></div>
            <div class="countdown-sep">:</div>
            <div class="countdown-segment"><span id="countdown-mins">00</span><span class="label">Min</span></div>
            <div class="countdown-sep">:</div>
            <div class="countdown-segment"><span id="countdown-secs">00</span><span class="label">Sec</span></div>
        </div>
    `;
  document.body.appendChild(container);
  countdownElement = container;
  return container;
}
let finaleActive = false;
let finaleStartTime = 0;
let finaleGracePeriod = false;
const FINALE_DURATION = 22e3;
let finaleConfetti = [];
let finaleStars = [];
function triggerFinale() {
  if (finaleActive) return;
  finaleActive = true;
  finaleStartTime = performance.now();
  console.log("🎆 FINALE TRIGGERED!");
  createScreenFlash();
  createYearText();
  for (let i = 0; i < 3; i++) {
    setTimeout(() => createGoldenRing(), i * 500);
  }
  createConfettiShower();
  triggerCascadeFireworks();
}
function createScreenFlash() {
  const flash = document.createElement("div");
  flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(ellipse at center, rgba(255,255,255,0.9), rgba(255,215,0,0.6));
        pointer-events: none;
        z-index: 9999;
        animation: finaleFlash 0.8s ease-out forwards;
    `;
  const style = document.createElement("style");
  style.textContent = `
        @keyframes finaleFlash {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
  document.head.appendChild(style);
  document.body.appendChild(flash);
  setTimeout(() => {
    flash.remove();
    style.remove();
  }, 1e3);
}
function createYearText() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear() + (now.getMonth() === 0 && now.getDate() === 1 ? 0 : 1);
  const text = document.createElement("div");
  text.innerHTML = `
        <div style="font-size: 120px; font-weight: 900; text-shadow: 0 0 30px #ffd700, 0 0 60px #ff8c00;">${year}</div>
        <div style="font-size: 36px; font-weight: 600; margin-top: 10px;">Happy New Year!</div>
    `;
  text.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ffd700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        pointer-events: none;
        z-index: 9998;
        animation: yearTextAnim 5s ease-out forwards;
    `;
  const style = document.createElement("style");
  style.textContent = `
        @keyframes yearTextAnim {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            30% { transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
    `;
  document.head.appendChild(style);
  document.body.appendChild(text);
  setTimeout(() => {
    text.remove();
    style.remove();
  }, 5500);
}
function createGoldenRing() {
  const ring = document.createElement("div");
  ring.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        border: 4px solid #ffd700;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9997;
        box-shadow: 0 0 20px #ffd700, 0 0 40px #ff8c00;
        animation: ringExpand 2s ease-out forwards;
    `;
  const style = document.createElement("style");
  style.textContent = `
        @keyframes ringExpand {
            0% { width: 10px; height: 10px; opacity: 1; border-width: 4px; }
            100% { width: 200vmax; height: 200vmax; opacity: 0; border-width: 2px; }
        }
    `;
  document.head.appendChild(style);
  document.body.appendChild(ring);
  setTimeout(() => {
    ring.remove();
    style.remove();
  }, 2500);
}
function createConfettiShower() {
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#9d4edd", "#ff85a1", "#ffd700", "#00ffff"];
  const container = document.createElement("div");
  container.id = "finale-confetti-container";
  container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9996;
        overflow: hidden;
    `;
  document.body.appendChild(container);
  const style = document.createElement("style");
  style.id = "confetti-style";
  style.textContent = `
        @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            85% { opacity: 0.8; }
            100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
        .finale-confetti {
            position: absolute;
            animation: confettiFall linear forwards;
        }
    `;
  document.head.appendChild(style);
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.className = "finale-confetti";
      const size = 8 + Math.random() * 12;
      const x = Math.random() * 100;
      const duration = 3 + Math.random() * 4;
      const delay = Math.random() * 0.5;
      confetti.style.cssText = `
                left: ${x}%;
                top: -20px;
                width: ${size}px;
                height: ${size * 0.4}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
                border-radius: 2px;
            `;
      container.appendChild(confetti);
    }, Math.random() * 2e3);
  }
  setTimeout(() => {
    container.remove();
    style.remove();
  }, 1e4);
}
function triggerCascadeFireworks() {
  const canvas = document.getElementById("christmas-background");
  if (!canvas) return;
  for (let i = 0; i < 25; i++) {
    setTimeout(() => {
      const x = canvas.width * 0.1 + Math.random() * canvas.width * 0.8;
      fireworkRockets.push(createFireworkRocket(x, canvas.height));
    }, i * 160);
  }
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const x = canvas.width * 0.15 + Math.random() * canvas.width * 0.7;
      fireworkRockets.push(createFireworkRocket(x, canvas.height));
    }, 4e3 + i * 400);
  }
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const x = canvas.width * 0.2 + Math.random() * canvas.width * 0.6;
      fireworkRockets.push(createFireworkRocket(x, canvas.height));
    }, 1e4 + i * 800);
  }
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const x = canvas.width * 0.25 + Math.random() * canvas.width * 0.5;
      fireworkRockets.push(createFireworkRocket(x, canvas.height));
    }, 18e3 + i * 1e3);
  }
}
function updateFinaleParticles(ctx, canvas) {
  for (let i = finaleConfetti.length - 1; i >= 0; i--) {
    const c = finaleConfetti[i];
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.05;
    c.vx *= 0.99;
    c.rotation += c.rotationSpeed;
    c.alpha -= c.decay;
    const maxHeight = c.screenHeight || window.innerHeight;
    if (c.alpha <= 0 || c.y > maxHeight + 50) {
      finaleConfetti.splice(i, 1);
    }
  }
  for (let i = finaleStars.length - 1; i >= 0; i--) {
    const s = finaleStars[i];
    s.trail.push({ x: s.x, y: s.y });
    if (s.trail.length > 15) s.trail.shift();
    s.y += s.vy;
    s.alpha -= 0.01;
    const maxHeight = s.screenHeight || window.innerHeight;
    if (s.alpha <= 0 || s.y > maxHeight + 50) {
      finaleStars.splice(i, 1);
    }
  }
}
function drawFinaleParticles(ctx) {
  for (const c of finaleConfetti) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);
    ctx.globalAlpha = c.alpha;
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
    ctx.restore();
  }
  for (const s of finaleStars) {
    for (let t = 0; t < s.trail.length; t++) {
      const tp = s.trail[t];
      ctx.globalAlpha = t / s.trail.length * s.alpha * 0.5;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, s.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = s.alpha;
    ctx.shadowBlur = 15;
    ctx.shadowColor = s.color;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}
function updateCountdown() {
  const daysEl = document.getElementById("countdown-days");
  const hoursEl = document.getElementById("countdown-hours");
  const minsEl = document.getElementById("countdown-mins");
  const secsEl = document.getElementById("countdown-secs");
  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;
  const now = /* @__PURE__ */ new Date();
  let targetYear = now.getFullYear();
  if (now.getMonth() > 0 || now.getMonth() === 0 && now.getDate() > 1) {
    targetYear++;
  }
  const newYear = new Date(targetYear, 0, 1, 0, 0, 0);
  const diff = newYear.getTime() - now.getTime();
  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minsEl.textContent = "00";
    secsEl.textContent = "00";
    if (countdownElement) {
      countdownElement.classList.add("celebration");
    }
    showFinaleButton();
    return;
  }
  const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
  const hours = Math.floor(diff % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60));
  const minutes = Math.floor(diff % (1e3 * 60 * 60) / (1e3 * 60));
  const seconds = Math.floor(diff % (1e3 * 60) / 1e3);
  daysEl.textContent = days.toString().padStart(2, "0");
  hoursEl.textContent = hours.toString().padStart(2, "0");
  minsEl.textContent = minutes.toString().padStart(2, "0");
  secsEl.textContent = seconds.toString().padStart(2, "0");
  if (!getSetting("ChristmasTheme.Background.ShowFinaleButton")) {
    hideFinaleButton();
  }
}
function toggleCountdownDisplay(enabled) {
  if (enabled) {
    createCountdownElement();
    countdownElement.style.display = "block";
    updateCountdown();
    if (!countdownInterval) {
      countdownInterval = setInterval(updateCountdown, 1e3);
    }
    if (getSetting("ChristmasTheme.Background.ShowFinaleButton")) {
      showFinaleButton();
    }
  } else {
    if (countdownElement) {
      countdownElement.style.display = "none";
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    hideFinaleButton();
  }
}
let finaleButtonElement = null;
let finaleButtonShown = false;
function showFinaleButton() {
  if (finaleButtonShown || finaleActive) return;
  finaleButtonShown = true;
  if (finaleButtonElement) {
    finaleButtonElement.style.display = "block";
    return;
  }
  const btn = document.createElement("button");
  btn.id = "finale-trigger-btn";
  btn.innerHTML = `Happy New Year!`;
  btn.style.cssText = `
        position: fixed;
        bottom: 61px;
        right: 277px;
        padding: 6px 12px;
        background: rgba(35, 35, 35, 0.95);
        border: 1px solid #ffd700;
        border-radius: 6px;
        color: #ffd700;
        font-weight: 600;
        cursor: pointer;
        z-index: 10000;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
    `;
  btn.onmouseenter = () => {
    btn.style.background = "rgba(50, 50, 50, 0.95)";
    btn.style.boxShadow = "0 0 15px rgba(255, 215, 0, 0.4)";
  };
  btn.onmouseleave = () => {
    btn.style.background = "rgba(35, 35, 35, 0.95)";
    btn.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
  };
  btn.onclick = () => {
    finaleActive = false;
    triggerFinale();
  };
  document.body.appendChild(btn);
  finaleButtonElement = btn;
}
function hideFinaleButton() {
  finaleButtonShown = false;
  if (finaleButtonElement) {
    finaleButtonElement.style.display = "none";
  }
}
let mouseParticles = [];
let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseEffectInitialized = false;
const MOUSE_EFFECTS = {
  none: null,
  sparkler: {
    colors: ["#ffd700", "#ffec99", "#fff9db", "#ffffff"],
    gravity: 0.08,
    decay: 0.015,
    size: [1, 3],
    spread: 4,
    friction: 0.98,
    shape: "circle",
    glow: 10,
    hasTrail: true,
    twinkle: true,
    spawnMode: "burst"
    // explodes outward from cursor
  },
  snowflake: {
    colors: ["#ffffff", "#e0f7ff", "#b8e6ff", "#d4f1f9"],
    gravity: 0.015,
    decay: 6e-3,
    size: [3, 6],
    spread: 0.5,
    friction: 0.99,
    shape: "snowflake",
    glow: 8,
    hasTrail: false,
    drift: true,
    rotation: true,
    spawnMode: "drop"
    // drops gently from cursor position
  },
  confetti: {
    colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#9d4edd", "#ff85a1"],
    gravity: 0.05,
    decay: 8e-3,
    size: [3, 5],
    spread: 6,
    friction: 0.97,
    shape: "rectangle",
    glow: 0,
    spin: true,
    spawnMode: "pop"
    // pops upward then falls
  },
  stardust: {
    colors: ["#fffacd", "#fff8dc", "#fffaf0", "#ffffff"],
    gravity: 5e-3,
    decay: 0.01,
    size: [1, 2],
    spread: 2,
    friction: 0.995,
    shape: "star",
    glow: 12,
    twinkle: true,
    spawnMode: "float"
    // floats gently in place
  },
  comet: {
    colors: ["#87ceeb", "#add8e6", "#ffffff"],
    gravity: 0,
    decay: 0.025,
    size: [2, 4],
    spread: 0.2,
    friction: 0.92,
    shape: "circle",
    glow: 15,
    hasTrail: true,
    trailLength: 15,
    spawnMode: "follow"
    // tight follow, long trail
  },
  aurora: {
    colors: ["#00ff88", "#00ffcc", "#00ccff", "#8844ff"],
    gravity: -0.02,
    decay: 6e-3,
    size: [2, 4],
    spread: 1,
    friction: 0.99,
    shape: "circle",
    glow: 20,
    wave: true,
    spawnMode: "rise"
    // floats upward with wave
  },
  ribbon: {
    colors: ["#ff69b4", "#ff1493", "#db7093", "#ffb6c1"],
    gravity: 0,
    decay: 0.02,
    size: [2, 3],
    spread: 0.1,
    friction: 0.85,
    shape: "circle",
    glow: 5,
    hasTrail: true,
    trailLength: 10,
    spawnMode: "follow"
    // smooth following ribbon
  },
  crystal: {
    colors: ["#e0ffff", "#afeeee", "#b0e0e6", "#ffffff"],
    gravity: 0.03,
    decay: 0.01,
    size: [3, 5],
    spread: 2,
    friction: 0.96,
    shape: "diamond",
    glow: 15,
    shimmer: true,
    spawnMode: "scatter"
    // scatters in random directions
  },
  petals: {
    colors: ["#ffb7c5", "#ffc0cb", "#ff69b4", "#fff0f5"],
    gravity: 0.02,
    decay: 8e-3,
    size: [4, 6],
    spread: 3,
    friction: 0.98,
    shape: "petal",
    glow: 5,
    flutter: true,
    rotation: true,
    spawnMode: "flutter"
    // drifts with flutter motion
  },
  gifts: {
    colors: ["#ff6b6b", "#4ade80", "#ffd700", "#60a5fa"],
    gravity: 0.06,
    decay: 8e-3,
    size: [5, 8],
    spread: 3,
    friction: 0.96,
    shape: "box",
    glow: 0,
    rotation: true,
    spawnMode: "toss"
    // tossed upward then tumbles
  },
  candy: {
    colors: ["#ff0000", "#ffffff"],
    gravity: 0.035,
    decay: 0.01,
    size: [3, 5],
    spread: 4,
    friction: 0.97,
    shape: "candy",
    glow: 5,
    spin: true,
    spawnMode: "bounce"
    // bouncy scatter
  },
  orb: {
    colors: ["#9d4edd", "#7b2cbf", "#c77dff", "#e0aaff"],
    gravity: 0,
    decay: 0.015,
    size: [3, 5],
    spread: 0.5,
    friction: 0.95,
    shape: "circle",
    glow: 25,
    orbit: true,
    pulseGlow: true,
    spawnMode: "orbit"
    // orbits around spawn point
  },
  magic: {
    colors: ["#ffd700", "#ff69b4", "#00ffff", "#ff6b6b", "#9d4edd"],
    gravity: 0,
    decay: 0.015,
    size: [1, 2],
    spread: 0.5,
    friction: 0.98,
    shape: "star",
    glow: 15,
    spiral: true,
    twinkle: true,
    spawnMode: "spiral"
    // spirals outward from cursor
  },
  nova: {
    colors: ["#ffffff", "#fffacd", "#ffd700", "#ff8c00"],
    gravity: 0,
    decay: 0.02,
    size: [2, 4],
    spread: 0,
    friction: 0.96,
    shape: "star",
    glow: 20,
    twinkle: true,
    spawnMode: "burst"
    // expanding starburst
  },
  bubbles: {
    colors: ["#87ceeb", "#b0e0e6", "#e0ffff", "#ffffff"],
    gravity: -0.03,
    decay: 8e-3,
    size: [4, 8],
    spread: 2,
    friction: 0.99,
    shape: "bubble",
    glow: 8,
    shimmer: true,
    spawnMode: "rise"
    // floating upward
  },
  embers: {
    colors: ["#ff4500", "#ff6347", "#ffa500", "#ffd700", "#ffec99"],
    gravity: -0.02,
    decay: 0.012,
    size: [1, 3],
    spread: 2,
    friction: 0.98,
    shape: "circle",
    glow: 12,
    twinkle: true,
    spawnMode: "rise"
    // drifting upward like fire
  },
  lightning: {
    colors: ["#00ffff", "#87ceeb", "#ffffff", "#e0ffff"],
    gravity: 0,
    decay: 0.04,
    size: [1, 2],
    spread: 3,
    friction: 0.9,
    shape: "circle",
    glow: 20,
    hasTrail: true,
    trailLength: 6,
    spawnMode: "scatter"
    // quick electric sparks
  },
  leaves: {
    colors: ["#8b4513", "#d2691e", "#cd853f", "#f4a460", "#daa520"],
    gravity: 0.025,
    decay: 8e-3,
    size: [4, 7],
    spread: 3,
    friction: 0.98,
    shape: "leaf",
    glow: 0,
    flutter: true,
    rotation: true,
    spawnMode: "flutter"
    // drifting down with spin
  },
  wishes: {
    colors: ["#ffffff", "#fffacd", "#ffd700"],
    gravity: 0,
    decay: 0.03,
    size: [1, 2],
    spread: 0.5,
    friction: 0.85,
    shape: "circle",
    glow: 15,
    hasTrail: true,
    trailLength: 20,
    spawnMode: "follow"
    // shooting star streaks
  },
  notes: {
    colors: ["#ff69b4", "#9d4edd", "#4d96ff", "#ffd700"],
    gravity: -0.015,
    decay: 0.01,
    size: [6, 10],
    spread: 3,
    friction: 0.98,
    shape: "note",
    glow: 5,
    sway: true,
    spawnMode: "rise"
    // floating musical notes
  },
  hearts: {
    colors: ["#ff69b4", "#ff1493", "#ff6b6b", "#ff85a1"],
    gravity: -0.01,
    decay: 0.01,
    size: [4, 7],
    spread: 2,
    friction: 0.98,
    shape: "heart",
    glow: 8,
    sway: true,
    spawnMode: "rise"
    // floating hearts
  }
};
const PARTICLE_SHAPES = {
  circle: (ctx, p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  },
  star: (ctx, p) => {
    const spikes = 5, outerR = p.size, innerR = p.size * 0.5;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * Math.PI / spikes - Math.PI / 2 + (p.rotation || 0);
      const x = p.x + Math.cos(angle) * r;
      const y = p.y + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  },
  diamond: (ctx, p) => {
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x + s * 0.6, p.y);
    ctx.lineTo(p.x, p.y + s);
    ctx.lineTo(p.x - s * 0.6, p.y);
    ctx.closePath();
    ctx.fill();
  },
  snowflake: (ctx, p) => {
    const s = p.size, arms = 6;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = ctx.fillStyle;
    for (let i = 0; i < arms; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -s);
      ctx.moveTo(0, -s * 0.5);
      ctx.lineTo(-s * 0.3, -s * 0.7);
      ctx.moveTo(0, -s * 0.5);
      ctx.lineTo(s * 0.3, -s * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  },
  rectangle: (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  },
  petal: (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 0.4, p.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
  bell: (ctx, p) => {
    const s = p.size;
    ctx.beginPath();
    ctx.arc(p.x, p.y - s * 0.3, s * 0.7, Math.PI, 0);
    ctx.quadraticCurveTo(p.x + s * 0.8, p.y + s * 0.5, p.x, p.y + s * 0.6);
    ctx.quadraticCurveTo(p.x - s * 0.8, p.y + s * 0.5, p.x - s * 0.7, p.y - s * 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y + s * 0.7, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
  },
  box: (ctx, p) => {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha *= 0.8;
    ctx.fillRect(-s / 2, -s * 0.1, s, s * 0.2);
    ctx.fillRect(-s * 0.1, -s / 2, s * 0.2, s);
    ctx.restore();
  },
  candy: (ctx, p) => {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-s, -s + i * s * 0.7, s * 2, s * 0.3);
    }
    ctx.restore();
  },
  bubble: (ctx, p) => {
    const s = p.size;
    ctx.beginPath();
    ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
    ctx.globalAlpha *= 0.4;
    ctx.fill();
    ctx.globalAlpha *= 2;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x - s * 0.3, p.y - s * 0.3, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  },
  leaf: (ctx, p) => {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.8, -s * 0.3, 0, s);
    ctx.quadraticCurveTo(-s * 0.8, -s * 0.3, 0, -s);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(0, s * 0.8);
    ctx.stroke();
    ctx.restore();
  },
  note: (ctx, p) => {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(s * 0.4, -s * 1.2, s * 0.12, s * 1.2);
    ctx.beginPath();
    ctx.moveTo(s * 0.52, -s * 1.2);
    ctx.quadraticCurveTo(s * 1.2, -s * 0.8, s * 0.52, -s * 0.4);
    ctx.fill();
    ctx.restore();
  },
  heart: (ctx, p) => {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s);
    ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3);
    ctx.fill();
    ctx.restore();
  }
};
function initMouseEffect() {
  if (mouseEffectInitialized) return;
  mouseEffectInitialized = true;
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  console.log("✨ Mouse effects system initialized");
}
function createMouseParticle(x, y, vx, vy, effect) {
  const config = MOUSE_EFFECTS[effect];
  if (!config) return null;
  const sizeRange = config.size;
  const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
  let pVx, pVy;
  const spread = config.spread;
  const angle = Math.random() * Math.PI * 2;
  switch (config.spawnMode) {
    case "burst":
      pVx = Math.cos(angle) * (2 + Math.random() * 3);
      pVy = Math.sin(angle) * (2 + Math.random() * 3);
      break;
    case "drop":
      pVx = (Math.random() - 0.5) * spread;
      pVy = Math.random() * 0.5;
      break;
    case "pop":
      pVx = (Math.random() - 0.5) * spread;
      pVy = -2 - Math.random() * 3;
      break;
    case "float":
      pVx = (Math.random() - 0.5) * 0.5;
      pVy = (Math.random() - 0.5) * 0.5;
      break;
    case "follow":
      pVx = vx * 0.3 + (Math.random() - 0.5) * spread;
      pVy = vy * 0.3 + (Math.random() - 0.5) * spread;
      break;
    case "rise":
      pVx = (Math.random() - 0.5) * spread;
      pVy = -0.5 - Math.random();
      break;
    case "scatter":
      pVx = (Math.random() - 0.5) * 4;
      pVy = (Math.random() - 0.5) * 4;
      break;
    case "flutter":
      pVx = (Math.random() - 0.5) * 2;
      pVy = Math.random() * 0.5;
      break;
    case "toss":
      pVx = (Math.random() - 0.5) * spread + vx * 0.2;
      pVy = -1.5 - Math.random() * 2;
      break;
    case "bounce":
      pVx = (Math.random() - 0.5) * spread;
      pVy = -1 - Math.random();
      break;
    case "orbit":
      pVx = Math.cos(angle) * 2;
      pVy = Math.sin(angle) * 2;
      break;
    case "spiral":
      pVx = Math.cos(angle) * 1.5;
      pVy = Math.sin(angle) * 1.5;
      break;
    default:
      pVx = vx + (Math.random() - 0.5) * spread;
      pVy = vy + (Math.random() - 0.5) * spread;
  }
  return {
    x,
    y,
    vx: pVx,
    vy: pVy,
    alpha: 1,
    size,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    gravity: config.gravity + (Math.random() - 0.5) * 0.01,
    decay: config.decay + Math.random() * 3e-3,
    friction: config.friction || 0.98,
    shape: config.shape,
    glow: config.glow,
    twinkle: config.twinkle ? Math.random() * Math.PI * 2 : 0,
    rotation: config.rotation ? Math.random() * Math.PI * 2 : 0,
    rotationSpeed: config.spin ? (Math.random() - 0.5) * 0.3 : config.rotation ? 0.02 : 0,
    trail: config.hasTrail ? [] : null,
    trailLength: config.trailLength || 5,
    wave: config.wave ? Math.random() * Math.PI * 2 : 0,
    orbitAngle: config.orbit ? angle : null,
    orbitRadius: config.orbit ? 20 + Math.random() * 30 : 0,
    originX: x,
    originY: y,
    spiralAngle: config.spiral ? angle : null,
    spiralRadius: config.spiral ? 5 : 0,
    drift: config.drift ? (Math.random() - 0.5) * 1.5 : 0,
    flutter: config.flutter ? Math.random() * Math.PI * 2 : 0,
    sway: config.sway ? Math.random() * Math.PI * 2 : 0,
    shimmer: config.shimmer ? Math.random() * Math.PI * 2 : 0,
    pulseGlow: config.pulseGlow || false,
    age: 0,
    effect
  };
}
function updateMouseParticles(deltaTime) {
  const effectType = getSetting("ChristmasTheme.Background.MouseEffect");
  if (!effectType || effectType === "none") {
    mouseParticles = [];
    return;
  }
  if (!mouseEffectInitialized) {
    initMouseEffect();
  }
  const config = MOUSE_EFFECTS[effectType];
  if (!config) return;
  const dx = mouseX - lastMouseX;
  const dy = mouseY - lastMouseY;
  const speed = Math.sqrt(dx * dx + dy * dy);
  if (speed > 2) {
    const particleCount = Math.min(Math.floor(speed / 3), 5);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const px = lastMouseX + dx * t;
      const py = lastMouseY + dy * t;
      const particle = createMouseParticle(px, py, dx * 0.1, dy * 0.1, effectType);
      if (particle) mouseParticles.push(particle);
    }
  }
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  for (let i = mouseParticles.length - 1; i >= 0; i--) {
    const p = mouseParticles[i];
    if (p.trail && p.trail.length < p.trailLength) {
      p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
    }
    p.vy += p.gravity;
    p.x += p.vx + (p.drift || 0) * Math.sin(p.flutter || 0);
    p.y += p.vy;
    p.vx *= p.friction;
    p.vy *= p.friction;
    p.alpha -= p.decay;
    if (p.twinkle) p.twinkle += 0.2;
    if (p.rotationSpeed) p.rotation += p.rotationSpeed;
    if (p.wave) {
      p.wave += 0.1;
      p.x += Math.sin(p.wave) * 2;
    }
    if (p.flutter) p.flutter += 0.15;
    if (p.sway) {
      p.sway += 0.1;
      p.x += Math.sin(p.sway) * 1.5;
    }
    if (p.shimmer) p.shimmer += 0.3;
    if (p.spiralAngle !== null) {
      p.spiralAngle += 0.15;
      p.spiralRadius += 0.5;
      p.x = p.originX + Math.cos(p.spiralAngle) * p.spiralRadius;
      p.y = p.originY + Math.sin(p.spiralAngle) * p.spiralRadius;
    }
    if (p.orbitAngle !== null) {
      p.orbitAngle += 0.08;
      p.x = p.originX + Math.cos(p.orbitAngle) * p.orbitRadius;
      p.y = p.originY + Math.sin(p.orbitAngle) * p.orbitRadius;
    }
    if (p.alpha <= 0) {
      mouseParticles.splice(i, 1);
    }
  }
  if (mouseParticles.length > 200) {
    mouseParticles.splice(0, mouseParticles.length - 200);
  }
}
function drawMouseParticles(ctx) {
  const effectType = getSetting("ChristmasTheme.Background.MouseEffect");
  if (!effectType || effectType === "none" || mouseParticles.length === 0) return;
  ctx.save();
  for (const p of mouseParticles) {
    if (p.trail && p.trail.length > 0) {
      for (let t = 0; t < p.trail.length; t++) {
        const tp = p.trail[t];
        ctx.globalAlpha = t / p.trail.length * p.alpha * 0.4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    let finalAlpha = p.alpha;
    if (p.twinkle) finalAlpha *= 0.7 + Math.sin(p.twinkle) * 0.3;
    if (p.shimmer) finalAlpha *= 0.8 + Math.sin(p.shimmer) * 0.2;
    ctx.shadowBlur = p.pulseGlow ? p.glow * (0.7 + Math.sin(p.twinkle || 0) * 0.3) : p.glow;
    ctx.shadowColor = p.color;
    ctx.globalAlpha = finalAlpha;
    ctx.fillStyle = p.color;
    const shapeRenderer = PARTICLE_SHAPES[p.shape] || PARTICLE_SHAPES.circle;
    shapeRenderer(ctx, p);
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}
let cachedGradient = null;
let cachedTheme = null;
let cachedHeight = 0;
let frameCount = 0;
let lastFpsCheck = performance.now();
let currentFps = 60;
let lowPerfMode = false;
let lastAnimationTime = 0;
let animationTime = 0;
let lastShootingStarTime = 0;
function getStarColor() {
  const roll = Math.random();
  if (roll < 0.15) return "#aaccff";
  if (roll < 0.5) return "#ffffff";
  if (roll < 0.75) return "#fffef0";
  if (roll < 0.9) return "#fff4e0";
  return "#ffe4c0";
}
function initStars(width, height) {
  const area = width * height;
  const density = 3e-4;
  const count = Math.min(Math.floor(area * density), 800);
  starEntities = [];
  for (let i = 0; i < count; i++) {
    const layerRoll = Math.random();
    let layer, size, baseOpacity, twinkleSpeed, hasGlow, hasSpikes;
    if (layerRoll < 0.6) {
      layer = "distant";
      size = 0.3 + Math.random() * 0.5;
      baseOpacity = 0.2 + Math.random() * 0.3;
      twinkleSpeed = 0.08 + Math.random() * 0.15;
      hasGlow = false;
      hasSpikes = false;
    } else if (layerRoll < 0.92) {
      layer = "normal";
      size = 0.5 + Math.random() * 0.8;
      baseOpacity = 0.4 + Math.random() * 0.4;
      twinkleSpeed = 0.15 + Math.random() * 0.3;
      hasGlow = false;
      hasSpikes = false;
    } else {
      layer = "bright";
      size = 0.8 + Math.random() * 0.7;
      baseOpacity = 0.7 + Math.random() * 0.3;
      twinkleSpeed = 0.2 + Math.random() * 0.4;
      hasGlow = true;
      hasSpikes = Math.random() < 0.4;
    }
    starEntities.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      // Use much larger offset range + secondary offset to prevent sync
      twinkleOffset: Math.random() * Math.PI * 20,
      // Larger range  
      twinkleOffset2: Math.random() * Math.PI * 15,
      // Secondary offset
      twinkleSpeed,
      // Add slight speed variation per star
      twinkleSpeedMod: 0.85 + Math.random() * 0.3,
      baseOpacity,
      layer,
      hasGlow,
      hasSpikes,
      color: getStarColor()
    });
  }
  nebulaEntities = [];
  const nebulaCount = Math.min(Math.floor(count * 0.01), 5);
  for (let i = 0; i < nebulaCount; i++) {
    nebulaEntities.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      // More in upper area
      radius: 100 + Math.random() * 150,
      // Larger but more diffuse
      hue: Math.random() * 60 - 30,
      opacity: 0.015 + Math.random() * 0.015,
      // Much more subtle
      pulseSpeed: 5e-3 + Math.random() * 0.01,
      // Very slow
      pulseOffset: Math.random() * Math.PI * 10
      // Large offset to prevent sync
    });
  }
  starInitialized = true;
  console.log(`⭐ Created ${starEntities.length} stars, ${nebulaEntities.length} nebulae`);
}
function createShootingStar(width, height) {
  const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.3;
  const speed = 400 + Math.random() * 500;
  const isLong = Math.random() < 0.3;
  return {
    x: Math.random() * width * 0.8,
    // Start more to the left
    y: Math.random() * height * 0.3,
    // Start in upper portion
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    length: isLong ? 60 + Math.random() * 80 : 25 + Math.random() * 40,
    life: 1,
    decay: isLong ? 0.4 + Math.random() * 0.3 : 0.7 + Math.random() * 0.6,
    brightness: 0.8 + Math.random() * 0.2,
    // Trail fragments for realism
    fragments: [],
    lastFragmentTime: 0,
    fragmentInterval: 30 + Math.random() * 20,
    // Terminal flare (brightens before dying)
    willFlare: Math.random() < 0.4,
    flareIntensity: 1.5 + Math.random() * 1
  };
}
function getGradient(ctx, height) {
  const colorTheme = getSetting("ChristmasTheme.Background.ColorTheme") || "classic";
  if (cachedGradient && cachedTheme === colorTheme && cachedHeight === height) {
    return cachedGradient;
  }
  const theme = BACKGROUND_THEMES[colorTheme] || BACKGROUND_THEMES.classic;
  if (!theme) {
    console.warn("No theme found for", colorTheme);
    return null;
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, theme.top || "#05004c");
  gradient.addColorStop(0.5, theme.bottom || "#110E19");
  gradient.addColorStop(1, theme.bottom || "#110E19");
  cachedGradient = gradient;
  cachedTheme = colorTheme;
  cachedHeight = height;
  return gradient;
}
function getBgSnowflakeColor() {
  const colorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
  const christmasColors = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
  switch (colorScheme) {
    case "blue":
      const blueVariants = ["#d4f1f9", "#c8e8f0", "#b8dce8"];
      return blueVariants[Math.floor(Math.random() * blueVariants.length)];
    case "rainbow":
      const rainbowPalette = ["#ffb3ba", "#bae1ff", "#baffc9", "#ffffba", "#ffdfba"];
      return rainbowPalette[Math.floor(Math.random() * rainbowPalette.length)];
    case "match":
      const selectedPalette = COLOR_SCHEMES[christmasColors] || COLOR_SCHEMES.traditional;
      return selectedPalette[Math.floor(Math.random() * selectedPalette.length)];
    case "newyear":
      return COLOR_SCHEMES.newyear[Math.floor(Math.random() * 5)];
    default:
      const whiteVariants = ["#ffffff", "#f8f9fa", "#f1f3f5"];
      return whiteVariants[Math.floor(Math.random() * whiteVariants.length)];
  }
}
function initBgSnowflakes(width, height) {
  bgSnowflakeEntities = [];
  const count = 45;
  for (let i = 0; i < count; i++) {
    const sizeRoll = Math.random();
    let size, opacity;
    if (sizeRoll < 0.5) {
      size = 2 + Math.random() * 3;
      opacity = 0.25 + Math.random() * 0.2;
    } else if (sizeRoll < 0.85) {
      size = 4 + Math.random() * 3;
      opacity = 0.35 + Math.random() * 0.25;
    } else {
      size = 6 + Math.random() * 3;
      opacity = 0.4 + Math.random() * 0.2;
    }
    const color = getBgSnowflakeColor();
    const flake = {
      x: Math.random() * width,
      y: Math.random() * height,
      // Distribute across full height initially
      size,
      opacity,
      color,
      // Match color scheme
      speed: 8 + Math.random() * 10,
      // Pixels per second (slower)
      drift: (Math.random() - 0.5) * 25,
      // Horizontal drift amplitude
      driftSpeed: 0.1 + Math.random() * 0.15,
      // Drift oscillation speed
      driftOffset: Math.random() * Math.PI * 2,
      // Phase offset
      rotation: Math.random() * Math.PI * 2,
      // Initial rotation
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      // Slow rotation
      flakeType: ["branched", "minimal", "stellar", "emoji1", "emoji2", "emoji3", "dendrite", "ornate"][Math.floor(Math.random() * 8)]
      // Random type
    };
    updateFlakeRgba(flake);
    bgSnowflakeEntities.push(flake);
  }
  bgSnowflakesInitialized = true;
  console.log(`❄️ Created ${count} background canvas snowflakes`);
}
function drawSnowflake(ctx, x, y, size, rotation, glowAmount = 0, color = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (glowAmount > 0 && color) {
    ctx.shadowBlur = glowAmount;
    ctx.shadowColor = color;
  }
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size);
    ctx.stroke();
    if (size > 4) {
      const branchLen = size * 0.35;
      const branchPos = size * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, -branchPos);
      ctx.lineTo(-branchLen * 0.5, -branchPos - branchLen * 0.5);
      ctx.moveTo(0, -branchPos);
      ctx.lineTo(branchLen * 0.5, -branchPos - branchLen * 0.5);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawCrystalSnowflake(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(Math.PI / 3 * i);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size);
    ctx.stroke();
    if (size > 3) {
      const branchY = -size * 0.55;
      const branchLen = size * 0.35;
      const branchAngle = Math.PI / 5;
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawStellarSnowflake(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(Math.PI / 3 * i);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size);
    ctx.stroke();
    const positions = [0.4, 0.7];
    for (const pos of positions) {
      const branchY = -size * pos;
      const branchLen = size * (0.45 - pos * 0.3);
      const branchAngle = Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
      ctx.stroke();
    }
    if (size > 4) {
      ctx.beginPath();
      ctx.arc(0, -size, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawEmoji2744(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(Math.PI / 3 * i);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.1);
    ctx.lineTo(0, -size);
    ctx.stroke();
    const tipSize = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(-tipSize, -size + tipSize * 0.7);
    ctx.lineTo(0, -size);
    ctx.lineTo(tipSize, -size + tipSize * 0.7);
    ctx.stroke();
    const branchY = -size * 0.6;
    const branchLen = size * 0.3;
    const angle = Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(0, branchY);
    ctx.lineTo(-Math.sin(angle) * branchLen, branchY - Math.cos(angle) * branchLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, branchY);
    ctx.lineTo(Math.sin(angle) * branchLen, branchY - Math.cos(angle) * branchLen);
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawEmoji2745(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 2;
    const startR = size * 0.18;
    const endR = size;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
    ctx.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR);
    ctx.stroke();
    const crossPos = size * 0.65;
    const crossLen = size * 0.12;
    const px = Math.cos(angle) * crossPos;
    const py = Math.sin(angle) * crossPos;
    const perpAngle = angle + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(px - Math.cos(perpAngle) * crossLen, py - Math.sin(perpAngle) * crossLen);
    ctx.lineTo(px + Math.cos(perpAngle) * crossLen, py + Math.sin(perpAngle) * crossLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * endR, Math.sin(angle) * endR, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawEmoji2746(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const origWidth = ctx.lineWidth;
  ctx.lineWidth = origWidth * 1.3;
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(Math.PI / 3 * i);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.12);
    ctx.lineTo(0, -size);
    ctx.stroke();
    const chevY = -size * 0.5;
    const chevLen = size * 0.28;
    const chevAngle = Math.PI / 5;
    ctx.beginPath();
    ctx.moveTo(-Math.sin(chevAngle) * chevLen, chevY + Math.cos(chevAngle) * chevLen * 0.5);
    ctx.lineTo(0, chevY);
    ctx.lineTo(Math.sin(chevAngle) * chevLen, chevY + Math.cos(chevAngle) * chevLen * 0.5);
    ctx.stroke();
    const tipY = -size;
    const tipLen = size * 0.12;
    ctx.beginPath();
    ctx.moveTo(-tipLen * 0.6, tipY + tipLen);
    ctx.lineTo(0, tipY);
    ctx.lineTo(tipLen * 0.6, tipY + tipLen);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = origWidth;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawDendriteSnowflake(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(Math.PI / 3 * i);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size);
    ctx.stroke();
    const positions = [0.4, 0.6, 0.8];
    positions.forEach((pos, idx) => {
      const branchY = -size * pos;
      const branchLen = size * (0.3 - idx * 0.06);
      const branchAngle = Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, branchY);
      ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
      ctx.stroke();
    });
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawOrnateSnowflake(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(Math.PI / 3 * i);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size * 0.9);
    ctx.stroke();
    const tipY = -size * 0.9;
    const dSize = size * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, tipY - dSize);
    ctx.lineTo(dSize * 0.6, tipY);
    ctx.lineTo(0, tipY + dSize);
    ctx.lineTo(-dSize * 0.6, tipY);
    ctx.closePath();
    ctx.fill();
    const branchY = -size * 0.5;
    const branchLen = size * 0.3;
    const branchAngle = Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(0, branchY);
    ctx.lineTo(-Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, branchY);
    ctx.lineTo(Math.sin(branchAngle) * branchLen, branchY - Math.cos(branchAngle) * branchLen);
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawEnhancedBackground(ctx, width, height) {
  if (!isPageVisible) return;
  if (!getSetting("ChristmasTheme.Background.Enabled")) return;
  const now = performance.now();
  if (!isExecuting && now - lastAnimationTime > 1e3) {
    lastAnimationTime = now;
  }
  const deltaTime = isExecuting ? 0 : (now - lastAnimationTime) / 1e3;
  if (!isExecuting) {
    lastAnimationTime = now;
    animationTime += deltaTime;
  }
  if (!isExecuting) {
    frameCount++;
    if (now - lastFpsCheck >= 1e3) {
      currentFps = frameCount;
      frameCount = 0;
      lastFpsCheck = now;
      if (currentFps < 28) lowPerfMode = true;
      if (currentFps > 32) lowPerfMode = false;
    }
  }
  ctx.shadowBlur = 0;
  const inCooldown = now - executionEndTime < 500;
  if (!isExecuting && !inCooldown && !starInitialized) {
    cachedHeight = height;
    initStars(width, height);
  }
  const snowEnabled = getSetting("ChristmasTheme.Snowflake.Enabled");
  if (!isExecuting && !inCooldown && snowEnabled && !bgSnowflakesInitialized) {
    initBgSnowflakes(width, height);
  }
  if (snowEnabled && bgSnowflakeEntities.length > 0) {
    const currentSnowflakeColorScheme = getSetting("ChristmasTheme.Snowflake.ColorScheme");
    const currentChristmasColorScheme = getSetting("ChristmasTheme.ChristmasEffects.ColorScheme");
    if (currentSnowflakeColorScheme !== lastBgSnowflakeColorScheme || currentSnowflakeColorScheme === "match" && currentChristmasColorScheme !== lastBgColorScheme) {
      updateBgSnowflakeColors();
      lastBgSnowflakeColorScheme = currentSnowflakeColorScheme;
      lastBgColorScheme = currentChristmasColorScheme;
    }
  }
  ctx.save();
  const gradient = getGradient(ctx, height);
  if (gradient) {
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, width, height);
  }
  const starsEnabled = getSetting("ChristmasTheme.Background.Stars");
  const partyMode = getSetting("ChristmasTheme.Background.PartyMode");
  const colorTheme = getSetting("ChristmasTheme.Background.ColorTheme") || "classic";
  BACKGROUND_THEMES[colorTheme] || BACKGROUND_THEMES.classic;
  const time = animationTime;
  const partyColors = ["#ff0080", "#00ff80", "#8000ff", "#ff8000", "#00ffff", "#ff00ff", "#ffff00", "#00ff00"];
  if (starsEnabled) {
    for (let starIdx = 0; starIdx < starEntities.length; starIdx++) {
      const star = starEntities[starIdx];
      if (lowPerfMode) {
        if (star.layer === "distant" && starIdx % 3 !== 0) continue;
        if (star.layer === "normal" && starIdx % 2 !== 0) continue;
      }
      let starSpeed = star.twinkleSpeed * star.twinkleSpeedMod;
      let opacity, starColor;
      if (partyMode) {
        starSpeed *= 8;
        const fastTwinkle = Math.sin(time * starSpeed + star.twinkleOffset);
        const colorIndex = Math.floor((time * 3 + star.twinkleOffset) % partyColors.length);
        starColor = partyColors[colorIndex];
        opacity = star.baseOpacity * (0.4 + Math.abs(fastTwinkle) * 0.6);
      } else {
        const twinkle = Math.sin(time * starSpeed + star.twinkleOffset);
        const twinkle2 = Math.sin(time * starSpeed * 0.67 + star.twinkleOffset2);
        const combinedTwinkle = twinkle * 0.6 + twinkle2 * 0.4;
        opacity = star.baseOpacity * (0.8 + combinedTwinkle * 0.2);
        starColor = star.color;
      }
      ctx.fillStyle = starColor;
      if (star.hasGlow && !lowPerfMode) {
        ctx.shadowBlur = partyMode ? star.size * 10 : star.size * 5;
        ctx.shadowColor = starColor;
        ctx.globalAlpha = opacity * (partyMode ? 0.9 : 0.7);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * (partyMode ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fill();
        if (star.hasSpikes && !partyMode) {
          const combinedTwinkle = Math.sin(time * starSpeed + star.twinkleOffset);
          ctx.shadowBlur = 0;
          const spikeLength = star.size * 4 * (0.6 + combinedTwinkle * 0.4);
          ctx.strokeStyle = starColor;
          ctx.lineWidth = 0.3;
          ctx.globalAlpha = opacity * 0.25;
          ctx.beginPath();
          ctx.moveTo(star.x - spikeLength, star.y);
          ctx.lineTo(star.x + spikeLength, star.y);
          ctx.moveTo(star.x, star.y - spikeLength);
          ctx.lineTo(star.x, star.y + spikeLength);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        ctx.globalAlpha = opacity * (partyMode ? 0.7 : 0.5);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * (partyMode ? 1.2 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (!lowPerfMode) {
    const horizonGlow = ctx.createLinearGradient(0, height * 0.7, 0, height);
    horizonGlow.addColorStop(0, "rgba(0, 0, 0, 0)");
    horizonGlow.addColorStop(0.5, "rgba(20, 30, 60, 0.05)");
    horizonGlow.addColorStop(1, "rgba(40, 50, 80, 0.1)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
  }
  if (!lowPerfMode && nebulaEntities.length > 0) {
    for (const nebula of nebulaEntities) {
      const nebulaOpacity = nebula.opacity;
      const nebulaGradient = ctx.createRadialGradient(
        nebula.x,
        nebula.y,
        0,
        nebula.x,
        nebula.y,
        nebula.radius
      );
      nebulaGradient.addColorStop(0, `rgba(80, 120, 200, ${nebulaOpacity * 0.6})`);
      nebulaGradient.addColorStop(0.4, `rgba(60, 100, 180, ${nebulaOpacity * 0.3})`);
      nebulaGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = nebulaGradient;
      ctx.beginPath();
      ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (snowEnabled && bgSnowflakeEntities.length > 0) {
    ctx.lineCap = "round";
    const glowIntensity = getSetting("ChristmasTheme.Snowflake.Glow") || 10;
    for (const flake of bgSnowflakeEntities) {
      flake.y += flake.speed * deltaTime;
      flake.rotation += flake.rotationSpeed * deltaTime;
      const driftX = Math.sin(time * flake.driftSpeed + flake.driftOffset) * flake.drift;
      if (!isExecuting && flake.y > height + 20) {
        flake.y = -20;
        flake.x = Math.random() * width;
        flake.color = getBgSnowflakeColor();
        updateFlakeRgba(flake);
        flake.flakeType = ["branched", "minimal", "stellar", "emoji1", "emoji2", "emoji3", "dendrite", "ornate"][Math.floor(Math.random() * 8)];
      }
      ctx.globalAlpha = flake.opacity;
      ctx.strokeStyle = flake.color;
      ctx.fillStyle = flake.color;
      ctx.lineWidth = Math.max(0.5, flake.size * 0.12);
      const glowAmount = Math.min(glowIntensity * 0.4, 8);
      if (glowAmount > 0.5) {
        if (!flake.rgb || !flake.rgbaStrings) {
          updateFlakeRgba(flake);
        }
        const glowRadius = flake.size * 0.6 + glowAmount;
        const gradient2 = ctx.createRadialGradient(
          flake.x + driftX,
          flake.y,
          flake.size * 0.1,
          flake.x + driftX,
          flake.y,
          glowRadius
        );
        gradient2.addColorStop(0, flake.rgbaStrings[0]);
        gradient2.addColorStop(0.5, flake.rgbaStrings[1]);
        gradient2.addColorStop(1, flake.rgbaStrings[2]);
        ctx.globalAlpha = flake.opacity;
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(flake.x + driftX, flake.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flake.color;
      }
      const snowflakeType = getSetting("ChristmasTheme.Snowflake.Type");
      if (snowflakeType === "custom" || snowflakeType === "mix_custom") {
        const snowSrc = getSetting("ChristmasTheme.Snowflake.CustomImage");
        if (snowSrc && snowSrc !== customSnowImageSrc) {
          customSnowImageSrc = snowSrc;
          customSnowImage = new Image();
          customSnowImage.onload = () => {
            if (app.canvas) app.canvas.setDirty(true, true);
          };
          customSnowImage.src = snowSrc;
        }
      }
      let effectiveType = snowflakeType;
      if (snowflakeType === "mix_custom") {
        if (Math.floor(flake.x) % 2 === 0) {
          effectiveType = "custom";
        }
      }
      if (effectiveType === "custom") {
        if (customSnowImage && customSnowImage.complete && customSnowImage.naturalWidth > 0) {
          ctx.save();
          ctx.translate(flake.x + driftX, flake.y);
          ctx.rotate(flake.rotation);
          const size = flake.size * 2;
          ctx.drawImage(customSnowImage, -size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          drawCrystalSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        }
      } else if (effectiveType && effectiveType !== "random" && effectiveType !== "mix_custom") {
        if (snowflakeType === "classic") drawCrystalSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        else if (snowflakeType === "simple") drawEmoji2745(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        else if (snowflakeType === "bold") drawEmoji2746(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        else drawCrystalSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
      } else {
        if (flake.flakeType === "minimal") {
          drawCrystalSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        } else if (flake.flakeType === "stellar") {
          drawStellarSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        } else if (flake.flakeType === "emoji1") {
          drawEmoji2744(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        } else if (flake.flakeType === "emoji2") {
          drawEmoji2745(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        } else if (flake.flakeType === "emoji3") {
          drawEmoji2746(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        } else if (flake.flakeType === "dendrite") {
          drawDendriteSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        } else if (flake.flakeType === "ornate") {
          drawOrnateSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        } else {
          drawSnowflake(ctx, flake.x + driftX, flake.y, flake.size, flake.rotation);
        }
      }
    }
  }
  const shootingStarsEnabled = getSetting("ChristmasTheme.Background.ShootingStars");
  if (!lowPerfMode && shootingStarsEnabled) {
    if (!isExecuting && now - lastShootingStarTime > 1e4 && Math.random() < 0.02) {
      shootingStars.push(createShootingStar(width, height));
      lastShootingStarTime = now;
    }
    ctx.lineCap = "round";
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      star.x += star.vx * deltaTime;
      star.y += star.vy * deltaTime;
      star.life -= star.decay * deltaTime;
      if (star.life <= 0 || star.x > width + 50 || star.y > height + 50) {
        shootingStars.splice(i, 1);
        continue;
      }
      const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
      const dirX = star.vx / speed;
      const dirY = star.vy / speed;
      let intensityMod = 1;
      if (star.willFlare && star.life < 0.3) {
        intensityMod = star.flareIntensity * (1 - star.life / 0.3) * star.life * 3;
      }
      if (now - star.lastFragmentTime > star.fragmentInterval && star.fragments.length < 8) {
        star.fragments.push({
          x: star.x - dirX * 3,
          y: star.y - dirY * 3,
          life: 0.5,
          size: 0.3 + Math.random() * 0.4
        });
        star.lastFragmentTime = now;
      }
      for (let j = star.fragments.length - 1; j >= 0; j--) {
        const frag = star.fragments[j];
        frag.life -= deltaTime * 2;
        if (frag.life <= 0) {
          star.fragments.splice(j, 1);
          continue;
        }
        ctx.fillStyle = `rgba(255, 200, 150, ${frag.life * 0.4})`;
        ctx.globalAlpha = frag.life;
        ctx.beginPath();
        ctx.arc(frag.x, frag.y, frag.size, 0, Math.PI * 2);
        ctx.fill();
      }
      const tailX = star.x - dirX * star.length * star.life;
      const tailY = star.y - dirY * star.length * star.life;
      const trailGradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      trailGradient.addColorStop(0, "rgba(255, 180, 100, 0)");
      trailGradient.addColorStop(0.4, `rgba(255, 200, 150, ${star.life * star.brightness * 0.2 * intensityMod})`);
      trailGradient.addColorStop(0.8, `rgba(255, 240, 220, ${star.life * star.brightness * 0.5 * intensityMod})`);
      trailGradient.addColorStop(1, `rgba(255, 255, 255, ${star.life * star.brightness * 0.9 * intensityMod})`);
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = 1 + star.life * 1.5;
      ctx.globalAlpha = star.life;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();
      const headSize = (1.2 + star.life) * intensityMod;
      ctx.shadowBlur = 10 * intensityMod;
      ctx.shadowColor = "#ffffcc";
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = star.life * star.brightness * intensityMod;
      ctx.beginPath();
      ctx.arc(star.x, star.y, headSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  const hasExistingParticles = fireworkRockets.length > 0 || fireworkParticles.length > 0 || fireworkSparks.length > 0;
  const fireworksEnabled = getSetting("ChristmasTheme.Background.Fireworks") || finaleActive || finaleGracePeriod && hasExistingParticles;
  if (fireworksEnabled) {
    if (finaleActive && now - finaleStartTime > FINALE_DURATION) {
      finaleActive = false;
      finaleGracePeriod = true;
      console.log("🎆 Finale ended, entering grace period");
    }
    if (finaleGracePeriod && !hasExistingParticles) {
      finaleGracePeriod = false;
      console.log("🎆 Grace period complete");
    }
    const shouldSpawn = !isExecuting && (finaleActive || getSetting("ChristmasTheme.Background.Fireworks") && !finaleGracePeriod);
    if (shouldSpawn) {
      const spawnInterval = finaleActive ? 100 + Math.random() * 150 : 2e3 + Math.random() * 2e3;
      if (now - lastFireworkTime > spawnInterval) {
        const spawnCount = finaleActive ? 2 + Math.floor(Math.random() * 3) : 1;
        for (let s = 0; s < spawnCount; s++) {
          const rocket = createFireworkRocket(width, height);
          if (finaleActive && Math.random() < 0.3) {
            rocket.palette = ["#ffd700", "#ffec99", "#fff9db"];
            rocket.vy = -14 - Math.random() * 6;
          }
          fireworkRockets.push(rocket);
        }
        lastFireworkTime = now;
      }
    }
    for (let i = fireworkRockets.length - 1; i >= 0; i--) {
      const rocket = fireworkRockets[i];
      rocket.vy += 0.12;
      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      rocket.age += deltaTime;
      rocket.trailTimer += deltaTime;
      if (rocket.trailTimer > 0.02) {
        rocket.trail.push({ x: rocket.x, y: rocket.y, alpha: 1, size: rocket.size });
        rocket.trailTimer = 0;
      }
      if (rocket.trail.length > 20) rocket.trail.shift();
      if (rocket.vy > -2 && !rocket.exploded) {
        rocket.exploded = true;
        fireworkParticles.push(...createExplosionParticles(rocket.x, rocket.y, rocket.palette, rocket.explosionType));
        fireworkRockets.splice(i, 1);
        continue;
      }
      if (rocket.age > 5 && !rocket.exploded) {
        rocket.exploded = true;
        const simpleCount = 15 + Math.floor(Math.random() * 10);
        for (let i2 = 0; i2 < simpleCount; i2++) {
          const angle = Math.PI * 2 * i2 / simpleCount;
          const speed = 2 + Math.random() * 2;
          fireworkParticles.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: rocket.palette[Math.floor(Math.random() * rocket.palette.length)],
            alpha: 1,
            size: 1.5 + Math.random(),
            decay: 0.025,
            // Faster fade than normal
            trail: [],
            hasTrail: false,
            // No trails for performance
            gravity: 0.05
          });
        }
        fireworkRockets.splice(i, 1);
        continue;
      }
      const primaryColor = rocket.palette[0];
      for (let j = 0; j < rocket.trail.length; j++) {
        const point = rocket.trail[j];
        const progress = j / rocket.trail.length;
        const alpha = progress * 0.8;
        const size = point.size * progress * 0.8;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 15;
      ctx.shadowColor = primaryColor;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, rocket.size + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, rocket.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (let i = fireworkParticles.length - 1; i >= 0; i--) {
      const p = fireworkParticles[i];
      if (p.hasTrail && p.trail) {
        p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
        if (p.trail.length > 8) p.trail.shift();
      }
      p.vy += p.gravity || 0.04;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.alpha -= p.decay;
      if (p.crackle && p.crackleTime !== void 0) {
        p.crackleTime -= deltaTime;
        if (p.crackleTime <= 0 && p.alpha > 0.3) {
          for (let c = 0; c < 5; c++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            fireworkSparks.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              alpha: 0.8,
              size: 0.8,
              decay: 0.05,
              twinkle: Math.random() * Math.PI * 2
            });
          }
          p.crackle = false;
        }
      }
      if (p.alpha <= 0) {
        fireworkParticles.splice(i, 1);
        continue;
      }
      if (p.hasTrail && p.trail && p.trail.length > 0) {
        for (let t = 0; t < p.trail.length; t++) {
          const tp = p.trail[t];
          const trailAlpha = t / p.trail.length * p.alpha * 0.5;
          const trailSize = p.size * (t / p.trail.length) * 0.7;
          ctx.globalAlpha = trailAlpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (let i = fireworkSparks.length - 1; i >= 0; i--) {
      const s = fireworkSparks[i];
      s.vy += 0.03;
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.decay;
      s.twinkle += 0.3;
      if (s.alpha <= 0) {
        fireworkSparks.splice(i, 1);
        continue;
      }
      const twinkleAlpha = s.alpha * (0.5 + Math.sin(s.twinkle) * 0.5);
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = twinkleAlpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  updateMouseParticles();
  drawMouseParticles(ctx);
  if (finaleActive || finaleConfetti.length > 0 || finaleStars.length > 0) {
    updateFinaleParticles(ctx, ctx.canvas);
    drawFinaleParticles(ctx);
  }
  ctx.restore();
}
function startAnimationLoop() {
  if (animationLoopId !== null) return;
  function loop() {
    if (isPageVisible && getSetting("ChristmasTheme.Background.Enabled")) {
      const pauseDuringRender = getSetting("ChristmasTheme.PauseDuringRender");
      const shouldRender = !isExecuting || !pauseDuringRender;
      if (shouldRender && app.canvas) {
        app.canvas.setDirty(true, true);
      }
    }
    animationLoopId = requestAnimationFrame(loop);
  }
  animationLoopId = requestAnimationFrame(loop);
}
function stopAnimationLoop() {
  if (animationLoopId !== null) {
    cancelAnimationFrame(animationLoopId);
    animationLoopId = null;
  }
}
let hookRetryCount = 0;
function installBackgroundHook() {
  if (!app.canvas) {
    if (hookRetryCount++ > 50) {
      console.warn("❌ Failed to install background hook: app.canvas not available after 5s");
      hookRetryCount = 0;
      return;
    }
    console.log("Waiting for app.canvas to install background hook...");
    setTimeout(installBackgroundHook, 100);
    return;
  }
  hookRetryCount = 0;
  const canvas = app.canvas;
  if (!originalDrawBackCanvas) {
    originalDrawBackCanvas = canvas.constructor.prototype.drawBackCanvas;
  }
  canvas.constructor.prototype.drawBackCanvas = function() {
    if (originalDrawBackCanvas) {
      originalDrawBackCanvas.apply(this, [...arguments]);
    }
    try {
      if (getSetting("ChristmasTheme.Background.Enabled") && this.bgctx) {
        drawEnhancedBackground(this.bgctx, this.bgcanvas.width, this.bgcanvas.height);
      }
    } catch (e) {
      console.error("Enhanced background error:", e);
    }
  };
  canvas.setDirty(true, true);
  startAnimationLoop();
  console.log("✨ Background hook installed successfully");
}
function removeBackgroundHook() {
  stopAnimationLoop();
  if (originalDrawBackCanvas && app.canvas) {
    app.canvas.constructor.prototype.drawBackCanvas = originalDrawBackCanvas;
    app.canvas.setDirty(true, true);
  }
  starEntities = [];
  starInitialized = false;
  cachedGradient = null;
}
app.registerExtension({
  name: "Comfy.EnhancedBackground",
  async setup() {
    if (extensionSetupComplete) {
      return;
    }
    extensionSetupComplete = true;
    console.log("🎨 Setting up Enhanced Background extension...");
    initSettingsCache();
    app.api.addEventListener("execution_start", () => {
      isExecuting = true;
    });
    app.api.addEventListener("execution_cached", () => {
      isExecuting = true;
    });
    app.api.addEventListener("executed", () => {
      isExecuting = false;
      executionEndTime = performance.now();
    });
    app.api.addEventListener("execution_error", () => {
      isExecuting = false;
      executionEndTime = performance.now();
    });
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
        if (isInitialSetup) return;
        if (value) {
          installBackgroundHook();
        } else {
          removeBackgroundHook();
        }
        if (app.canvas) {
          app.canvas.setDirty(true, true);
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
      defaultValue: "frostnight",
      section: "Background Theme",
      onChange: async (value) => {
        updateCache("ChristmasTheme.Background.ColorTheme", value);
        if (isInitialSetup) return;
        cachedGradient = null;
        if (app.canvas) {
          app.canvas.setDirty(true, true);
        }
      }
    });
    app.ui.settings.addSetting({
      id: "ChristmasTheme.Background.ShootingStars",
      name: "☄️ Shooting Stars",
      type: "combo",
      options: [
        { value: true, text: "✨ On" },
        { value: false, text: "⭘ Off" }
      ],
      defaultValue: true,
      section: "Background Theme",
      onChange: async (value) => {
        updateCache("ChristmasTheme.Background.ShootingStars", value);
        if (isInitialSetup) return;
        if (!value) {
          shootingStars = [];
        }
        if (app.canvas) {
          app.canvas.setDirty(true, true);
        }
      }
    });
    app.ui.settings.addSetting({
      id: "ChristmasTheme.Background.Stars",
      name: "⭐ Background Stars",
      type: "combo",
      options: [
        { value: true, text: "✨ On" },
        { value: false, text: "⭘ Off" }
      ],
      defaultValue: true,
      section: "Background Theme",
      onChange: async (value) => {
        updateCache("ChristmasTheme.Background.Stars", value);
        if (isInitialSetup) return;
        if (app.canvas) {
          app.canvas.setDirty(true, true);
        }
      }
    });
    app.ui.settings.addSetting({
      id: "ChristmasTheme.Background.PartyMode",
      name: "🪩 Party Mode (Rave Stars)",
      type: "combo",
      options: [
        { value: true, text: "🎉 On" },
        { value: false, text: "⭘ Off" }
      ],
      defaultValue: false,
      section: "Background Theme",
      onChange: async (value) => {
        updateCache("ChristmasTheme.Background.PartyMode", value);
        if (isInitialSetup) return;
        if (app.canvas) {
          app.canvas.setDirty(true, true);
        }
      }
    });
    app.ui.settings.addSetting({
      id: "ChristmasTheme.Background.Fireworks",
      name: "🎆 Fireworks",
      type: "combo",
      options: [
        { value: true, text: "🎇 On" },
        { value: false, text: "⭘ Off" }
      ],
      defaultValue: false,
      section: "Background Theme",
      onChange: async (value) => {
        updateCache("ChristmasTheme.Background.Fireworks", value);
        if (isInitialSetup) return;
        if (!value) {
          fireworkRockets = [];
          fireworkParticles = [];
        }
        if (app.canvas) {
          app.canvas.setDirty(true, true);
        }
      }
    });
    app.ui.settings.addSetting({
      id: "ChristmasTheme.Background.MouseEffect",
      name: "✨ Mouse Trail Effect",
      type: "combo",
      options: [
        { value: "none", text: "⭘ Off" },
        { value: "sparkler", text: "✨ Sparkler" },
        { value: "snowflake", text: "❄️ Snowflake" },
        { value: "confetti", text: "🎊 Confetti" },
        { value: "stardust", text: "⭐ Stardust" },
        { value: "comet", text: "☄️ Comet" },
        { value: "aurora", text: "🌌 Aurora" },
        { value: "ribbon", text: "🎀 Ribbon" },
        { value: "crystal", text: "💎 Crystal" },
        { value: "petals", text: "🌸 Petals" },
        { value: "gifts", text: "🎁 Gifts" },
        { value: "candy", text: "🍬 Candy" },
        { value: "orb", text: "🔮 Magic Orb" },
        { value: "magic", text: "✨ Magic Wand" },
        { value: "nova", text: "🌟 Nova" },
        { value: "bubbles", text: "💧 Bubbles" },
        { value: "embers", text: "🔥 Embers" },
        { value: "lightning", text: "⚡ Lightning" },
        { value: "leaves", text: "🍂 Leaves" },
        { value: "wishes", text: "💫 Wishes" },
        { value: "notes", text: "🎵 Notes" },
        { value: "hearts", text: "💖 Hearts" }
      ],
      defaultValue: "none",
      section: "Background Theme",
      tooltip: "Choose a mouse trail effect",
      onChange: async (value) => {
        updateCache("ChristmasTheme.Background.MouseEffect", value);
        if (isInitialSetup) return;
        if (!value || value === "none") {
          mouseParticles = [];
        }
        if (app.canvas) {
          app.canvas.setDirty(true, true);
        }
      }
    });
    app.ui.settings.addSetting({
      id: "ChristmasTheme.Background.Countdown",
      name: "🎊 New Year Countdown",
      type: "combo",
      options: [
        { value: true, text: "🕐 On" },
        { value: false, text: "⭘ Off" }
      ],
      defaultValue: true,
      section: "Background Theme",
      onChange: async (value) => {
        updateCache("ChristmasTheme.Background.Countdown", value);
        if (isInitialSetup) return;
        toggleCountdownDisplay(value);
      }
    });
    loadSettingFromStorage("ChristmasTheme.Background.Enabled");
    loadSettingFromStorage("ChristmasTheme.Background.ColorTheme");
    loadSettingFromStorage("ChristmasTheme.Background.Stars");
    loadSettingFromStorage("ChristmasTheme.Background.PartyMode");
    loadSettingFromStorage("ChristmasTheme.Background.ShootingStars");
    loadSettingFromStorage("ChristmasTheme.Background.Fireworks");
    loadSettingFromStorage("ChristmasTheme.Background.MouseEffect");
    loadSettingFromStorage("ChristmasTheme.Background.Countdown");
    isInitialSetup = false;
    if (getSetting("ChristmasTheme.Background.Enabled")) {
      installBackgroundHook();
    }
    if (getSetting("ChristmasTheme.Background.Countdown")) {
      toggleCountdownDisplay(true);
    }
    return () => {
      removeBackgroundHook();
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      if (countdownElement) {
        countdownElement.remove();
      }
    };
  }
});
export {
  isExecuting,
  isPageVisible
};
//# sourceMappingURL=background-themes.js.map
