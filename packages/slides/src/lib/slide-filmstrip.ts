import {
  HeximalElement,
  css,
  customElement,
  html,
  property,
} from '@heximal/element';
import {HeximalSlideDeck} from './slide-deck.js';
import {getPreviewDepth} from './slide-preview.js';

@customElement('h-slide-filmstrip')
export class HeximalSlideFilmstrip extends HeximalElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: #0f172a;
      color: #f1f5f9;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      box-sizing: border-box;
      overflow-y: auto;
    }

    #hidden-slot {
      display: none;
    }

    #filmstrip-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      box-sizing: border-box;
    }

    .filmstrip-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      border-radius: 8px;
      background: #1e293b;
      border: 2px solid transparent;
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        background 0.15s ease;
    }

    .filmstrip-item:hover {
      border-color: #475569;
      background: #26354d;
    }

    .filmstrip-item.selected {
      border-color: #3b82f6;
      background: #1e3a8a33;
    }

    .filmstrip-thumb-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .filmstrip-number {
      flex: 0 0 22px;
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      font-variant-numeric: tabular-nums;
      padding-top: 2px;
      text-align: right;
    }

    .filmstrip-item.selected .filmstrip-number {
      color: #60a5fa;
    }

    .filmstrip-preview {
      flex: 1;
      position: relative;
      aspect-ratio: 16 / 9;
      background: #090d16;
      border-radius: 5px;
      overflow: hidden;
      border: 1px solid #334155;
    }

    .filmstrip-title {
      padding-left: 30px;
      font-size: 12px;
      font-weight: 500;
      color: #cbd5e1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .filmstrip-item.selected .filmstrip-title {
      color: #fff;
      font-weight: 600;
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
      <div id="filmstrip-list">
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
