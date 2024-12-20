// comfy-react-integration.js
import { app } from "../../../../scripts/app.js";

// Export the minimal React implementation for offline use
export async function loadReactDependencies() {
    try {
        // Create isolated state container
        const ReactState = {
            currentComponent: null,
            states: new Map(),
            updateQueued: false,
            updateTimeout: null,
            initialized: false
        };

        // Create MiniReact object with error boundaries
        const MiniReact = {
            createElement(type, props = {}, ...children) {
                try {
                    return { type, props: { ...props, children: children.flat() } };
                } catch (e) {
                    console.warn("createElement error:", e);
                    return { type: 'div', props: { children: [] } };
                }
            },
            
            useState(initialValue) {
                try {
                    if (!ReactState.initialized) return [initialValue, () => {}];
                    
                    const state = this._getState();
                    if (!state.hasOwnProperty('value')) {
                        state.value = typeof initialValue === 'function' ? initialValue() : initialValue;
                    }
                    
                    const setState = (newValue) => {
                        try {
                            const nextValue = typeof newValue === 'function' ? newValue(state.value) : newValue;
                            if (JSON.stringify(state.value) !== JSON.stringify(nextValue)) {
                                state.value = nextValue;
                                this._queueUpdate();
                            }
                        } catch (e) {
                            console.warn("setState error:", e);
                        }
                    };
                    
                    return [state.value, setState];
                } catch (e) {
                    console.warn("useState error:", e);
                    return [initialValue, () => {}];
                }
            },

            useCallback(callback) {
                return callback;
            },

            useEffect(effect, deps) {
                try {
                    if (!ReactState.initialized) return;
                    
                    const state = this._getState();
                    if (!state.effects) state.effects = new Map();
                    
                    const currentDeps = state.effects.get(effect);
                    const depsChanged = !currentDeps || !deps || 
                        deps.some((dep, i) => dep !== currentDeps[i]);
                    
                    if (depsChanged) {
                        if (state.cleanup) {
                            try {
                                state.cleanup();
                            } catch (e) {
                                console.warn("Effect cleanup error:", e);
                            }
                        }
                        try {
                            state.cleanup = effect();
                            state.effects.set(effect, deps);
                        } catch (e) {
                            console.warn("Effect execution error:", e);
                        }
                    }
                } catch (e) {
                    console.warn("useEffect error:", e);
                }
            },

            useMemo(factory) {
                try {
                    return factory();
                } catch (e) {
                    console.warn("useMemo error:", e);
                    return null;
                }
            },

            memo(component) {
                return component;
            },
            
            _getState() {
                try {
                    if (!ReactState.states.has(ReactState.currentComponent)) {
                        ReactState.states.set(ReactState.currentComponent, {});
                    }
                    return ReactState.states.get(ReactState.currentComponent);
                } catch (e) {
                    console.warn("_getState error:", e);
                    return {};
                }
            },
            
            _queueUpdate() {
                try {
                    if (!ReactState.updateQueued && ReactState.currentComponent) {
                        ReactState.updateQueued = true;
                        if (ReactState.updateTimeout) {
                            clearTimeout(ReactState.updateTimeout);
                        }
                        ReactState.updateTimeout = setTimeout(() => {
                            try {
                                if (ReactState.currentComponent?._update) {
                                    ReactState.currentComponent._update();
                                }
                            } catch (e) {
                                console.warn("Update error:", e);
                            } finally {
                                ReactState.updateQueued = false;
                                ReactState.updateTimeout = null;
                            }
                        }, 0);
                    }
                } catch (e) {
                    console.warn("_queueUpdate error:", e);
                }
            }
        };

        // Create MiniReactDOM object with error handling
        const MiniReactDOM = {
            createRoot(container) {
                return {
                    render(element) {
                        try {
                            ReactState.initialized = true;
                            
                            const renderElement = (el) => {
                                try {
                                    if (!el) return null;
                                    
                                    if (typeof el === 'string' || typeof el === 'number') {
                                        return document.createTextNode(el);
                                    }
                                    
                                    if (typeof el.type === 'function') {
                                        const component = {
                                            _update: () => {
                                                try {
                                                    const oldNode = component._node;
                                                    const prevComponent = ReactState.currentComponent;
                                                    ReactState.currentComponent = component;
                                                    const newElement = el.type(el.props);
                                                    const newNode = renderElement(newElement);
                                                    if (oldNode?.parentNode) {
                                                        oldNode.parentNode.replaceChild(newNode, oldNode);
                                                    }
                                                    component._node = newNode;
                                                    ReactState.currentComponent = prevComponent;
                                                } catch (e) {
                                                    console.warn("Component update error:", e);
                                                }
                                            }
                                        };
                                        
                                        const prevComponent = ReactState.currentComponent;
                                        ReactState.currentComponent = component;
                                        const rendered = el.type(el.props);
                                        component._node = renderElement(rendered);
                                        ReactState.currentComponent = prevComponent;
                                        return component._node;
                                    }
                                    
                                    const node = document.createElement(el.type);
                                    
                                    Object.entries(el.props || {}).forEach(([key, value]) => {
                                        try {
                                            if (key === 'style' && typeof value === 'object') {
                                                Object.assign(node.style, value);
                                            } else if (key === 'children') {
                                                value.forEach(child => {
                                                    const childNode = renderElement(child);
                                                    if (childNode) node.appendChild(childNode);
                                                });
                                            } else if (key.startsWith('on') && typeof value === 'function') {
                                                node.addEventListener(key.toLowerCase().slice(2), value);
                                            } else if (typeof value !== 'object' && key !== 'children') {
                                                node.setAttribute(key, value);
                                            }
                                        } catch (e) {
                                            console.warn("Property application error:", e);
                                        }
                                    });
                                    
                                    return node;
                                } catch (e) {
                                    console.warn("renderElement error:", e);
                                    return document.createElement('div');
                                }
                            };
                            
                            container.innerHTML = '';
                            container.appendChild(renderElement(element));
                        } catch (e) {
                            console.error("Render error:", e);
                        }
                    },
                    unmount() {
                        try {
                            ReactState.initialized = false;
                            container.innerHTML = '';
                            ReactState.states.clear();
                            if (ReactState.updateTimeout) {
                                clearTimeout(ReactState.updateTimeout);
                                ReactState.updateTimeout = null;
                            }
                        } catch (e) {
                            console.warn("Unmount error:", e);
                        }
                    }
                };
            }
        };

        return {
            React: MiniReact,
            ReactDOM: MiniReactDOM
        };
    } catch (e) {
        console.error("React dependencies loading error:", e);
        // Return a dummy implementation that won't break other extensions
        return {
            React: {
                createElement: () => ({ type: 'div', props: { children: [] } }),
                useState: (init) => [init, () => {}],
                useCallback: (cb) => cb,
                useEffect: () => {},
                useMemo: (f) => f(),
                memo: (c) => c
            },
            ReactDOM: {
                createRoot: () => ({
                    render: () => {},
                    unmount: () => {}
                })
            }
        };
    }
}
