# Changelog

All notable changes to this project will be documented in this file.

## [1.4.4] - 2026-01-15

### Jan 15, 2026
- **Performance**: Pre-calculated RGBA color strings for snowflake gradients. This reduces string allocations in the render loop by ~8100/sec, significantly lowering CPU overhead and garbage collection pressure during animations (PR #16).
- **Bug Fix**: Fixed an unbounded recursive timer in background themes that could lead to memory leaks and performance degradation over time (PR #15).
- **Accessibility**: Added comprehensive ARIA labels to sidebar controls to improve screen reader compatibility and overall accessibility (PR #14).
- **Core**: Updated the New Year countdown target year to 2027 to ensure continued festive functionality.

### Jan 14, 2026
- **Performance**: Initial optimizations for snowflake rendering performance to maintain smooth frame rates on lower-end devices (PR #13).
- **Security**: Fixed security vulnerability by adding missing `rel="noopener"` attributes to external links in the sidebar and about sections (PR #12).


## [1.4.3] - 2026-01-11

### Added
- **Custom Snowflakes**: Full support for custom image uploads.
- **Snowflake Presets**: Selection between Classic, Simple, Bold, and Random shapes.
- **Mix Mode**: New "Mix Custom + Standard" option to blend images with vector shapes.
- **Unified Layering**: Custom snowflakes now render in both background (Canvas) and foreground (Overlay) layers.

### Refactored
- **Architectural Cleanup**: Separated view logic from styles by extracting CSS to `sidebar.css`.
- **DOM Helper**: Introduced a lightweight `el()` utility for declarative-style DOM construction, reducing codebase boilerplate.
- **Unified Logic**: Consolidated snowflake generation logic between DOM and Canvas renderers.


## [1.3.0] - 2026-01-09

### Added
- **TypeScript Migration**: Converted entire codebase to TypeScript for better stability.
- **Testing Suite**: Added Vitest (unit) and Playwright (E2E) testing.
- **Animation Loop**: New render loop ensures background animations play continuously even when idle.

### Fixed
- **Animation Pause**: Fixed issue where background paused unless canvas was panned.
- **Countdown**: Repositioned to bottom-left (`z-index: 50`) to avoid sidebar overlap.
- **Target Year**: Countdown now dynamically targets the next year (2027).

## [1.2.0] - 2025-12-30

### Added
- **Live Celebration**: Physics-based countdown and finale synchronized to midnight.
- **Interactive Effects**: 21 new mouse trail particles (Sparklers, Confetti, Magic Wand, etc.).
- **Node Link Effects**: 3 new styles (Candy Cane, Frost Trail, Aurora Flow).
- **Rave Mode**: "Party Mode" setting for strobing disco stars.
- **Visual Core 2.0**: SVG rendering for sharper Snowflakes and Stars.
- **Sidebar Panel**: Dedicated settings tab in ComfyUI sidebar.

## [1.1.0] - 2025-12-25

### Performance
- **Adaptive Quality**: Auto-adjusts effects based on FPS.
- **Optimization**: Eliminated console deprecation warnings.
- **Visibility**: Pauses animations when tab is hidden.
- **DOM Snowflakes**: Removed React dependency for faster rendering.
- **Gradient Caching**: Improved background rendering performance.
