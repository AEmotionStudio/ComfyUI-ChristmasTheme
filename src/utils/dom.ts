
interface ElementProps {
    className?: string;
    style?: Partial<CSSStyleDeclaration>;
    dataset?: Record<string, string>;
    [key: string]: any;
}

/**
 * Helper to create DOM elements with less boilerplate
 */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: ElementProps = {},
    children: (string | Node | (string | Node)[])[] = []
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    // Handle props
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined) continue;

        if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(element.dataset, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.toLowerCase().substring(2);
            element.addEventListener(eventName, value as EventListener);
        } else {
            // @ts-ignore
            element[key] = value;
        }
    }

    // Handle children (flatten one level to allow passing arrays)
    children.flat().forEach(child => {
        if (child === null || child === undefined) return;

        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}
