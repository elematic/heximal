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
import './slide-overview.js';
import './slide-presenter.js';

@customElement('h-slide-viewer')
export class HeximalSlideViewer extends HeximalElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      width: 100%;
      height: 100%;
      background: #0a0a0a;
      color: #fff;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      overflow: hidden;
      box-sizing: border-box;
    }

    #deck-container {
      flex: 1 1 auto;
      display: flex;
      position: relative;
      overflow: hidden;
      align-items: center;
      justify-content: center;
    }

    /* Left Filmstrip Drawer */
    #drawer-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(2, 6, 23, 0.5);
      backdrop-filter: blur(2px);
      z-index: 160;
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
      z-index: 170;
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

    #toolbar-zone {
      position: absolute;
      bottom: 0;
      right: 0;
      padding: 28px 20px 16px 32px;
      z-index: 200;
    }

    #toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 999px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      opacity: 0;
      transform: translateY(4px);
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
    }

    #toolbar-zone:hover #toolbar,
    #toolbar:focus-within,
    #toolbar.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.18);
      margin: 0 4px;
    }

    .btn {
      background: transparent;
      border: 1px solid transparent;
      color: rgba(255, 255, 255, 0.92);
      cursor: pointer;
      padding: 5px 10px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .btn.active {
      background: #2563eb;
      color: #fff;
    }

    #counter {
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      color: rgba(255, 255, 255, 0.85);
      min-width: 48px;
      text-align: center;
      user-select: none;
    }

    /* Grid Overview Overlay */
    h-slide-overview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 150;
    }
  `;

  @property({type: Boolean})
  accessor overview = false;

  @property({type: Boolean})
  accessor filmstrip = false;

  @property({type: Boolean, reflect: true})
  accessor presenter = false;

  get deck(): HeximalSlideDeck | null {
    return this.querySelector('h-slide-deck');
  }

  override connectedCallback() {
    super.connectedCallback();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('presenter') && params.get('presenter') !== 'false') {
        this.presenter = true;
      }
    }
    this.addEventListener('slide-changed', () => this.requestUpdate());
    window.addEventListener('keydown', this.#onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.#onKeyDown);
  }

  #onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (this.filmstrip) {
        this.filmstrip = false;
      } else if (this.overview) {
        this.overview = false;
      }
    } else if (e.key === 'o' || e.key === 'O') {
      if (!e.metaKey && !e.ctrlKey) {
        this.toggleOverview();
      }
    }
  };

  toggleOverview() {
    this.overview = !this.overview;
  }

  toggleFilmstrip() {
    this.filmstrip = !this.filmstrip;
  }

  openPresenter() {
    const url = new URL(window.location.href);
    url.searchParams.set('presenter', 'true');
    window.open(
      url.toString(),
      'heximal-presenter',
      'width=1100,height=720,menubar=no,toolbar=no',
    );
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  override render() {
    const deck = this.deck;
    if (this.presenter) {
      return html`
        <div style="display: none;">
          <slot @slotchange=${() => this.requestUpdate()}></slot>
        </div>
        <h-slide-presenter .externalDeck=${deck}></h-slide-presenter>
      `;
    }

    const currentIndex = deck?.index ?? 0;
    const totalCount = deck?.length ?? 0;

    return html`
      <div id="deck-container">
        <slot></slot>
        ${
          this.overview
            ? html`<h-slide-overview
                .externalDeck=${deck}
                @slide-selected=${() => {
                  this.overview = false;
                }}
              ></h-slide-overview>`
            : nothing
        }
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
            <span>Slides (${totalCount})</span>
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
      </div>

      <div id="toolbar-zone">
        <div
          id="toolbar"
          class="${this.overview || this.filmstrip ? 'visible' : ''}"
        >
          <button
            class="btn"
            @click=${() => deck?.previous()}
            title="Previous (Left Arrow)"
          >
            ◀
          </button>
          <span id="counter"
            >${
              totalCount > 0 ? `${currentIndex + 1} / ${totalCount}` : '0 / 0'
            }</span
          >
          <button
            class="btn"
            @click=${() => deck?.next()}
            title="Next (Right Arrow)"
          >
            ▶
          </button>

          <span class="divider"></span>

          <button
            class="btn ${this.filmstrip ? 'active' : ''}"
            @click=${() => this.toggleFilmstrip()}
            title="Filmstrip Drawer"
          >
            ▤ Filmstrip
          </button>
          <button
            class="btn ${this.overview ? 'active' : ''}"
            @click=${() => this.toggleOverview()}
            title="Grid Overview (o)"
          >
            ▦ Overview
          </button>
          <button
            class="btn"
            @click=${() => this.openPresenter()}
            title="Presenter View"
          >
            🖥 Presenter
          </button>
          <button
            class="btn"
            @click=${() => this.toggleFullscreen()}
            title="Fullscreen (f)"
          >
            ⛶
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-viewer': HeximalSlideViewer;
  }
}
