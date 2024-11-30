import {
  HeximalElement,
  css,
  customElement,
  nothing,
  property,
} from '@heximal/element';
import {HeximalSlide} from './slide.js';

export function getPreviewDepth(el: Element): number {
  let depth = 0;
  let node: Node | null =
    el.parentNode ?? (el.getRootNode() as ShadowRoot)?.host ?? null;
  while (node) {
    if (
      node instanceof Element &&
      node.tagName.toLowerCase() === 'h-slide-preview'
    ) {
      depth++;
    }
    if (node.parentNode) {
      node = node.parentNode;
    } else if (node instanceof ShadowRoot) {
      node = node.host;
    } else {
      node = null;
    }
  }
  return depth;
}

@customElement('h-slide-preview')
export class HeximalSlidePreview extends HeximalElement {
  static override styles = css`
    :where(:host) {
      display: block;
      box-sizing: border-box;
      position: absolute;
      top: 50%;
      left: 50%;
      width: calc(var(--h-slide-width, 1920) * 1px);
      height: calc(var(--h-slide-height, 1080) * 1px);
      transform: translate(-50%, -50%) scale(var(--h-slide-preview-scale, 0.25));
      transform-origin: center center;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
      background: #fff;
      pointer-events: none;
      user-select: none;
    }
  `;

  @property({attribute: false})
  accessor slide: HeximalSlide | null = null;

  @property({type: Number})
  accessor step: number | undefined;

  #resizeObserver?: ResizeObserver;

  override connectedCallback() {
    super.connectedCallback();
    this.#resizeObserver = new ResizeObserver(() => this.#updateScale());
    if (this.parentElement) {
      this.#resizeObserver.observe(this.parentElement);
    }
    this.#updateScale();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver?.disconnect();
  }

  override updated() {
    this.#updateScale();
  }

  #updateScale() {
    const parent = this.parentElement;
    if (!parent) {
      return;
    }
    const deck = this.slide?.deck;
    const width = deck?.width ?? 1920;
    const height = deck?.height ?? 1080;
    const style = getComputedStyle(parent);
    const padX =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0);
    const padY =
      (parseFloat(style.paddingTop) || 0) +
      (parseFloat(style.paddingBottom) || 0);
    const availW = Math.max(0, parent.clientWidth - padX);
    const availH = Math.max(0, parent.clientHeight - padY);
    if (availW === 0 || availH === 0) {
      return;
    }
    const scale = Math.min(availW / width, availH / height);
    this.style.setProperty('--h-slide-width', String(width));
    this.style.setProperty('--h-slide-height', String(height));
    this.style.setProperty('--h-slide-preview-scale', String(scale));
  }

  override render() {
    if (!this.slide || getPreviewDepth(this) >= 2) {
      return nothing;
    }
    return this.slide.renderSlideContent(this.step);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-preview': HeximalSlidePreview;
  }
}
