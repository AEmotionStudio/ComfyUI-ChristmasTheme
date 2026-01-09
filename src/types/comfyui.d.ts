/**
 * ComfyUI Type Definitions
 * 
 * Type definitions for ComfyUI's app, canvas, and graph APIs.
 * Aligned with ComfyUI frontend types.
 */

// ============================================================================
// ComfyUI App
// ============================================================================

export interface ComfyApp {
    graph: ComfyGraph;
    canvas: ComfyCanvas;
    ui: ComfyUI;
    extensionManager: ComfyExtensionManager;
    registerExtension(extension: ComfyExtension): void;
}

export interface ComfyExtension {
    name: string;
    setup?: () => Promise<void> | void;
    init?: () => Promise<void> | void;
    commands?: ComfyCommand[];
    keybindings?: ComfyKeybinding[];
    menuCommands?: ComfyMenuCommand[];
    settings?: ComfySetting[];
    bottomPanelTabs?: ComfyBottomPanelTab[];
    aboutPageBadges?: ComfyBadge[];
    getSelectionToolboxCommands?: (selectedItem: unknown) => string[];
}

export interface ComfyCommand {
    id: string;
    label?: string;
    icon?: string;
    function: () => void;
}

export interface ComfyKeybinding {
    combo: {
        key: string;
        alt?: boolean;
        ctrl?: boolean;
        shift?: boolean;
        meta?: boolean;
    };
    commandId: string;
}

export interface ComfyMenuCommand {
    path: string[];
    commands: string[];
}

export interface ComfySetting {
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

export interface ComfyBottomPanelTab {
    id: string;
    title: string;
    type: 'custom';
    render: (el: HTMLElement) => void;
}

export interface ComfyBadge {
    label: string;
    url: string;
    icon: string;
}

// ============================================================================
// ComfyUI UI
// ============================================================================

export interface ComfyUI {
    settings: ComfySettings;
}

export interface ComfySettings {
    addSetting(setting: ComfySetting): void;
    getSettingValue(id: string): unknown;
    setSettingValue(id: string, value: unknown): void;
}

// ============================================================================
// ComfyUI Extension Manager
// ============================================================================

export interface ComfyExtensionManager {
    setting: {
        get(id: string): unknown;
        set(id: string, value: unknown): void;
    };
    toast: ComfyToast;
    dialog: ComfyDialog;
    registerSidebarTab(tab: ComfySidebarTab): void;
}

export interface ComfySidebarTab {
    id: string;
    icon: string;
    title: string;
    tooltip: string;
    type: 'custom';
    render: (el: HTMLElement) => void;
}

export interface ComfyToast {
    add(options: ComfyToastOptions): void;
    addAlert(message: string): void;
}

export interface ComfyToastOptions {
    severity: 'success' | 'info' | 'warn' | 'error';
    summary: string;
    detail: string;
    life?: number;
}

export interface ComfyDialog {
    prompt(options: { title: string; message: string }): Promise<string>;
    confirm(options: { title: string; message: string }): Promise<boolean>;
}

// ============================================================================
// ComfyUI Canvas
// ============================================================================

export interface ComfyCanvas {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    ds: {
        scale: number;
        offset: [number, number];
    };
    graph: ComfyGraph;
    selected_nodes: Record<number, ComfyNode>;
    node_over: ComfyNode | null;
    last_mouse_position: [number, number];
    visible_area: [number, number, number, number];
    connecting_node: ComfyNode | null;
    connecting_output: ComfySlot | null;
    connecting_input: ComfySlot | null;
    draw_connections?: boolean;
    render_canvas_border?: boolean;
    setDirty(foreground?: boolean, background?: boolean): void;
    convertEventToCanvasOffset(e: MouseEvent): [number, number];
    computeVisibleNodes(): ComfyNode[];
    bringToFront(node: ComfyNode): void;
    centerOnNode(node: ComfyNode): void;
    selectNode(node: ComfyNode, add?: boolean): void;
    deselectNode(node: ComfyNode): void;
    deselectAllNodes(): void;
    processMouseDown(e: MouseEvent): void;
    processMouseMove(e: MouseEvent): void;
    processMouseUp(e: MouseEvent): void;
}

// ============================================================================
// ComfyUI Graph
// ============================================================================

export interface ComfyGraph {
    _nodes: ComfyNode[];
    _nodes_by_id: Record<number, ComfyNode>;
    _links: Record<number, ComfyLink>;
    list_of_graphcanvas: ComfyCanvas[];
    getNodeById(id: number): ComfyNode | null;
    findNodesByType(type: string): ComfyNode[];
    findNodesByTitle(title: string): ComfyNode[];
    add(node: ComfyNode): void;
    remove(node: ComfyNode): void;
    clear(): void;
    serialize(): object;
    configure(data: object): void;
}

// ============================================================================
// ComfyUI Node
// ============================================================================

export interface ComfyNode {
    id: number;
    type: string;
    title: string;
    pos: [number, number];
    size: [number, number];
    flags: {
        collapsed?: boolean;
        pinned?: boolean;
    };
    mode: number;
    order: number;
    bgcolor?: string;
    color?: string;
    inputs: ComfySlot[];
    outputs: ComfySlot[];
    widgets?: ComfyWidget[];
    widgets_values?: unknown[];
    properties: Record<string, unknown>;
    graph: ComfyGraph;
    is_selected?: boolean;

    getInputNode(slot: number): ComfyNode | null;
    getOutputNodes(slot: number): ComfyNode[];
    connect(outputSlot: number, targetNode: ComfyNode, targetSlot: number): ComfyLink | null;
    disconnectInput(slot: number): void;
    disconnectOutput(slot: number, targetNode?: ComfyNode): void;
    addInput(name: string, type: string, extra_info?: object): void;
    addOutput(name: string, type: string, extra_info?: object): void;
    removeInput(slot: number): void;
    removeOutput(slot: number): void;
    collapse(force?: boolean): void;
    pin(v?: boolean): void;
    setProperty(name: string, value: unknown): void;
    getTitle(): string;
    onExecuted?(output: unknown): void;
    onRemoved?(): void;
    onAdded?(graph: ComfyGraph): void;
    onStart?(): void;
    onStop?(): void;
    onDrawBackground?(ctx: CanvasRenderingContext2D): void;
    onDrawForeground?(ctx: CanvasRenderingContext2D): void;
    onMouseDown?(e: MouseEvent, pos: [number, number], graphCanvas: ComfyCanvas): boolean | void;
    onMouseMove?(e: MouseEvent, pos: [number, number], graphCanvas: ComfyCanvas): boolean | void;
    onMouseUp?(e: MouseEvent, pos: [number, number], graphCanvas: ComfyCanvas): boolean | void;
    onDblClick?(e: MouseEvent, pos: [number, number], graphCanvas: ComfyCanvas): void;
    onKeyDown?(e: KeyboardEvent): boolean | void;
    onKeyUp?(e: KeyboardEvent): boolean | void;
}

// ============================================================================
// ComfyUI Slots and Links
// ============================================================================

export interface ComfySlot {
    name: string;
    type: string;
    link: number | null;
    links?: number[];
    slot_index?: number;
    color_on?: string;
    color_off?: string;
    shape?: number;
}

export interface ComfyLink {
    id: number;
    type: string;
    origin_id: number;
    origin_slot: number;
    target_id: number;
    target_slot: number;
    color?: string;
}

// ============================================================================
// ComfyUI Widgets
// ============================================================================

export interface ComfyWidget {
    name: string;
    type: string;
    value: unknown;
    options?: Record<string, unknown>;
    callback?: (value: unknown) => void;
    computeSize?(width: number): [number, number];
    draw?(ctx: CanvasRenderingContext2D, node: ComfyNode, width: number, posY: number, height: number): void;
    mouse?(event: MouseEvent, pos: [number, number], node: ComfyNode): boolean;
}

// ============================================================================
// LiteGraph Types
// ============================================================================

export interface LiteGraph {
    NODE_TITLE_HEIGHT: number;
    NODE_SLOT_HEIGHT: number;
    NODE_WIDGET_HEIGHT: number;
    NODE_TITLE_TEXT_Y: number;
    DEFAULT_BACKGROUND_IMAGE: string;
    LINK_COLOR: string;
    connecting_link_color: string;
    node_colors: Record<string, { color: string; bgcolor: string }>;
    registerNodeType(type: string, nodeClass: new () => ComfyNode): void;
    createNode(type: string): ComfyNode | null;
}

declare global {
    const LiteGraph: LiteGraph;
}
