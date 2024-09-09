import {
  HeximalElement,
  type PropertyValues,
  css,
  customElement,
  property,
} from '@heximal/element';
import {EvalAstFactory, Expression, parse} from '@heximal/expressions';
import {getElementScope} from './document.js';

const astFactory = new EvalAstFactory();

@customElement('h-out')
export class HeximalOut extends HeximalElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  @property({type: String})
  accessor expr = '';

  #expr?: Expression;

  get value() {
    const scope = getElementScope(this);
    return this.#expr?.evaluate(scope);
  }

  protected override willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('expr')) {
      this.#expr = parse(this.expr, astFactory);
    }
  }

  override render() {
    return this.value;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-out': HeximalOut;
  }
}
