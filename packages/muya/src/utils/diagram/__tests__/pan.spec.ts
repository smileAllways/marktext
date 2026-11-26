// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DIAGRAM_PAN_THRESHOLD, DIAGRAM_PANNING_ROOT_CLASS, startDiagramPan } from '../pan';

const hosts: HTMLElement[] = [];

afterEach(() => {
    while (hosts.length) hosts.pop()!.remove();
    document.documentElement.classList.remove(DIAGRAM_PANNING_ROOT_CLASS);
    vi.useRealTimers();
});

// happy-dom has no layout, so scroll offsets are plain recorded values here.
function makeScrollable(el: HTMLElement, left = 0, top = 0) {
    let scrollLeft = left;
    let scrollTop = top;
    Object.defineProperty(el, 'scrollLeft', {
        get: () => scrollLeft,
        set: (v: number) => {
            scrollLeft = v;
        },
        configurable: true,
    });
    Object.defineProperty(el, 'scrollTop', {
        get: () => scrollTop,
        set: (v: number) => {
            scrollTop = v;
        },
        configurable: true,
    });
}

function setup() {
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    Object.defineProperty(scroller, 'scrollHeight', { value: 5000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 500 });
    makeScrollable(scroller, 0, 1000);

    const preview = document.createElement('div');
    makeScrollable(preview, 200);
    scroller.appendChild(preview);
    document.body.appendChild(scroller);
    hosts.push(scroller);
    return { scroller, preview };
}

function mouse(type: string, x: number, y: number) {
    return new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
}

describe('diagram pan', () => {
    it('ignores movement within the click threshold', () => {
        const { preview, scroller } = setup();
        startDiagramPan(preview, mouse('mousedown', 100, 100));
        window.dispatchEvent(mouse('mousemove', 100 + DIAGRAM_PAN_THRESHOLD - 1, 100));

        expect(preview.scrollLeft).toBe(200);
        expect(scroller.scrollTop).toBe(1000);
        expect(document.documentElement.classList.contains(DIAGRAM_PANNING_ROOT_CLASS)).toBe(false);
        window.dispatchEvent(mouse('mouseup', 100, 100));
    });

    it('scrolls the preview sideways and the editor vertically, opposite to the drag', () => {
        const { preview, scroller } = setup();
        startDiagramPan(preview, mouse('mousedown', 100, 100));
        window.dispatchEvent(mouse('mousemove', 60, 130));

        expect(preview.scrollLeft).toBe(240);
        expect(scroller.scrollTop).toBe(970);
        expect(document.documentElement.classList.contains(DIAGRAM_PANNING_ROOT_CLASS)).toBe(true);

        window.dispatchEvent(mouse('mouseup', 60, 130));
        expect(document.documentElement.classList.contains(DIAGRAM_PANNING_ROOT_CLASS)).toBe(false);
    });

    it('keeps the drag\'s movement away from the editor', () => {
        const { preview } = setup();
        const editorMove = vi.fn();
        document.body.addEventListener('mousemove', editorMove);
        startDiagramPan(preview, mouse('mousedown', 100, 100));
        preview.dispatchEvent(mouse('mousemove', 150, 100));
        window.dispatchEvent(mouse('mouseup', 150, 100));
        document.body.removeEventListener('mousemove', editorMove);

        expect(editorMove).not.toHaveBeenCalled();
    });

    it('swallows the click that ends a drag', () => {
        const { preview } = setup();
        const onClick = vi.fn();
        preview.addEventListener('click', onClick);
        startDiagramPan(preview, mouse('mousedown', 100, 100));
        window.dispatchEvent(mouse('mousemove', 150, 100));
        preview.dispatchEvent(mouse('mouseup', 150, 100));
        preview.dispatchEvent(mouse('click', 150, 100));

        expect(onClick).not.toHaveBeenCalled();
    });

    it('lets a plain click (no drag) through', () => {
        const { preview } = setup();
        const onClick = vi.fn();
        preview.addEventListener('click', onClick);
        startDiagramPan(preview, mouse('mousedown', 100, 100));
        preview.dispatchEvent(mouse('mouseup', 101, 100));
        preview.dispatchEvent(mouse('click', 101, 100));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not eat a later click when the drag ended outside the diagram', () => {
        vi.useFakeTimers();
        const { preview } = setup();
        startDiagramPan(preview, mouse('mousedown', 100, 100));
        window.dispatchEvent(mouse('mousemove', 300, 100));
        window.dispatchEvent(mouse('mouseup', 300, 100));
        vi.runAllTimers();

        const onClick = vi.fn();
        document.body.addEventListener('click', onClick);
        document.body.dispatchEvent(mouse('click', 10, 10));
        document.body.removeEventListener('click', onClick);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
