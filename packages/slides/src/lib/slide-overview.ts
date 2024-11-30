import {
  HeximalElement,
  css,
  customElement,
  html,
  property,
} from '@heximal/element';
import {HeximalSlideDeck} from './slide-deck.js';
import {getPreviewDepth} from './slide-preview.js';

@customElement('h-slide-overview')
export class HeximalSlideOverview extends HeximalElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 10, 0.95);
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
      gap: 20px;
      padding: 24px 24px 80px;
      box-sizing: border-box;
    }

    .thumbnail-card {
      position: relative;
      aspect-ratio: 16 / 9;
      background: #090d16;
      border: 2px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: rgba(255, 255, 255, 0.8);
      padding: 0;
      overflow: hidden;
      text-align: center;
    }

    .thumbnail-card:hover {
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .thumbnail-card.selected {
      border-color: #3b82f6;
      background: #1e293b;
    }

    .thumbnail-number {
      position: absolute;
      top: 6px;
      left: 8px;
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.85);
      background: rgba(0, 0, 0, 0.65);
      padding: 2px 7px;
      border-radius: 999px;
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
      border-radius: 4px;
    }
  `;

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
      <div id="overview-grid">
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
              <span class="thumbnail-number">${idx + 1}</span>
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
