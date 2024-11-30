import {
  HeximalElement,
  css,
  customElement,
  html,
  nothing,
  property,
} from '@heximal/element';
import {HeximalSlideDeck} from './slide-deck.js';
import './slide-filmstrip.js';
import {getPreviewDepth} from './slide-preview.js';
import {presentationTimer} from './timer.js';

@customElement('h-slide-presenter')
export class HeximalSlidePresenter extends HeximalElement {
  static override styles = css`
    :host {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #0f172a;
      color: #f1f5f9;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      box-sizing: border-box;
      overflow: hidden;
    }

    #hidden-slot {
      display: none;
    }

    /* Left Filmstrip Drawer */
    #drawer-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(2, 6, 23, 0.55);
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
      background: #0f172a;
      border-right: 1px solid #334155;
      box-shadow: 8px 0 28px rgba(0, 0, 0, 0.5);
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
      padding: 0 14px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .drawer-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 15px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .drawer-close:hover {
      background: #334155;
      color: #fff;
    }

    #filmstrip-drawer h-slide-filmstrip {
      flex: 1 1 auto;
      min-height: 0;
    }

    .drawer-toggle-btn {
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: background 0.15s ease;
    }

    .drawer-toggle-btn:hover,
    .drawer-toggle-btn.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #fff;
    }

    /* Main Layout: Top Row (16:9 Previews & Controls) + Bottom Row (Full-Width Notes) */
    #main-content {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      overflow: hidden;
      min-height: 0;
    }

    #top-row {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 16px;
      min-width: 0;
    }

    #secondary-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      height: 100%;
      min-height: 0;
      min-width: 0;
    }

    #sub-previews {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 16px;
      min-height: 0;
    }

    .preview-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
      min-width: 0;
    }

    .preview-box.current {
      border-color: #3b82f6;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 12px;
      background: #0f172a;
      border-bottom: 1px solid #334155;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
    }

    .preview-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .preview-header .slide-title {
      color: #e2e8f0;
      text-transform: none;
      font-weight: 600;
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
      padding: 10px;
      box-sizing: border-box;
      background: #090d16;
      overflow: hidden;
      min-height: 0;
    }

    .empty-preview {
      color: #64748b;
      font-size: 14px;
      font-style: italic;
    }

    /* Aligned Prev / Next Buttons directly under their respective previews */
    #nav-buttons-grid {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 16px;
    }

    .nav-btn {
      width: 100%;
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .nav-btn:hover {
      background: #1d4ed8;
    }

    .nav-btn.secondary {
      background: #334155;
    }

    .nav-btn.secondary:hover {
      background: #475569;
    }

    /* Timer & Clock bar grouped with the Prev/Next buttons */
    #status-bar {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding: 8px 14px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
    }

    .timer-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .timer-readout {
      font-size: 17px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #38bdf8;
      min-width: 52px;
    }

    .timer-btn {
      background: #334155;
      color: #f1f5f9;
      border: none;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .timer-btn:hover {
      background: #475569;
    }

    .timer-btn.active {
      background: #2563eb;
      color: #fff;
    }

    .status-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .step-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      background: #1d4ed8;
      color: #e0f2fe;
    }

    .clock-badge {
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      color: #94a3b8;
    }

    .clock-badge strong {
      color: #f1f5f9;
    }

    /* Full-width Presenter Notes */
    #notes-box {
      flex: 1 1 auto;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    #notes-content {
      flex: 1;
      padding: 18px 22px;
      font-size: 16px;
      line-height: 1.6;
      overflow-y: auto;
      color: #e2e8f0;
    }

    #notes-content p {
      margin-top: 0;
      margin-bottom: 12px;
    }

    #notes-content code {
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      background: #0f172a;
      color: #93c5fd;
      padding: 2px 6px;
      border-radius: 4px;
    }
  `;

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
          <button
            class="drawer-close"
            @click=${() => this.toggleFilmstrip()}
            title="Close Filmstrip"
          >
            ✕
          </button>
        </div>
        <h-slide-filmstrip .externalDeck=${deck}></h-slide-filmstrip>
      </aside>

      <div id="main-content">
        <div id="top-row">
          <div class="preview-box current">
            <div class="preview-header">
              <div class="preview-header-left">
                <button
                  class="drawer-toggle-btn ${this.filmstrip ? 'active' : ''}"
                  @click=${() => this.toggleFilmstrip()}
                  title="Toggle Filmstrip Drawer"
                >
                  ▤ Slides
                </button>
                <span>Current Slide (${this.index + 1} / ${this.length})</span>
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
              <button class="nav-btn secondary" @click=${() => this.previous()}>
                ◀ Previous
              </button>
              <button class="nav-btn" @click=${() => this.next()}>
                Next ▶
              </button>
            </div>

            <div id="status-bar">
              <div class="timer-controls">
                <span class="timer-readout">${timer.formatted}</span>
                <button
                  class="timer-btn ${timer.running ? 'active' : ''}"
                  @click=${() => timer.toggle()}
                >
                  ${timer.running ? '⏸ Pause' : '▶ Start'}
                </button>
                <button class="timer-btn" @click=${() => timer.reset()}>
                  ↺ Reset
                </button>
              </div>

              <div class="status-right">
                ${
                  currentSlide && currentSlide.stepCount > 0
                    ? html`<span class="step-badge"
                        >Step ${this.step} / ${currentSlide.stepCount}</span
                      >`
                    : nothing
                }
                <span class="clock-badge"
                  >Clock: <strong>${wallClock}</strong></span
                >
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-presenter': HeximalSlidePresenter;
  }
}
