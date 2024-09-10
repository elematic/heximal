import {LitElement, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Signal} from 'signal-polyfill';
import {getScope} from './document.js';

// This import ensures the scope is created before any vars try to attach to it.
// This isn't so rubust. We need a scheduler to ensure top-down initialization.
import './scope.js';

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

  // TODO (justinfagnani): add a custom type converter and a `type` property
  // that feeds the converter.
  @property({type: String})
  set value(value: unknown) {
    this.#value.set(value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const scope = getScope(this);
    if (scope === undefined) {
      return;
    }
    if (Object.hasOwn(scope, this.name)) {
      console.warn(`Variable ${this.name} already exists in scope`);
    }
    Object.defineProperty(scope, this.name, {
      get: () => this.value,
      set: (value: unknown) => {
        this.value = value;
      },
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // TODO (justinfagnani): there are collision and race conditions here. We
    // could be removing a variable that was just added by another element.
    // We should write a proper Scope object so we will only remove the
    // variable if it was added by this element.
    const scope = getScope(this);
    if (scope === undefined) {
      return;
    }
    delete scope[this.name];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-var': HeximalVar;
  }
}
