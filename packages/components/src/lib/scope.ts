import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {getScope} from './document.js';

@customElement('h-scope')
export class HeximalScope extends LitElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

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

  override render() {
    return html`<slot></slot>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Ensure scope is initialized
    void this.scope;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#scope = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-scope': HeximalScope;
  }
}
