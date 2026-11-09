import {
  HeximalElement,
  css,
  customElement,
  html,
  nothing,
  property,
} from '@heximal/element';
import '@radica/bootstrap-icons/icons/arrow-counterclockwise.svg.js';
import '@radica/bootstrap-icons/icons/chevron-left.svg.js';
import '@radica/bootstrap-icons/icons/chevron-right.svg.js';
import '@radica/bootstrap-icons/icons/clock.svg.js';
import '@radica/bootstrap-icons/icons/layout-sidebar.svg.js';
import '@radica/bootstrap-icons/icons/pause-fill.svg.js';
import '@radica/bootstrap-icons/icons/play-fill.svg.js';
import '@radica/bootstrap-icons/icons/stopwatch.svg.js';
import '@radica/bootstrap-icons/icons/x-lg.svg.js';
import '@radica/ui/components/button/button.js';
import '@radica/ui/components/chip/chip.js';
import '@radica/ui/components/icon-button/icon-button.js';
import '@radica/ui/components/icon/icon.js';
import '@radica/ui/components/pill-button/pill-button.js';
import {HeximalSlideDeck} from './slide-deck.js';
import './slide-filmstrip.js';
import {getPreviewDepth} from './slide-preview.js';
import {radicaStyles} from './styles.js';
import {presentationTimer} from './timer.js';

@customElement('h-slide-presenter')
export class HeximalSlidePresenter extends HeximalElement {
  static override styles = [
    ...radicaStyles,
    css`
      :host {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background: var(--rad-color-slate-900);
        color: var(--rad-color-slate-100);
        font-family: var(--rad-font-sans);
        box-sizing: border-box;
        overflow: hidden;
      }

      #presenter-root {
        position: relative;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background: var(--rad-surface);
        color: var(--rad-on-surface);
        overflow: hidden;
      }

      #hidden-slot {
        display: none;
      }

      /* Left Filmstrip Drawer */
      #drawer-backdrop {
        position: absolute;
        inset: 0;
        background: var(--rad-overlay-background-color);
        backdrop-filter: blur(2px);
        z-index: 90;
      }

      #filmstrip-drawer {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 280px;
        max-width: 80%;
        background: var(--rad-surface);
        border-right: var(--rad-border-size-1) solid
          var(--rad-neutral-stroke-subtle);
        box-shadow: var(--rad-shadow-5);
        display: flex;
        flex-direction: column;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform 0.22s ease;
      }

      #filmstrip-drawer.open {
        transform: translateX(0);
      }

      .drawer-header {
        flex: 0 0 42px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--rad-spacing-x-small) 0 var(--rad-spacing-small);
        background: var(--rad-surface-raised);
        border-bottom: var(--rad-border-size-1) solid
          var(--rad-neutral-stroke-subtle);
        font-size: var(--rad-font-size-x-small);
        font-weight: var(--rad-font-weight-bold);
        color: var(--rad-on-surface-raised);
        text-transform: uppercase;
        letter-spacing: var(--rad-letter-spacing-wider);
      }

      #filmstrip-drawer h-slide-filmstrip {
        flex: 1 1 auto;
        min-height: 0;
      }

      /* Main Layout: Top Row (16:9 Previews & Controls) + Bottom Row (Full-Width Notes) */
      #main-content {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: var(--rad-spacing-medium);
        padding: var(--rad-spacing-medium);
        overflow: hidden;
        min-height: 0;
      }

      #top-row {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
        gap: var(--rad-spacing-medium);
        min-width: 0;
      }

      #secondary-col {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--rad-spacing-small);
        height: 100%;
        min-height: 0;
        min-width: 0;
      }

      #sub-previews {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--rad-spacing-medium);
        min-height: 0;
      }

      .preview-box {
        background: var(--rad-surface-raised);
        border: var(--rad-border-size-1) solid var(--rad-neutral-stroke-subtle);
        border-radius: var(--rad-border-radius-medium);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
        min-width: 0;
      }

      .preview-box.current {
        border-color: var(--rad-primary-stroke-strong);
      }

      .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--rad-spacing-x-small);
        padding: var(--rad-spacing-2x-small) var(--rad-spacing-small);
        background: var(--rad-surface-sunken);
        border-bottom: var(--rad-border-size-1) solid
          var(--rad-neutral-stroke-subtle);
        font-size: var(--rad-font-size-2x-small);
        font-weight: var(--rad-font-weight-semibold);
        color: var(--rad-on-surface-muted);
        text-transform: uppercase;
        letter-spacing: var(--rad-letter-spacing-wider);
        white-space: nowrap;
        overflow: hidden;
      }

      .preview-header-left {
        display: flex;
        align-items: center;
        gap: var(--rad-spacing-x-small);
        min-width: 0;
      }

      .preview-header .slide-title {
        color: var(--rad-on-surface-raised);
        text-transform: none;
        font-weight: var(--rad-font-weight-semibold);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .preview-body {
        width: 100%;
        aspect-ratio: 16 / 9;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: var(--rad-spacing-x-small);
        box-sizing: border-box;
        background: var(--rad-surface-sunken);
        overflow: hidden;
        min-height: 0;
      }

      .empty-preview {
        color: var(--rad-on-surface-muted);
        font-size: var(--rad-font-size-small);
        font-style: italic;
      }

      /* Aligned Prev / Next Buttons directly under their respective previews */
      #nav-buttons-grid {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--rad-spacing-medium);
      }

      #nav-buttons-grid rad-button {
        display: flex;
        justify-content: center;
      }

      /* Timer & Clock bar grouped with the Prev/Next buttons */
      #status-bar {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--rad-spacing-x-small);
        padding: var(--rad-spacing-x-small) var(--rad-spacing-small);
        background: var(--rad-surface-raised);
        border: var(--rad-border-size-1) solid var(--rad-neutral-stroke-subtle);
        border-radius: var(--rad-border-radius-medium);
      }

      .timer-controls {
        display: flex;
        align-items: center;
        gap: var(--rad-spacing-x-small);
      }

      .timer-readout {
        display: inline-flex;
        align-items: center;
        gap: var(--rad-spacing-2x-small);
        font-size: var(--rad-font-size-medium);
        font-weight: var(--rad-font-weight-bold);
        font-variant-numeric: tabular-nums;
        color: var(--rad-primary-text-normal);
        min-width: 68px;
      }

      .status-right {
        display: flex;
        align-items: center;
        gap: var(--rad-spacing-x-small);
      }

      .clock-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--rad-spacing-2x-small);
        font-size: var(--rad-font-size-x-small);
        font-variant-numeric: tabular-nums;
        color: var(--rad-on-surface-muted);
      }

      .clock-badge strong {
        color: var(--rad-on-surface-raised);
      }

      /* Full-width Presenter Notes */
      #notes-box {
        flex: 1 1 auto;
        background: var(--rad-surface-raised);
        border: var(--rad-border-size-1) solid var(--rad-neutral-stroke-subtle);
        border-radius: var(--rad-border-radius-medium);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }

      #notes-content {
        flex: 1;
        padding: var(--rad-spacing-medium) var(--rad-spacing-large);
        font-size: var(--rad-font-size-medium);
        line-height: var(--rad-line-height-relaxed);
        overflow-y: auto;
        color: var(--rad-on-surface-raised);
      }

      #notes-content p {
        margin-top: 0;
        margin-bottom: var(--rad-spacing-small);
      }

      #notes-content code {
        font-family: var(--rad-font-mono);
        font-size: 0.9em;
        background: var(--rad-surface-sunken);
        color: var(--rad-primary-text-normal);
        padding: var(--rad-spacing-3x-small) var(--rad-spacing-2x-small);
        border-radius: var(--rad-border-radius-x-small);
      }
    `,
  ];

  @property({type: Number})
  accessor index: number = 0;

  @property({type: Number})
  accessor step: number = 0;

  @property({type: Number})
  accessor length: number = 0;

  @property({type: Boolean})
  accessor filmstrip = false;

  @property({attribute: false})
  accessor externalDeck: HeximalSlideDeck | null = null;

  #channel?: BroadcastChannel;
  #clockInterval?: number;

  get deck(): HeximalSlideDeck | null {
    return (
      this.externalDeck ??
      this.querySelector('h-slide-deck') ??
      document.querySelector('h-slide-deck')
    );
  }

  get timer() {
    return this.deck?.timer ?? presentationTimer;
  }

  toggleFilmstrip() {
    this.filmstrip = !this.filmstrip;
  }

  #onSlideChanged = () => {
    this.#syncFromDeck();
    this.requestUpdate();
  };

  override connectedCallback() {
    super.connectedCallback();
    this.#syncFromDeck();

    if (getPreviewDepth(this) > 0) {
      return;
    }

    if (typeof BroadcastChannel !== 'undefined') {
      this.#channel = new BroadcastChannel('heximal-slides');
      this.#channel.onmessage = (e) => {
        if (e.data?.type === 'goto' && typeof e.data.index === 'number') {
          this.index = e.data.index;
          if (typeof e.data.step === 'number') {
            this.step = e.data.step;
          }
          const deck = this.deck;
          if (deck && deck.index !== this.index) {
            deck.goto(this.index, false);
          }
          if (deck?.currentSlide && typeof e.data.step === 'number') {
            deck.currentSlide.step = e.data.step;
          }
          this.#syncFromDeck();
          this.requestUpdate();
        }
      };
      this.#channel.postMessage({type: 'request-sync'});
    }

    const deck = this.deck;
    if (deck !== null) {
      deck.addEventListener('slide-changed', this.#onSlideChanged);
    }

    this.#clockInterval = window.setInterval(() => {
      this.requestUpdate();
    }, 1000);

    window.addEventListener('keydown', this.#onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.deck?.removeEventListener('slide-changed', this.#onSlideChanged);
    this.#channel?.close();
    clearInterval(this.#clockInterval);
    window.removeEventListener('keydown', this.#onKeyDown);
  }

  #onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.filmstrip) {
      this.filmstrip = false;
      return;
    }
    if (this.deck !== null) {
      return;
    }
    const target = e.composedPath()[0] as HTMLElement | undefined;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }
    switch (e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        this.previous();
        break;
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        this.next();
        break;
    }
  };

  #syncFromDeck() {
    const deck = this.deck;
    if (deck !== null) {
      this.index = deck.index;
      this.length = deck.length;
      this.step = deck.currentSlide?.step ?? 0;
    }
  }

  next() {
    const deck = this.deck;
    if (deck !== null) {
      deck.next();
      this.#syncFromDeck();
    } else {
      this.index++;
      this.#channel?.postMessage({
        type: 'goto',
        index: this.index,
        step: this.step,
      });
    }
    this.requestUpdate();
  }

  previous() {
    const deck = this.deck;
    if (deck !== null) {
      deck.previous();
      this.#syncFromDeck();
    } else if (this.index > 0) {
      this.index--;
      this.#channel?.postMessage({
        type: 'goto',
        index: this.index,
        step: this.step,
      });
    }
    this.requestUpdate();
  }

  override render() {
    const deck = this.deck;
    const slides = deck?.slides ?? [];
    this.length = slides.length;

    const currentSlide = slides[this.index] ?? null;
    const prevSlide = this.index > 0 ? (slides[this.index - 1] ?? null) : null;

    const hasNextStep =
      currentSlide !== null && this.step < currentSlide.stepCount;
    const nextPreviewSlide = hasNextStep
      ? currentSlide
      : (slides[this.index + 1] ?? null);
    const nextPreviewStep = hasNextStep ? this.step + 1 : 0;

    const currentTitle = currentSlide?.title || `Slide ${this.index + 1}`;
    const prevTitle = prevSlide
      ? prevSlide.title || `Slide ${this.index}`
      : 'Start of Deck';
    const nextTitle = hasNextStep
      ? `${currentTitle} (Step ${this.step + 1}/${currentSlide.stepCount})`
      : nextPreviewSlide
        ? nextPreviewSlide.title || `Slide ${this.index + 2}`
        : 'End of Deck';

    const notes = currentSlide?.notes ?? '';
    const wallClock = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const timer = this.timer;

    return html`
      <div id="hidden-slot">
        <slot></slot>
      </div>

      <div id="presenter-root" class="rad-theme-dark">
        ${
          this.filmstrip
            ? html`<div
                id="drawer-backdrop"
                @click=${() => {
                  this.filmstrip = false;
                }}
              ></div>`
            : nothing
        }

        <aside id="filmstrip-drawer" class="${this.filmstrip ? 'open' : ''}">
          <div class="drawer-header">
            <span>Slides (${this.length})</span>
            <rad-icon-button
              icon-name="x-lg"
              size="small"
              variant="text"
              @click=${() => this.toggleFilmstrip()}
              title="Close Filmstrip"
            ></rad-icon-button>
          </div>
          <h-slide-filmstrip .externalDeck=${deck}></h-slide-filmstrip>
        </aside>

        <div id="main-content">
          <div id="top-row">
            <div class="preview-box current">
              <div class="preview-header">
                <div class="preview-header-left">
                  <rad-button
                    size="small"
                    variant=${this.filmstrip ? 'primary' : 'default'}
                    @click=${() => this.toggleFilmstrip()}
                    title="Toggle Filmstrip Drawer"
                  >
                    <rad-icon
                      slot="prefix"
                      name="layout-sidebar"
                      size="small"
                    ></rad-icon>
                    Slides
                  </rad-button>
                  <span
                    >Current Slide (${this.index + 1} / ${this.length})</span
                  >
                </div>
                <span class="slide-title" title=${currentTitle}
                  >${currentTitle}</span
                >
              </div>
              <div class="preview-body">
                ${
                  currentSlide
                    ? html`<h-slide-preview
                        .slide=${currentSlide}
                        .step=${this.step}
                      ></h-slide-preview>`
                    : html`<span class="empty-preview">No slide</span>`
                }
              </div>
            </div>

            <div id="secondary-col">
              <div id="sub-previews">
                <div class="preview-box prev">
                  <div class="preview-header">
                    <span>Previous</span>
                    <span class="slide-title" title=${prevTitle}
                      >${prevTitle}</span
                    >
                  </div>
                  <div class="preview-body">
                    ${
                      prevSlide
                        ? html`<h-slide-preview
                            .slide=${prevSlide}
                            .step=${prevSlide.stepCount}
                          ></h-slide-preview>`
                        : html`<span class="empty-preview">Start of Deck</span>`
                    }
                  </div>
                </div>

                <div class="preview-box next">
                  <div class="preview-header">
                    <span>${hasNextStep ? 'Next Step' : 'Next'}</span>
                    <span class="slide-title" title=${nextTitle}
                      >${nextTitle}</span
                    >
                  </div>
                  <div class="preview-body">
                    ${
                      nextPreviewSlide
                        ? html`<h-slide-preview
                            .slide=${nextPreviewSlide}
                            .step=${nextPreviewStep}
                          ></h-slide-preview>`
                        : html`<span class="empty-preview">End of Deck</span>`
                    }
                  </div>
                </div>
              </div>

              <div id="nav-buttons-grid">
                <rad-button
                  variant="neutral"
                  size="medium"
                  @click=${() => this.previous()}
                >
                  <rad-icon
                    slot="prefix"
                    name="chevron-left"
                    size="small"
                  ></rad-icon>
                  Previous
                </rad-button>
                <rad-button
                  variant="primary"
                  size="medium"
                  @click=${() => this.next()}
                >
                  Next
                  <rad-icon
                    slot="suffix"
                    name="chevron-right"
                    size="small"
                  ></rad-icon>
                </rad-button>
              </div>

              <div id="status-bar">
                <div class="timer-controls">
                  <span class="timer-readout">
                    <rad-icon name="stopwatch" size="small"></rad-icon>
                    ${timer.formatted}
                  </span>
                  <rad-pill-button
                    size="small"
                    variant=${timer.running ? 'primary' : 'default'}
                    @click=${() => timer.toggle()}
                  >
                    <rad-icon
                      slot="prefix"
                      name=${timer.running ? 'pause-fill' : 'play-fill'}
                      size="small"
                    ></rad-icon>
                    ${timer.running ? 'Pause' : 'Start'}
                  </rad-pill-button>
                  <rad-pill-button
                    size="small"
                    variant="default"
                    @click=${() => timer.reset()}
                  >
                    <rad-icon
                      slot="prefix"
                      name="arrow-counterclockwise"
                      size="small"
                    ></rad-icon>
                    Reset
                  </rad-pill-button>
                </div>

                <div class="status-right">
                  ${
                    currentSlide && currentSlide.stepCount > 0
                      ? html`<rad-chip color="blue" size="small" pill
                          >Step ${this.step} /
                          ${currentSlide.stepCount}</rad-chip
                        >`
                      : nothing
                  }
                  <span class="clock-badge">
                    <rad-icon name="clock" size="small"></rad-icon>
                    <strong>${wallClock}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div id="notes-box">
            <div class="preview-header">
              <span>Presenter Notes</span>
              <span class="slide-title" title=${currentTitle}
                >${currentTitle}</span
              >
            </div>
            <div id="notes-content">
              ${
                notes
                  ? html`<div .innerHTML=${notes}></div>`
                  : html`<span class="empty-preview"
                      >No presenter notes for this slide.</span
                    >`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-presenter': HeximalSlidePresenter;
  }
}
