<div align="center">

# 🎄 ComfyUI Christmas Theme ✨

**Transform your ComfyUI workspace into a winter wonderland**

[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green?style=for-the-badge)](https://github.com/comfyanonymous/ComfyUI)
[![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=for-the-badge&color=blue)](pyproject.toml)
[![License](https://img.shields.io/badge/License-GPLv3-red?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.2.2-orange?style=for-the-badge)](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases)

![ComfyUI Christmas Theme Overview](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/releases/download/assets/main-preview.webp)

*Dynamic backgrounds • Animated snowfall • Festive node connections • Interactive mouse effects*

</div>

---

## 📢 Latest Update — December 30, 2025

### 🎉 New Year's Live Celebration v1.2.0

A massive update introducing a physics-based particle engine, interactive effects, and a synchronized New Year's finale.

| New Feature | Description |
|-------------|-------------|
| ✨ **21 Mouse Effects** | Physics-based particle system with 21 unique interactive trails including Sparklers, Confetti, and Magic Wands. |
| 🔗 **3 New Link Effects** | Candy Cane stripes, icy Frost Trail, and flowing Aurora animations for node connections, plus new icicle-shaped bulbs. |
| 🎊 **Live Countdown** | Dynamic timer that auto-targets the New Year with a pulsing "Celebration Mode" anticipation phase. |
| 🤫 **Surprise Finale** | A spectacular, multi-stage 6-layer coordinated show triggered exactly at midnight. *No spoilers!* |
| 🪩 **Rave Mode** | "Party Mode" setting that transforms background stars into a strobing disco light show. |
| 🎨 **Visual Core 2.0** | Replaced emoji art with crisp SVG rendering for Snowflakes and Stars, plus new atmospheric Nebula clouds. |
| 🎁 **Sidebar Panel** | Quick-access Christmas Theme settings tab in the ComfyUI sidebar with festive styling. |

### ✨ Interactive Effect Library
Fully modular physics system with unique friction, gravity, and spawn behaviors:

| | | | |
|---|---|---|---|
| ✨ **Sparkler** | ❄️ **Snowflake** | 🎊 **Confetti** | ⭐ **Stardust** |
| ☄️ **Comet** | 🌌 **Aurora** | 🎀 **Ribbon** | 💎 **Crystal** |
| 🌸 **Petals** | 🎁 **Gifts** | 🍬 **Candy** | 🔮 **Magic Orb** |
| ✨ **Magic Wand** | 🌟 **Nova** | 💧 **Bubbles** | 🔥 **Embers** |
| ⚡ **Lightning** | 🍂 **Leaves** | 💫 **Wishes** | 🎵 **Notes** |
| 💖 **Hearts** | | | |

---

## 📢 Previous Update — December 25, 2025

### 🚀 Performance Overhaul v1.1.0

Major performance optimizations and bug fixes for a smoother experience:

| Change | Description |
|--------|-------------|
| ⚡ **Adaptive Performance** | Auto-adjusts visual quality based on your FPS (3 tiers: normal/warning/critical) |
| 🔧 **Settings API Fix** | Eliminated ~367,000 console deprecation warnings |
| 🎯 **Visibility Detection** | Automatically pauses animations when tab is hidden |
| 🧹 **Pure DOM Snowflakes** | Removed React dependency for lighter, faster snow effects |
| 📱 **Device-Aware** | Snowflake count adapts to device capability (25-60 flakes) |
| 🎨 **Gradient Caching** | Background themes now cache gradients for faster rendering |
| 🔢 **Sin Lookup Table** | Pre-computed trigonometry for twinkle effects |
| ♻️ **Object Pooling** | Reuses memory allocations to reduce garbage collection |

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

## 🔗 Connect with Æmotion (Developer)
-   YouTube: [AEmotionStudio](https://www.youtube.com/@aemotionstudio/videos)
-   GitHub: [AEmotionStudio](https://github.com/AEmotionStudio)
-   Discord: [Join our community](https://discord.gg/UzC9353mfp)
-   Website: [aemotionstudio.org](https://aemotionstudio.org/)

## ☕ Support
If you find this project useful, here are some ways to show your support:

- ⭐ **Star this repo** — It helps others discover the project!
- 📢 **Share it** — Tell your friends, post on social media, or write about it
- 🐛 **Report bugs** — Found an issue? Let me know!
- 💡 **Suggest features** — Ideas are always welcome

If you'd like to support development financially:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/aemotionstudio)

Your support helps dedicate more time to maintaining and improving this project and other projects, developing new features, and creating better documentation and tutorials.

---

<div align="center">

*Happy Holidays and a Happy New Year!* 🎄

</div>
