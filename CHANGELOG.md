# Changelog

All notable changes to this project will be documented in this file.

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
