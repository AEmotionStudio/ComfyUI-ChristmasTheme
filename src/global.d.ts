/**
 * Ambient module declarations for ComfyUI external scripts.
 * This file must NOT have any imports/exports at the top level
 * to be treated as a global ambient declaration file.
 */

// ComfyUI App types
interface ComfyApp {
    graph: ComfyGraph;
    canvas: ComfyCanvas;
    ui: ComfyUI;
    extensionManager: ComfyExtensionManager;
    registerExtension(extension: ComfyExtension): void;
}

interface ComfyGraph {
    _nodes: ComfyNode[];
    _nodes_by_id: Record<number, ComfyNode>;
    _links: Record<number, ComfyLink>;
    list_of_graphcanvas: ComfyCanvas[];
    getNodeById(id: number): ComfyNode | null;
}

interface ComfyCanvas {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    ds: { scale: number; offset: [number, number] };
    graph: ComfyGraph;
    setDirty(foreground?: boolean, background?: boolean): void;
}

interface ComfyUI {
    settings: ComfySettings;
}

interface ComfySettings {
    addSetting(setting: ComfySetting): void;
    getSettingValue(id: string): unknown;
    setSettingValue(id: string, value: unknown): void;
}

interface ComfySetting {
    id: string;
    name: string;
    type: 'text' | 'number' | 'slider' | 'combo' | 'color' | 'boolean';
    defaultValue: unknown;
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{ value: unknown; text: string }>;
    tooltip?: string;
    section?: string;
    onChange?: (value: unknown) => void;
}

interface ComfyExtensionManager {
    setting: { get(id: string): unknown; set(id: string, value: unknown): void };
    toast: ComfyToast;
    dialog: ComfyDialog;
    registerSidebarTab(tab: ComfySidebarTab): void;
}

interface ComfySidebarTab {
    id: string;
    icon: string;
    title: string;
    tooltip: string;
    type: 'custom';
    render: (el: HTMLElement) => void;
}

interface ComfyToast {
    add(options: { severity: string; summary: string; detail: string; life?: number }): void;
    addAlert(message: string): void;
}

interface ComfyDialog {
    prompt(options: { title: string; message: string }): Promise<string>;
    confirm(options: { title: string; message: string }): Promise<boolean>;
}

interface ComfyExtension {
    name: string;
    setup?: () => Promise<void> | void;
    init?: () => Promise<void> | void;
}

interface ComfyNode {
    id: number;
    type: string;
    title: string;
    pos: [number, number];
    size: [number, number];
    inputs: ComfySlot[];
    outputs: ComfySlot[];
    widgets?: ComfyWidget[];
    properties: Record<string, unknown>;
    is_selected?: boolean;
    bgcolor?: string;
    color?: string;
    graph: ComfyGraph;
}

interface ComfySlot {
    name: string;
    type: string;
    link: number | null;
    links?: number[];
}

interface ComfyLink {
    id: number;
    type: string;
    origin_id: number;
    origin_slot: number;
    target_id: number;
    target_slot: number;
    color?: string;
}

interface ComfyWidget {
    name: string;
    type: string;
    value: unknown;
    options?: Record<string, unknown>;
}

interface ComfyApi {
    addEventListener(event: string, callback: (data: unknown) => void): void;
    removeEventListener(event: string, callback: (data: unknown) => void): void;
    fetchApi(route: string, options?: RequestInit): Promise<Response>;
    queuePrompt(number: number, workflow: object): Promise<object>;
    interrupt(): Promise<void>;
    getHistory(max_items?: number): Promise<object>;
    getQueue(): Promise<object>;
}

// Module declarations
declare module "/scripts/app.js" {
    export const app: ComfyApp;
}

declare module "/scripts/api.js" {
    export const api: ComfyApi;
}

declare module "/scripts/ui.js" {
    export const ui: {
        dialog: { show(html: string): void; close(): void };
        settings: ComfySettings;
    };
}

declare module "../../scripts/app.js" {
    export const app: ComfyApp;
}

declare module "../../scripts/api.js" {
    export const api: ComfyApi;
}

declare module "../../../scripts/app.js" {
    export const app: ComfyApp;
}

declare module "../../../scripts/api.js" {
    export const api: ComfyApi;
}
