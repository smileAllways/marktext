// Drag-to-pan for a zoomed diagram preview: horizontal movement scrolls the
// preview itself, vertical movement scrolls the editor around it.
export const DIAGRAM_PANNABLE_CLASS = 'mu-diagram-pannable';
export const DIAGRAM_PANNING_ROOT_CLASS = 'mu-diagram-panning';

// Below this distance (px) the gesture stays a click (or half of a double-click).
export const DIAGRAM_PAN_THRESHOLD = 4;

function verticalScroller(node: HTMLElement): HTMLElement | null {
    const view = node.ownerDocument.defaultView;
    for (let el = node.parentElement; el; el = el.parentElement) {
        const { overflowY } = view?.getComputedStyle(el) ?? { overflowY: '' };
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight)
            return el;
    }

    const root = node.ownerDocument.scrollingElement;
    return root instanceof HTMLElement ? root : null;
}

// Owns the gesture from mousedown until mouseup. Listeners sit on the window in
// the capture phase so that, once a drag begins, the editor's own text
// selection and drag-and-drop handlers never see the movement or the release.
export function startDiagramPan(node: HTMLElement, down: MouseEvent): void {
    const doc = node.ownerDocument;
    const win = doc.defaultView;
    if (!win)
        return;

    const scroller = verticalScroller(node);
    const startLeft = node.scrollLeft;
    const startTop = scroller?.scrollTop ?? 0;
    let panning = false;

    const move = (event: MouseEvent) => {
        const dx = event.clientX - down.clientX;
        const dy = event.clientY - down.clientY;
        if (!panning && Math.hypot(dx, dy) < DIAGRAM_PAN_THRESHOLD)
            return;

        if (!panning) {
            panning = true;
            doc.documentElement.classList.add(DIAGRAM_PANNING_ROOT_CLASS);
        }
        event.preventDefault();
        event.stopPropagation();
        node.scrollLeft = startLeft - dx;
        if (scroller)
            scroller.scrollTop = startTop - dy;
    };

    const swallowClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const finish = () => {
        win.removeEventListener('mousemove', move, true);
        win.removeEventListener('mouseup', up, true);
        win.removeEventListener('blur', finish);
        doc.documentElement.classList.remove(DIAGRAM_PANNING_ROOT_CLASS);
    };

    function up(event: MouseEvent) {
        finish();
        if (!panning)
            return;

        event.preventDefault();
        event.stopPropagation();
        // The click that follows this mouseup belongs to the drag, not to the diagram.
        win!.addEventListener('click', swallowClick, { capture: true, once: true });
        // A release outside the diagram produces no click; drop the guard so it
        // can't eat the user's next unrelated click.
        win!.setTimeout(() => win!.removeEventListener('click', swallowClick, true), 0);
    }

    win.addEventListener('mousemove', move, true);
    win.addEventListener('mouseup', up, true);
    win.addEventListener('blur', finish);
}
