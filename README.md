<div align="center">

# 🎄 ComfyUI Christmas Theme ✨

**Transform your ComfyUI workspace into a winter wonderland**

[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green?style=for-the-badge)](https://github.com/comfyanonymous/ComfyUI)
[![Version](https://img.shields.io/badge/Version-1.3.0-orange?style=for-the-badge)](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases)
[![License](https://img.shields.io/badge/License-GPLv3-red?style=for-the-badge)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=for-the-badge&color=blue)](package.json)
[![Last Commit](https://img.shields.io/github/last-commit/AEmotionStudio/ComfyUI-ChristmasTheme?style=for-the-badge&label=Last%20Update&color=orange)](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/commits)
[![Activity](https://img.shields.io/github/commit-activity/m/AEmotionStudio/ComfyUI-ChristmasTheme?style=for-the-badge&label=Activity&color=yellow)](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/commits)

![ComfyUI Christmas Theme Overview](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases/download/assets/main-preview.webp)

*Dynamic backgrounds • Animated snowfall • Festive node connections • Interactive mouse effects*

</div>

---

## What's New in v1.3.0 (January 9, 2026)

**TypeScript Migration & Animation Fixes**

*   **⚡ TypeScript Core**: Completely rewrote the codebase in TypeScript for improved stability and maintenance.
*   **🧪 Robust Testing**: Added comprehensive Unit (Vitest) and End-to-End (Playwright) standard testing suites.
*   **✨ Smoother Animations**: Fixed issue where background animations would pause when idle; added continuous render loop.
*   **🎆 New Year 2027**: Updated countdown logic to automatically target the next year.

> 📄 **See [CHANGELOG.md](CHANGELOG.md) for the complete version history.**

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎄 Christmas Node Links
![Node Link Animations](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases/download/assets/node-links.webp)

- Animated light effects along connections
- **6 color schemes**: Traditional, Warm White, Cool White, Multicolor, Pastel, New Year's Eve
- **6 animation styles**: Steady, Gentle Twinkle, Sparkle, Candy Cane, Frost Trail, Aurora Flow
- Icicle-shaped bulbs with adjustable size and glow
- Multiple link styles (spline, straight, linear, hidden)

</td>
<td width="50%">

### ❄️ Snowfall Effect
![Snowfall Effect](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases/download/assets/snow-flakes.webp)

- 8 unique SVG snowflake designs with JS animation
- **5 color options**: White, Ice Blue, Rainbow, Match Theme, New Year's
- Adjustable glow intensity
- GPU-accelerated rendering
- Auto-scales based on device performance

</td>
</tr>
<tr>
<td width="50%">

### 🌌 Dynamic Backgrounds
![Background Themes](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases/download/assets/backgrounds.webp)

- Animated starry night sky with nebula clouds
- **6 atmospheric themes**:
  - 🌌 Classic Night
  - 🎄 Christmas Forest
  - 🍬 Candy Cane Red
  - ❄️ Frost Night
  - 🍪 Gingerbread
  - 🌑 Dark Night

</td>
<td width="50%">

### ✨ Interactive Mouse Effects
![Interactive Mouse Effects](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases/download/assets/interactive-mouse-effects.webp)

- **21 unique particle effects** with physics simulation
- Sparklers, Confetti, Stardust, Aurora, and more
- Each effect has unique friction, gravity, and spawn behaviors
- Fully GPU-accelerated with object pooling

</td>
</tr>
<tr>
<td width="50%">

### 🎆 New Year Celebration

- Live countdown timer to midnight
- Professional fireworks display with 6 explosion types
- Multi-stage finale triggered at 00:00:00

</td>
<td width="50%">

### ⚡ Performance Features

- **Adaptive quality** — auto-reduces effects when FPS drops
- **Smart pausing** — animations freeze during workflow execution
- **Tab detection** — pauses when browser tab is hidden
- **Device-aware** — adjusts to hardware capabilities
- **Object pooling** — minimizes memory allocation
- **Cached gradients** — avoids recreating colors each frame

</td>
</tr>
</table>

---

## 📦 Installation

### Option 1: ComfyUI Manager (Recommended)
Search for "Christmas Theme" in ComfyUI Manager and click Install.

### Option 2: Git Clone
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme
```

---

## ⚙️ Settings

All settings are accessible via **ComfyUI Settings → Christmas Theme**

<details>
<summary><b>🎄 Christmas Effects</b></summary>

| Setting | Options | Default |
|---------|---------|---------|
| Christmas Lights | On / Off | On |
| Color Scheme | Traditional, Warm White, Cool White, Multicolor, Pastel, New Year's Eve | Traditional |
| Light Effect | Steady, Gentle Twinkle, Sparkle, Candy Cane, Frost Trail, Aurora Flow | Gentle Twinkle |
| Light Size | 1 - 10 | 3 |
| Glow Intensity | 0 - 30 | 20 |
| Flow Direction | Forward / Reverse | Forward |
| Link Style | Spline, Straight, Linear, Hidden | Spline |

</details>

<details>
<summary><b>🌌 Background Theme</b></summary>

| Setting | Options | Default |
|---------|---------|---------|
| Background Effect | On / Off | On |
| Color Theme | Classic Night, Christmas Forest, Candy Cane Red, Frost Night, Gingerbread, Dark Night | Classic |
| Shooting Stars | On / Off | On |
| Background Stars | On / Off | On |
| Party Mode | On / Off (Rave Stars) | Off |
| Fireworks | On / Off | Off |
| Mouse Trail Effect | None, Sparkler, Snowflake, Confetti, Stardust, Comet, Aurora, Ribbon, Crystal, Petals, Gifts, Candy, Magic Orb, Magic Wand, Nova, Bubbles, Embers, Lightning, Leaves, Wishes, Notes, Hearts | None |
| New Year Countdown | On / Off | Off |

</details>

<details>
<summary><b>❄️ Snow Effect</b></summary>

| Setting | Options | Default |
|---------|---------|---------|
| Snow Effect | On / Off | On |
| Snowflake Color | White, Ice Blue, Rainbow, Match Theme, New Year's | White |
| Snowflake Glow | 0 - 20 | 10 |

</details>

<details>
<summary><b>⚡ Performance</b></summary>

| Setting | Options | Default |
|---------|---------|---------|
| Pause During Render | Enabled / Disabled | Enabled |

</details>

---

## 🔧 Technical Details

| Component | Technology |
|-----------|------------|
| Snowflakes | Pure DOM + CSS animations (GPU-accelerated) |
| Background | Canvas 2D with gradient caching |
| Node Links | Canvas override with adaptive rendering |
| Settings | Centralized cache with onChange callbacks |

**Performance optimizations include:**
- O(1) frame time averaging
- Pre-allocated object pools
- Sin lookup tables for animations
- Page Visibility API integration
- Device capability detection

---

## 🤝 Contributing

Contributions are welcome! Whether it's bug reports, feature suggestions, or pull requests, your help is appreciated.

---
<div align="center">

**Developed by [Æmotion Studio](https://aemotionstudio.org/)**

[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@aemotionstudio/videos)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/UzC9353mfp)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/aemotionstudio)

</div>

---

<div align="center">

*Happy Holidays and a Happy New Year!* 🎄

</div>
