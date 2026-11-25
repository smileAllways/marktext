// Inline zoom for a rendered diagram preview. The factor is relative to the
// fitted size the preview already uses, so 1 means "as rendered".
export const MIN_DIAGRAM_ZOOM = 0.25;
export const MAX_DIAGRAM_ZOOM = 5;

// Exponential scaling: a mouse wheel notch (deltaY ≈ 100px) is ~22%, while the
// small deltas of a touchpad pinch still zoom smoothly.
const ZOOM_PER_PIXEL = 0.002;
const PIXELS_PER_LINE = 33;
const DOM_DELTA_LINE = 1;

export const DIAGRAM_ZOOMED_CLASS = 'mu-diagram-zoomed';
export const DIAGRAM_ZOOM_BADGE_CLASS = 'mu-diagram-zoom-badge';

// The renderer's own inline max-width (mermaid writes one) is kept here so a
// reset to 100% restores the original fitted layout.
const ORIGINAL_MAX_WIDTH = 'muZoomMaxWidth';

export function isDiagramZoomGesture(event: Pick<WheelEvent, 'ctrlKey' | 'metaKey'>): boolean {
    return Boolean(event.ctrlKey || event.metaKey);
}

export function nextDiagramZoom(current: number, event: Pick<WheelEvent, 'deltaY' | 'deltaMode'>): number {
    const pixels = event.deltaMode === DOM_DELTA_LINE
        ? event.deltaY * PIXELS_PER_LINE
        : event.deltaY;
    const next = current * Math.exp(-pixels * ZOOM_PER_PIXEL);
    const clamped = Math.min(MAX_DIAGRAM_ZOOM, Math.max(MIN_DIAGRAM_ZOOM, next));

    // Snap back to exactly 1 so zooming out and in again restores the fitted layout.
    return Math.abs(clamped - 1) < 0.02 ? 1 : Math.round(clamped * 100) / 100;
}

function naturalWidth(media: Element): number {
    if (media instanceof HTMLImageElement)
        return media.naturalWidth;

    const viewBox = (media.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/);
    const viewBoxWidth = Number.parseFloat(viewBox[2] ?? '');
    if (viewBoxWidth > 0)
        return viewBoxWidth;

    const width = Number.parseFloat(media.getAttribute('width') ?? '');
    return width > 0 ? width : 0;
}

function resetMedia(media: HTMLElement | SVGElement) {
    if (!(ORIGINAL_MAX_WIDTH in media.dataset))
        return;

    media.style.removeProperty('width');
    media.style.removeProperty('height');
    media.style.maxWidth = media.dataset[ORIGINAL_MAX_WIDTH] ?? '';
    delete media.dataset[ORIGINAL_MAX_WIDTH];
}

function syncBadge(target: HTMLElement, zoom: number) {
    let badge = target.querySelector<HTMLElement>(`:scope > .${DIAGRAM_ZOOM_BADGE_CLASS}`);
    if (zoom === 1) {
        badge?.remove();
        return;
    }

    if (!badge) {
        badge = document.createElement('span');
        badge.className = DIAGRAM_ZOOM_BADGE_CLASS;
        badge.setAttribute('role', 'button');
        target.appendChild(badge);
    }
    badge.textContent = `${Math.round(zoom * 100)}% ⟲`;
}

// Re-run after every render: a render replaces the preview's children, so the
// sizing override and the badge must be applied to the new media again.
export function applyDiagramZoom(target: HTMLElement, zoom: number): void {
    const media = target.querySelector<HTMLElement | SVGElement>('svg, img');
    const width = media ? naturalWidth(media) : 0;

    target.classList.toggle(DIAGRAM_ZOOMED_CLASS, zoom !== 1 && width > 0);
    syncBadge(target, width > 0 ? zoom : 1);

    if (!media)
        return;

    if (zoom === 1 || width <= 0) {
        resetMedia(media);
        return;
    }

    if (!(ORIGINAL_MAX_WIDTH in media.dataset))
        media.dataset[ORIGINAL_MAX_WIDTH] = media.style.maxWidth;

    // `min(100%, natural)` is the size the preview fits the diagram to at 100%,
    // so the zoom keeps following the editor width when the window resizes.
    media.style.width = `calc(min(100%, ${width}px) * ${zoom})`;
    media.style.maxWidth = 'none';
    media.style.height = 'auto';
}
