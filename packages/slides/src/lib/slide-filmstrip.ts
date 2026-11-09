import {
  HeximalElement,
  css,
  customElement,
  html,
  property,
} from '@heximal/element';
import {HeximalSlideDeck} from './slide-deck.js';
import {getPreviewDepth} from './slide-preview.js';
import {radicaStyles} from './styles.js';

@customElement('h-slide-filmstrip')
export class HeximalSlideFilmstrip extends HeximalElement {
  static override styles = [
    ...radicaStyles,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: var(--rad-color-slate-900);
        color: var(--rad-color-slate-100);
        font-family: var(--rad-font-sans);
        box-sizing: border-box;
        overflow-y: auto;
      }

      #hidden-slot {
        display: none;
      }

      #filmstrip-list {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--rad-spacing-small);
        padding: var(--rad-spacing-small);
        background: var(--rad-surface);
        color: var(--rad-on-surface);
        box-sizing: border-box;
      }

      .filmstrip-item {
        display: flex;
        flex-direction: column;
        gap: var(--rad-spacing-2x-small);
        padding: var(--rad-spacing-x-small);
        border-radius: var(--rad-border-radius-medium);
        background: var(--rad-surface-raised);
        border: var(--rad-border-size-2) solid transparent;
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }

      .filmstrip-item:hover {
        border-color: var(--rad-neutral-stroke-moderate);
        background: var(--rad-neutral-fill-soft);
      }

      .filmstrip-item.selected {
        border-color: var(--rad-primary-stroke-strong);
        background: var(--rad-primary-fill-subtle);
      }

      .filmstrip-thumb-row {
        display: flex;
        align-items: flex-start;
        gap: var(--rad-spacing-x-small);
      }

      .filmstrip-number {
        flex: 0 0 22px;
        font-size: var(--rad-font-size-2x-small);
        font-weight: var(--rad-font-weight-bold);
        color: var(--rad-on-surface-muted);
        font-variant-numeric: tabular-nums;
        padding-top: var(--rad-spacing-3x-small);
        text-align: right;
      }

      .filmstrip-item.selected .filmstrip-number {
        color: var(--rad-primary-text-normal);
      }

      .filmstrip-preview {
        flex: 1;
        position: relative;
        aspect-ratio: 16 / 9;
        background: var(--rad-surface-sunken);
        border-radius: var(--rad-border-radius-x-small);
        overflow: hidden;
        border: var(--rad-border-size-1) solid var(--rad-neutral-stroke-subtle);
      }

      .filmstrip-title {
        padding-left: var(--rad-spacing-x-large);
        font-size: var(--rad-font-size-2x-small);
        font-weight: var(--rad-font-weight-medium);
        color: var(--rad-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .filmstrip-item.selected .filmstrip-title {
        color: var(--rad-on-surface-raised);
        font-weight: var(--rad-font-weight-semibold);
      }
    `,
  ];

  @property({attribute: false})
  accessor externalDeck: HeximalSlideDeck | null = null;

  get deck(): HeximalSlideDeck | null {
    return (
      this.externalDeck ??
      this.querySelector('h-slide-deck') ??
      document.querySelector('h-slide-deck')
    );
  }

  #onSlideChanged = () => {
    this.requestUpdate();
  };

  override connectedCallback() {
    super.connectedCallback();
    if (getPreviewDepth(this) > 0) {
      return;
    }
    this.deck?.addEventListener('slide-changed', this.#onSlideChanged);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.deck?.removeEventListener('slide-changed', this.#onSlideChanged);
  }

  override render() {
    const deck = this.deck;
    const slides = deck?.slides ?? [];
    const currentIndex = deck?.index ?? 0;

    return html`
      <div id="hidden-slot">
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </div>
      <div id="filmstrip-list" class="rad-theme-dark">
        ${slides.map((slide, idx) => {
          const isSelected = idx === currentIndex;
          const title = slide.title || `Slide ${idx + 1}`;
          return html`
            <div
              class="filmstrip-item ${isSelected ? 'selected' : ''}"
              @click=${() => {
                deck?.goto(idx);
                this.dispatchEvent(
                  new CustomEvent('slide-selected', {
                    bubbles: true,
                    composed: true,
                    detail: {index: idx, slide},
                  }),
                );
              }}
            >
              <div class="filmstrip-thumb-row">
                <span class="filmstrip-number">${idx + 1}</span>
                <div class="filmstrip-preview">
                  <h-slide-preview
                    .slide=${slide}
                    .step=${slide.stepCount}
                  ></h-slide-preview>
                </div>
              </div>
              <div class="filmstrip-title" title=${title}>${title}</div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-filmstrip': HeximalSlideFilmstrip;
  }
}
