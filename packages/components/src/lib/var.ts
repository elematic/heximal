import {LitElement, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Signal} from 'signal-polyfill';

@customElement('h-var')
export class HeximalVar extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  @property({type: String, reflect: true})
  accessor name = '';

  @property({type: String})
  accessor type = '';

  #value = new Signal.State<unknown>(undefined);

  get signal() {
    return this.#value;
  }

  get value() {
    return this.#value.get();
  }

  @property({type: String})
  set value(value: unknown) {
    this.#value.set(value);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-var': HeximalVar;
  }
}
