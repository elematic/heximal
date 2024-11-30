import {
  HeximalElement,
  css,
  customElement,
  html,
  property,
} from '@heximal/element';
import {getScope} from '@heximal/components';

/**
 * A section groups slides and establishes a lexical scope for reactive
 * state shared across all slides in the section.
 */
@customElement('h-slide-section')
export class HeximalSlideSection extends HeximalElement {
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  @property({reflect: true})
  override accessor title: string = '';

  #scope?: Record<string, unknown>;

  get scope(): Record<string, unknown> | undefined {
    if (this.#scope === undefined && this.isConnected) {
      const outerScope = this.parentNode
        ? getScope(this.parentNode)
        : undefined;
      this.#scope = Object.create(outerScope ?? null);
    }
    return this.#scope;
  }

  override connectedCallback() {
    super.connectedCallback();
    void this.scope;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#scope = undefined;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-section': HeximalSlideSection;
  }
}
