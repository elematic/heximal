import {
  HeximalElement,
  css,
  customElement,
  html,
  property,
} from '@heximal/element';
import {getScope} from '@heximal/components';
import {HeximalSlide} from './slide.js';
import {HeximalSlideTheme} from './slide-theme.js';
import {radicaStyles} from './styles.js';
import {PresentationTimer, presentationTimer} from './timer.js';

export interface SlideChangeEventDetail {
  index: number;
  step: number;
  slide: HeximalSlide | null;
}

@customElement('h-slide-deck')
export class HeximalSlideDeck extends HeximalElement {
  static override styles = [
    ...radicaStyles,
    css`
      :host {
        display: flex;
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 400px;
        background-color: var(--h-slide-deck-bg, var(--rad-color-neutral-950));
        color: var(--h-slide-deck-color, var(--rad-color-neutral-0));
        outline: none;
        overflow: hidden;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }

      #stage {
        position: relative;
        width: calc(var(--h-slide-width, 1920) * 1px);
        height: calc(var(--h-slide-height, 1080) * 1px);
        transform: scale(var(--h-slide-scale, 1));
        transform-origin: center center;
        flex: 0 0 auto;
        box-shadow: var(--rad-shadow-6);
        background: var(--rad-color-neutral-1000);
      }

      #progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: var(--rad-border-size-3);
        background: var(--h-slide-accent, var(--rad-color-blue-500));
        transition: width 0.2s ease;
        z-index: 101;
      }
    `,
  ];

  @property({attribute: 'aspect-ratio', reflect: true})
  accessor aspectRatio: string | undefined;

  @property({type: Number})
  accessor width: number = 1920;

  @property({type: Number})
  accessor height: number = 1080;

  @property({type: Number, reflect: true})
  accessor index: number = 0;

  @property({type: Boolean, reflect: true})
  accessor blackout: boolean = false;

  readonly timer: PresentationTimer = presentationTimer;

  #scope?: Record<string, unknown>;

  get scope(): Record<string, unknown> | undefined {
    if (this.#scope === undefined && this.isConnected) {
      const outerScope = this.parentNode
        ? getScope(this.parentNode)
        : undefined;
      this.#scope = Object.create(outerScope ?? null);
      this.#scope!.timer = this.timer;
    }
    return this.#scope;
  }

  #resizeObserver?: ResizeObserver;
  #channel?: BroadcastChannel;

  get slides(): HeximalSlide[] {
    const list: HeximalSlide[] = [];
    const collect = (node: Element) => {
      for (const child of node.children) {
        if (
          child instanceof HeximalSlideTheme ||
          child.tagName === 'H-SLIDE-THEME'
        ) {
          continue;
        }
        if (child instanceof HeximalSlide) {
          list.push(child);
        } else {
          collect(child);
        }
      }
    };
    collect(this);
    return list;
  }

  get length(): number {
    return this.slides.length;
  }

  get currentSlide(): HeximalSlide | null {
    return this.slides[this.index] ?? null;
  }

  get theme(): HeximalSlideTheme | null {
    return this.querySelector('h-slide-theme');
  }

  indexOf(slide: HeximalSlide): number {
    return this.slides.indexOf(slide);
  }

  override connectedCallback() {
    super.connectedCallback();

    void this.scope;

    this.setAttribute('tabindex', this.getAttribute('tabindex') || '0');
    window.addEventListener('keydown', this.#onKeyDown);

    if (this.aspectRatio !== undefined) {
      this.#parseAspectRatio(this.aspectRatio);
    }

    this.#resizeObserver = new ResizeObserver(() => this.#updateScale());
    this.#resizeObserver.observe(this);

    if (typeof BroadcastChannel !== 'undefined') {
      this.#channel = new BroadcastChannel('heximal-slides');
      this.#channel.onmessage = (event) => {
        if (
          event.data?.type === 'goto' &&
          typeof event.data.index === 'number'
        ) {
          this.goto(event.data.index, false);
          if (typeof event.data.step === 'number' && this.currentSlide) {
            this.currentSlide.step = event.data.step;
            this.#notifySlideChanged(false);
          }
        } else if (event.data?.type === 'request-sync') {
          this.#channel?.postMessage({
            type: 'goto',
            index: this.index,
            step: this.currentSlide?.step ?? 0,
          });
          this.#channel?.postMessage(this.timer.getSyncState());
        }
      };
    }

    window.addEventListener('hashchange', this.#onHashChange);
    this.#route();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.#onKeyDown);
    this.#resizeObserver?.disconnect();
    this.#channel?.close();
    window.removeEventListener('hashchange', this.#onHashChange);
    this.#scope = undefined;
  }

  #parseAspectRatio(ratioStr: string) {
    const parts = ratioStr.split(/[/:]/).map((s) => parseFloat(s.trim()));
    if (
      parts.length === 2 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      parts[1] !== 0
    ) {
      const ratio = parts[0] / parts[1];
      this.height = 1080;
      this.width = Math.round(1080 * ratio);
    }
  }

  #updateScale() {
    const deckWidth = this.clientWidth || this.offsetWidth;
    const deckHeight = this.clientHeight || this.offsetHeight;
    if (deckWidth === 0 || deckHeight === 0) {
      return;
    }
    const scale = Math.min(deckWidth / this.width, deckHeight / this.height);
    this.style.setProperty('--h-slide-width', String(this.width));
    this.style.setProperty('--h-slide-height', String(this.height));
    this.style.setProperty('--h-slide-scale', String(scale));
  }

  #updateSlideVisibility() {
    let i = 0;
    for (const slide of this.slides) {
      slide.visible = i === this.index;
      slide.toggleAttribute('visible', i === this.index);
      i++;
    }
  }

  override willUpdate() {
    this.#updateSlideVisibility();
  }

  override render() {
    const progressPercent =
      this.length > 1 ? (this.index / (this.length - 1)) * 100 : 100;
    return html`
      <div id="stage" style="${this.blackout ? 'opacity: 0;' : ''}">
        <slot></slot>
      </div>
      <div id="progress" style="width: ${progressPercent}%;"></div>
    `;
  }

  #notifySlideChanged(broadcast = true) {
    const step = this.currentSlide?.step ?? 0;
    this.dispatchEvent(
      new CustomEvent<SlideChangeEventDetail>('slide-changed', {
        bubbles: true,
        composed: true,
        detail: {index: this.index, step, slide: this.currentSlide},
      }),
    );
    if (broadcast && this.#channel) {
      this.#channel.postMessage({type: 'goto', index: this.index, step});
    }
  }

  goto(index: number, broadcast = true) {
    if (this.length === 0) {
      this.index = 0;
      return;
    }
    const target = Math.max(0, Math.min(index, this.length - 1));
    if (target !== this.index) {
      this.index = target;
      this.#updateSlideVisibility();
      this.#syncHash();
      if (
        document.activeElement === document.body ||
        document.activeElement === null
      ) {
        this.focus({preventScroll: true});
      }
      this.#notifySlideChanged(broadcast);
    }
  }

  gotoSlide(nameOrId: string) {
    const slides = this.slides;
    const idx = slides.findIndex(
      (s) => s.name === nameOrId || s.id === nameOrId,
    );
    if (idx !== -1) {
      this.goto(idx);
    }
  }

  next() {
    const slide = this.currentSlide;
    if (slide?.next()) {
      this.#notifySlideChanged(true);
      return;
    }
    if (this.index < this.length - 1) {
      this.goto(this.index + 1);
    }
  }

  previous() {
    const slide = this.currentSlide;
    if (slide?.previous()) {
      this.#notifySlideChanged(true);
      return;
    }
    if (this.index > 0) {
      this.goto(this.index - 1);
    }
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  #syncHash() {
    const slide = this.currentSlide;
    const hash = slide?.name ? `#${slide.name}` : `#${this.index + 1}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, '', hash);
    }
  }

  #route() {
    const hash = window.location.hash;
    if (hash.startsWith('#')) {
      const value = hash.substring(1);
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        this.goto(num - 1, false);
        return;
      }
      this.gotoSlide(value);
    }
  }

  #onHashChange = () => {
    this.#route();
  };

  #onKeyDown = (event: KeyboardEvent) => {
    if (
      this.closest('h-slide-presenter') !== null ||
      this.closest('h-slide-viewer[presenter]') !== null
    ) {
      return;
    }
    const target = event.composedPath()[0] as HTMLElement | undefined;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    switch (event.key) {
      case 'ArrowLeft':
      case 'PageUp':
        this.previous();
        break;
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        this.next();
        break;
      case 'Home':
        this.goto(0);
        break;
      case 'End':
        this.goto(this.length - 1);
        break;
      case 'f':
        if (!event.metaKey && !event.ctrlKey) {
          this.toggleFullscreen();
        }
        break;
      case 'b':
        this.blackout = !this.blackout;
        break;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-deck': HeximalSlideDeck;
  }
}
