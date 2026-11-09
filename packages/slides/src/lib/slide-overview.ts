import {
  HeximalElement,
  css,
  customElement,
  html,
  property,
} from '@heximal/element';
import '@radica/ui/components/chip/chip.js';
import {HeximalSlideDeck} from './slide-deck.js';
import {getPreviewDepth} from './slide-preview.js';
import {radicaStyles} from './styles.js';

@customElement('h-slide-overview')
export class HeximalSlideOverview extends HeximalElement {
  static override styles = [
    ...radicaStyles,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: var(--rad-color-neutral-950);
        backdrop-filter: blur(12px);
        box-sizing: border-box;
        overflow-y: auto;
      }

      #hidden-slot {
        display: none;
      }

      #overview-grid {
        width: 100%;
        min-height: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        align-content: start;
        gap: var(--rad-spacing-large);
        padding: var(--rad-size-6) var(--rad-size-6) var(--rad-spacing-4x-large);
        background: var(--rad-surface);
        color: var(--rad-on-surface);
        box-sizing: border-box;
      }

      .thumbnail-card {
        position: relative;
        aspect-ratio: 16 / 9;
        background: var(--rad-surface-sunken);
        border: var(--rad-border-size-2) solid var(--rad-neutral-stroke-subtle);
        border-radius: var(--rad-border-radius-medium);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: var(--rad-on-surface);
        padding: 0;
        overflow: hidden;
        text-align: center;
      }

      .thumbnail-card:hover {
        border-color: var(--rad-primary-stroke-strong);
        transform: translateY(-2px);
        box-shadow: var(--rad-shadow-3);
      }

      .thumbnail-card.selected {
        border-color: var(--rad-primary-stroke-strong);
        background: var(--rad-surface-raised);
      }

      .thumbnail-number {
        position: absolute;
        top: var(--rad-spacing-2x-small);
        left: var(--rad-spacing-x-small);
        z-index: 2;
      }

      .thumbnail-preview {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: var(--rad-border-radius-x-small);
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
      <div id="overview-grid" class="rad-theme-dark">
        ${slides.map((slide, idx) => {
          const isSelected = idx === currentIndex;
          return html`
            <div
              class="thumbnail-card ${isSelected ? 'selected' : ''}"
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
              <rad-chip
                class="thumbnail-number"
                size="small"
                pill
                color=${isSelected ? 'blue' : 'gray'}
              >
                ${idx + 1}
              </rad-chip>
              <div class="thumbnail-preview">
                <h-slide-preview
                  .slide=${slide}
                  .step=${slide.stepCount}
                ></h-slide-preview>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-overview': HeximalSlideOverview;
  }
}
