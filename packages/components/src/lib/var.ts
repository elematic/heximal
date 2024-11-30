import {LitElement, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Signal} from 'signal-polyfill';
import {getScope} from './document.js';

// This import ensures that h-scope elements are upgraded before any vars try to
// attach to it.
//
// TODO (justinfagnani): This isn't very robust. We need a scheduler to ensure
// top-down initialization.
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

  #type = '';

  get type() {
    return this.#type;
  }

  @property({type: String})
  set type(type: string) {
    this.#type = type;
    if (this.#rawAttributeValue !== undefined) {
      this.#value.set(this.#convertAttributeValue(this.#rawAttributeValue));
    }
  }

  #value = new Signal.State<unknown>(undefined);
  #rawAttributeValue: string | null | undefined = undefined;

  get signal() {
    return this.#value;
  }

  get value() {
    return this.#value.get();
  }

  @property({converter: (v) => v})
  set value(value: unknown) {
    this.#rawAttributeValue = undefined;
    this.#value.set(value);
  }

  override attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ): void {
    if (name === 'value') {
      this.#rawAttributeValue = value;
      this.#value.set(this.#convertAttributeValue(value));
      return;
    }
    super.attributeChangedCallback(name, _old, value);
  }

  #convertAttributeValue(value: string | null): unknown {
    if (value === null) {
      const type = (
        this.#type ||
        this.getAttribute('type') ||
        'string'
      ).toLowerCase();
      return type === 'boolean' ? false : null;
    }
    const type = (
      this.#type ||
      this.getAttribute('type') ||
      'string'
    ).toLowerCase();
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value !== 'false';
      case 'object':
      case 'array':
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      case 'string':
      default:
        return value;
    }
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
      configurable: true,
      enumerable: true,
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
