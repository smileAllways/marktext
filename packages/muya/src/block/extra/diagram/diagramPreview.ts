import type { Muya } from '../../../muya';
import type { IDiagramState, TState } from '../../../state/types';
import type { IPreviewDiagramPayload } from '../../../ui/previewToolBar';
import { fromEvent } from 'rxjs';
import { CLASS_NAMES, PREVIEW_DOMPURIFY_CONFIG } from '../../../config';
import { sanitize } from '../../../utils';
import { finalizeRenderedDiagram, renderDiagram } from '../../../utils/diagram/render';
import {
    applyDiagramZoom,
    DIAGRAM_ZOOM_BADGE_CLASS,
    DIAGRAM_ZOOMED_CLASS,
    isDiagramZoomGesture,
    nextDiagramZoom,
} from '../../../utils/diagram/zoom';
import logger from '../../../utils/logger';
import Parent from '../../base/parent';

const debug = logger('diagramPreview:');

class DiagramPreview extends Parent {
    private _code: string;
    private _type: string;
    private _rendered = false;
    private _cancelFinalize: (() => void) | null = null;
    // Kept on the block rather than the DOM so it survives re-renders while editing.
    private _zoom = 1;
    static override blockName = 'diagram-preview';

    static create(muya: Muya, state: IDiagramState) {
        const diagramPreview = new DiagramPreview(muya, state);

        return diagramPreview;
    }

    override get path() {
        debug.warn('You can never call `get path` in diagramPreview');
        return [];
    }

    constructor(muya: Muya, { text, meta }: IDiagramState) {
        super(muya);
        this.tagName = 'div';
        this._code = text;
        this._type = meta.type;
        this.classList = ['mu-diagram-preview'];
        this.attributes = {
            spellcheck: 'false',
            contenteditable: 'false',
        };
        this.createDomNode();
        this._attachDOMEvents();
        this.update();
    }

    override getState(): TState {
        debug.warn('You can never call `getState` in diagramPreview');
        return {} as TState;
    }

    private _attachDOMEvents() {
        const clickObservable = fromEvent(this.domNode!, 'click');
        clickObservable.subscribe(this.clickHandler.bind(this));
        // Not passive: preventing the default keeps Ctrl+wheel from zooming the whole window.
        const wheelObservable = fromEvent<WheelEvent>(this.domNode!, 'wheel', { passive: false });
        wheelObservable.subscribe(this.wheelHandler.bind(this));
    }

    wheelHandler(event: WheelEvent) {
        if (!this._rendered || !isDiagramZoomGesture(event))
            return;

        event.preventDefault();
        event.stopPropagation();

        const zoom = nextDiagramZoom(this._zoom, event);
        if (zoom === this._zoom)
            return;

        // Keep the point under the cursor in place once the zoomed diagram scrolls sideways.
        const node = this.domNode!;
        const offsetX = event.clientX - node.getBoundingClientRect().left;
        const anchorX = node.scrollLeft + offsetX;
        const ratio = zoom / this._zoom;

        this._zoom = zoom;
        applyDiagramZoom(node, zoom);
        node.scrollLeft = Math.max(0, anchorX * ratio - offsetX);
    }

    resetZoom() {
        this._zoom = 1;
        applyDiagramZoom(this.domNode!, 1);
    }

    clickHandler(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const target = event.target;
        if (target instanceof Element && target.closest(`.${DIAGRAM_ZOOM_BADGE_CLASS}`)) {
            this.resetZoom();
            return;
        }

        if (this.muya.isReadOnly) {
            if (this._rendered) {
                this.muya.eventCenter.emit('preview-diagram', {
                    type: this._type,
                    code: this._code,
                    preview: this.domNode!,
                    label: this.domNode!.getAttribute('aria-label'),
                } satisfies IPreviewDiagramPayload);
            }
            return;
        }

        if (this.parent == null)
            return;

        const cursorBlock = this.parent.firstContentInDescendant();
        cursorBlock?.setCursor(0, 0);
    }

    async update(code = this._code) {
        const { i18n } = this.muya;
        this._rendered = false;
        if (this._code !== code)
            this._code = code;

        // A previous render may still be waiting for its `<svg>`; it must not
        // describe whatever this one puts in its place.
        this._cancelFinalize?.();
        this._cancelFinalize = null;
        this.domNode!.removeAttribute('role');
        this.domNode!.removeAttribute('aria-label');
        this.domNode!.classList.remove(DIAGRAM_ZOOMED_CLASS);

        if (code) {
            this.domNode!.innerHTML = i18n.t('Loading...');
            const { mermaidTheme, vegaTheme, plantumlServer, sequenceTheme } = this.muya.options;
            const { _type: type } = this;

            try {
                await renderDiagram({
                    target: this.domNode!,
                    code,
                    type,
                    mermaidTheme,
                    vegaTheme,
                    plantumlServer,
                    sequenceTheme,
                });
                this._rendered = true;
                this._cancelFinalize = finalizeRenderedDiagram(this.domNode!, i18n.t('Diagram'));
                if (this._zoom !== 1)
                    applyDiagramZoom(this.domNode!, this._zoom);
            }
            catch (error) {
                const detail
                    = error instanceof Error ? error.message : String(error);
                debug.error(`render ${type} diagram failed: ${detail}`);
                this.domNode!.innerHTML = `<div class="mu-diagram-error">&lt; ${i18n.t(
                    'Invalid Diagram Code',
                )} &gt;<div class="mu-diagram-error-detail">${sanitize(
                    detail,
                    PREVIEW_DOMPURIFY_CONFIG,
                    true,
                )}</div></div>`;
            }
        }
        else {
            this.domNode!.innerHTML = `<div class="${CLASS_NAMES.MU_EMPTY}">&lt; ${i18n.t(
                'Empty Diagram',
            )} &gt;</div>`;
        }
    }
}

export default DiagramPreview;
