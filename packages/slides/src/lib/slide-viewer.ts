import {
  HeximalElement,
  css,
  customElement,
  html,
  nothing,
  property,
} from '@heximal/element';
import '@radica/bootstrap-icons/icons/arrows-fullscreen.svg.js';
import '@radica/bootstrap-icons/icons/chevron-left.svg.js';
import '@radica/bootstrap-icons/icons/chevron-right.svg.js';
import '@radica/bootstrap-icons/icons/easel2.svg.js';
import '@radica/bootstrap-icons/icons/grid-3x3-gap-fill.svg.js';
import '@radica/bootstrap-icons/icons/layout-sidebar.svg.js';
import '@radica/bootstrap-icons/icons/x-lg.svg.js';
import '@radica/ui/components/divider/divider.js';
import '@radica/ui/components/icon-button/icon-button.js';
import '@radica/ui/components/icon/icon.js';
import '@radica/ui/components/pill-button/pill-button.js';
import {HeximalSlideDeck} from './slide-deck.js';
import './slide-filmstrip.js';
import './slide-overview.js';
import './slide-presenter.js';
import {radicaStyles} from './styles.js';

@customElement('h-slide-viewer')
export class HeximalSlideViewer extends HeximalElement {
  static override styles = [
    ...radicaStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        height: 100%;
        background: var(--rad-color-neutral-950);
        color: var(--rad-color-neutral-0);
        font-family: var(--rad-font-sans);
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
        background: var(--rad-overlay-background-color);
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
        background: var(--rad-surface);
        color: var(--rad-on-surface);
        border-right: var(--rad-border-size-1) solid
          var(--rad-neutral-stroke-subtle);
        box-shadow: var(--rad-shadow-5);
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

      #toolbar-zone {
        position: absolute;
        bottom: 0;
        right: 0;
        padding: var(--rad-spacing-x-large) var(--rad-spacing-large)
          var(--rad-spacing-medium) var(--rad-spacing-2x-large);
        z-index: 200;
      }

      #toolbar {
        display: flex;
        align-items: center;
        gap: var(--rad-spacing-2x-small);
        padding: var(--rad-spacing-2x-small) var(--rad-spacing-small);
        background: var(--rad-surface-overlay);
        backdrop-filter: blur(12px);
        border: var(--rad-border-size-1) solid var(--rad-neutral-stroke-subtle);
        border-radius: var(--rad-border-radius-pill);
        box-shadow: var(--rad-shadow-4);
        opacity: 0;
        transform: translateY(var(--rad-spacing-2x-small));
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

      #toolbar rad-divider {
        height: var(--rad-size-medium);
        --spacing: var(--rad-spacing-2x-small);
      }

      #counter {
        font-size: var(--rad-font-size-x-small);
        font-variant-numeric: tabular-nums;
        color: var(--rad-on-surface-overlay);
        min-width: var(--rad-size-9);
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
    `,
  ];

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
        <aside
          id="filmstrip-drawer"
          class="rad-theme-dark ${this.filmstrip ? 'open' : ''}"
        >
          <div class="drawer-header">
            <span>Slides (${totalCount})</span>
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
      </div>

      <div id="toolbar-zone" class="rad-theme-dark">
        <div
          id="toolbar"
          class="${this.overview || this.filmstrip ? 'visible' : ''}"
        >
          <rad-icon-button
            icon-name="chevron-left"
            size="small"
            variant="text"
            @click=${() => deck?.previous()}
            title="Previous (Left Arrow)"
          ></rad-icon-button>
          <span id="counter"
            >${
              totalCount > 0 ? `${currentIndex + 1} / ${totalCount}` : '0 / 0'
            }</span
          >
          <rad-icon-button
            icon-name="chevron-right"
            size="small"
            variant="text"
            @click=${() => deck?.next()}
            title="Next (Right Arrow)"
          ></rad-icon-button>

          <rad-divider vertical></rad-divider>

          <rad-pill-button
            size="small"
            variant=${this.filmstrip ? 'primary' : 'text'}
            @click=${() => this.toggleFilmstrip()}
            title="Filmstrip Drawer"
          >
            <rad-icon
              slot="prefix"
              name="layout-sidebar"
              size="small"
            ></rad-icon>
            Filmstrip
          </rad-pill-button>
          <rad-pill-button
            size="small"
            variant=${this.overview ? 'primary' : 'text'}
            @click=${() => this.toggleOverview()}
            title="Grid Overview (o)"
          >
            <rad-icon
              slot="prefix"
              name="grid-3x3-gap-fill"
              size="small"
            ></rad-icon>
            Overview
          </rad-pill-button>
          <rad-pill-button
            size="small"
            variant="text"
            @click=${() => this.openPresenter()}
            title="Presenter View"
          >
            <rad-icon slot="prefix" name="easel2" size="small"></rad-icon>
            Presenter
          </rad-pill-button>
          <rad-icon-button
            icon-name="arrows-fullscreen"
            size="small"
            variant="text"
            @click=${() => this.toggleFullscreen()}
            title="Fullscreen (f)"
          ></rad-icon-button>
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
