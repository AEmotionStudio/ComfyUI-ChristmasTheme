import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSetting, updateCache, initSettingsCache } from '../settings-cache';

// Mock the app module
vi.mock('../../scripts/app.js', () => ({
    app: {
        ui: {
            settings: {
                getSettingValue: vi.fn(),
                setSettingValue: vi.fn(),
                addSetting: vi.fn()
            }
        },
        registerExtension: vi.fn()
    }
}));

describe('Settings Cache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        initSettingsCache();
    });

    it('should return default values when not in cache', () => {
        // Assuming default for LightSwitch is 1
        expect(getSetting('ChristmasTheme.ChristmasEffects.LightSwitch')).toBe(1);
    });

    it('should update cache when updateCache is called', () => {
        updateCache('ChristmasTheme.ChristmasEffects.LightSwitch', 0);
        expect(getSetting('ChristmasTheme.ChristmasEffects.LightSwitch')).toBe(0);
    });

    it('should handle boolean settings correctly', () => {
        updateCache('ChristmasTheme.Background.Enabled', false);
        expect(getSetting('ChristmasTheme.Background.Enabled')).toBe(false);

        updateCache('ChristmasTheme.Background.Enabled', true);
        expect(getSetting('ChristmasTheme.Background.Enabled')).toBe(true);
    });
});
