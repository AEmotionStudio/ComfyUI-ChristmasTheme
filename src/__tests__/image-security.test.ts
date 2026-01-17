import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock dependencies BEFORE import
vi.mock('../../scripts/app.js', () => ({
    app: {
        registerExtension: vi.fn(),
        ui: { settings: { setSettingValue: vi.fn() } }
    }
}));

// Mock CSS import
vi.mock('../sidebar.css?inline', () => ({
    default: '.mock-css {}'
}));

// Mock utils/dom
vi.mock('../utils/dom', () => ({
    el: vi.fn((tag) => document.createElement(tag))
}));

// Mock settings-cache
vi.mock('../settings-cache', () => ({
    getSetting: vi.fn(),
    updateCache: vi.fn(),
    getDefaults: vi.fn(() => ({}))
}));

import { optimizeImage } from '../christmas-sidebar';

describe('Image Security', () => {
    // Preserve original Image constructor
    const originalImage = global.Image;

    beforeAll(() => {
        // Mock Image class
        // @ts-ignore
        global.Image = class MockImage {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            width: number = 100;
            height: number = 100;
            _src: string = '';

            set src(value: string) {
                this._src = value;
                // Simulate async loading behavior
                setTimeout(() => {
                    // Simple logic: assume it fails if it doesn't start with data:image/
                    if (value.startsWith('data:image/')) {
                        if (this.onload) this.onload();
                    } else {
                        if (this.onerror) this.onerror();
                    }
                }, 10);
            }

            get src() { return this._src; }
        };
    });

    afterAll(() => {
        global.Image = originalImage;
    });

    it('should resolve with null for invalid image data (preventing garbage storage)', async () => {
        const invalidData = 'data:text/plain;base64,SGVsbG8gV29ybGQ='; // Not an image
        const result = await optimizeImage(invalidData);
        expect(result).toBeNull();
    });

    it('should resolve with image data for valid image data', async () => {
        // Mock canvas methods
        const mockContext = {
            drawImage: vi.fn(),
        };

        // Spy on document.createElement to verify usage
        const createElementSpy = vi.spyOn(document, 'createElement');
        const originalCreateElement = createElementSpy.getMockImplementation() || document.createElement.bind(document);

        // We can rely on jsdom's canvas but need to ensure toDataURL works or is mocked
        // Since we want to control the output, let's mock the canvas instance specifically when 'canvas' is requested
        createElementSpy.mockImplementation((tagName: string, options?: ElementCreationOptions) => {
            if (tagName === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => mockContext,
                    toDataURL: (type: string) => `data:${type};base64,mocked_optimized_data`,
                } as unknown as HTMLElement;
            }
            return originalCreateElement(tagName, options);
        });

        const validData = 'data:image/png;base64,mock_valid_png_data';
        const result = await optimizeImage(validData);

        expect(result).not.toBeNull();
        expect(result).toBe('data:image/webp;base64,mocked_optimized_data');
        expect(mockContext.drawImage).toHaveBeenCalled();

        createElementSpy.mockRestore();
    });
});
