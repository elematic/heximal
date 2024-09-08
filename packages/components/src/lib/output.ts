import {HeximalElement, type PropertyValues, css} from '@heximal/element';
import {customElement, property} from '@heximal/element';
import {parse, EvalAstFactory, Expression} from '@heximal/expressions';

const astFactory = new EvalAstFactory();

@customElement('h-out')
export class HeximalOut extends HeximalElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  @property({type: String})
  accessor value = '';

  #expr?: Expression;

  protected override willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('value')) {
      this.#expr = parse(this.value, astFactory);
    }
  }

  override render() {
    const root = this.getRootNode() as Document | ShadowRoot;
    const variables = root.querySelectorAll('h-var');
    const scope: Record<string, unknown> = {
      host: this,
      window,
      document: this.ownerDocument,
    };
    for (const variable of variables) {
      Object.defineProperty(scope, variable.name, {
        get() {
          return variable.value;
        },
        set(value: unknown) {
          variable.value = value;
        },
      });
    }
    return this.#expr?.evaluate(scope);
  }
}
