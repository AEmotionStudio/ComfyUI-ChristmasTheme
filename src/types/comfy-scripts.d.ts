/**
 * Module declarations for ComfyUI script imports
 * These allow TypeScript to understand the external ComfyUI modules
 */

declare module "/scripts/app.js" {
    import type { ComfyApp } from "./comfyui";
    export const app: ComfyApp;
}

declare module "/scripts/api.js" {
    export const api: {
        addEventListener(event: string, callback: (data: unknown) => void): void;
        removeEventListener(event: string, callback: (data: unknown) => void): void;
        fetchApi(route: string, options?: RequestInit): Promise<Response>;
        queuePrompt(number: number, workflow: object): Promise<object>;
        interrupt(): Promise<void>;
        getHistory(max_items?: number): Promise<object>;
        getQueue(): Promise<object>;
    };
}

declare module "/scripts/ui.js" {
    export const ui: {
        dialog: {
            show(html: string): void;
            close(): void;
        };
        settings: {
            addSetting(setting: object): void;
            getSettingValue(id: string): unknown;
            setSettingValue(id: string, value: unknown): void;
        };
    };
}

// Backward compatible relative path imports
declare module "../../scripts/app.js" {
    import type { ComfyApp } from "./comfyui";
    export const app: ComfyApp;
}

declare module "../../scripts/api.js" {
    export * from "/scripts/api.js";
}

declare module "../../scripts/ui.js" {
    export * from "/scripts/ui.js";
}

declare module "../../../scripts/app.js" {
    import type { ComfyApp } from "./comfyui";
    export const app: ComfyApp;
}

declare module "../../../scripts/api.js" {
    export * from "/scripts/api.js";
}
