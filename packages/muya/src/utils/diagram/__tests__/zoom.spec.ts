// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import {
    applyDiagramZoom,
    DIAGRAM_ZOOM_BADGE_CLASS,
    DIAGRAM_ZOOMED_CLASS,
    isDiagramZoomGesture,
    MAX_DIAGRAM_ZOOM,
    MIN_DIAGRAM_ZOOM,
    nextDiagramZoom,
} from '../zoom';

const hosts: HTMLElement[] = [];

afterEach(() => {
    while (hosts.length) hosts.pop()!.remove();
});

function makePreview(svgMarkup: string): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = svgMarkup;
    document.body.appendChild(host);
    hosts.push(host);
    return host;
}

const MERMAID_SVG = '<svg viewBox="0 0 800 400" width="100%" style="max-width: 800px;"></svg>';

describe('diagram zoom — gesture', () => {
    it('only treats Ctrl/Cmd + wheel as a zoom gesture', () => {
        expect(isDiagramZoomGesture({ ctrlKey: true, metaKey: false })).toBe(true);
        expect(isDiagramZoomGesture({ ctrlKey: false, metaKey: true })).toBe(true);
        expect(isDiagramZoomGesture({ ctrlKey: false, metaKey: false })).toBe(false);
    });

    it('zooms in on wheel up and out on wheel down', () => {
        expect(nextDiagramZoom(1, { deltaY: -100, deltaMode: 0 })).toBeGreaterThan(1);
        expect(nextDiagramZoom(1, { deltaY: 100, deltaMode: 0 })).toBeLessThan(1);
    });

    it('treats line-mode deltas like a pixel wheel notch', () => {
        const pixel = nextDiagramZoom(1, { deltaY: -99, deltaMode: 0 });
        const line = nextDiagramZoom(1, { deltaY: -3, deltaMode: 1 });
        expect(line).toBe(pixel);
    });

    it('clamps to the supported range', () => {
        expect(nextDiagramZoom(MAX_DIAGRAM_ZOOM, { deltaY: -1000, deltaMode: 0 })).toBe(MAX_DIAGRAM_ZOOM);
        expect(nextDiagramZoom(MIN_DIAGRAM_ZOOM, { deltaY: 1000, deltaMode: 0 })).toBe(MIN_DIAGRAM_ZOOM);
    });

    it('returns to exactly 100% after zooming in and back out', () => {
        const zoomed = nextDiagramZoom(1, { deltaY: -100, deltaMode: 0 });
        expect(nextDiagramZoom(zoomed, { deltaY: 100, deltaMode: 0 })).toBe(1);
    });
});

describe('diagram zoom — DOM', () => {
    it('scales the svg from its fitted width and shows a badge', () => {
        const host = makePreview(MERMAID_SVG);
        applyDiagramZoom(host, 1.5);

        const svg = host.querySelector('svg')!;
        expect(svg.style.width).toBe('calc(min(100%, 800px) * 1.5)');
        expect(svg.style.maxWidth).toBe('none');
        expect(host.classList.contains(DIAGRAM_ZOOMED_CLASS)).toBe(true);
        expect(host.querySelector(`.${DIAGRAM_ZOOM_BADGE_CLASS}`)!.textContent).toContain('150%');
    });

    it('restores the renderer\'s own sizing when reset to 100%', () => {
        const host = makePreview(MERMAID_SVG);
        applyDiagramZoom(host, 2);
        applyDiagramZoom(host, 1);

        const svg = host.querySelector('svg')!;
        expect(svg.style.width).toBe('');
        expect(svg.style.maxWidth).toBe('800px');
        expect(host.classList.contains(DIAGRAM_ZOOMED_CLASS)).toBe(false);
        expect(host.querySelector(`.${DIAGRAM_ZOOM_BADGE_CLASS}`)).toBeNull();
    });

    it('falls back to the width attribute when there is no viewBox', () => {
        const host = makePreview('<svg width="300" height="100"></svg>');
        applyDiagramZoom(host, 2);
        expect(host.querySelector('svg')!.style.width).toBe('calc(min(100%, 300px) * 2)');
    });

    it('leaves non-diagram content (error / empty states) untouched', () => {
        const host = makePreview('<div class="mu-diagram-error">bad</div>');
        applyDiagramZoom(host, 2);
        expect(host.classList.contains(DIAGRAM_ZOOMED_CLASS)).toBe(false);
        expect(host.querySelector(`.${DIAGRAM_ZOOM_BADGE_CLASS}`)).toBeNull();
    });
});
