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

  scope?: Record<string, unknown>;

  override render() {
    return html`<slot></slot>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const outerScope = getScope(this);
    // TODO (justinfagnani): rather than ceate a fresh scope each time, should
    // we just update the prototype chain of the existing scope?
    // Is the difference in behavior observable?
    this.scope = Object.create(outerScope ?? null);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.scope = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-scope': HeximalScope;
  }
}
