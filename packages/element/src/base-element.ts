import {LitElement} from 'lit';
import {Renderers, prepareTemplate} from '@heximal/templates';

/**
 * The base class for elements declared with `<h-define-element>`.
 */
export class HeximalBaseElement extends LitElement {
  static superTemplate?: HTMLTemplateElement;
  static template?: HTMLTemplateElement;
  static renderers?: Renderers;
  static _preparedTemplate?: (model: object) => unknown;

  connectedCallback() {
    const ctor = this.constructor as typeof HeximalBaseElement;
    ctor._preparedTemplate =
      ctor.template === undefined
        ? undefined
        : prepareTemplate(
            ctor.template,
            undefined,
            ctor.renderers,
            ctor.superTemplate,
          );
    super.connectedCallback();
  }

  render() {
    return (this.constructor as typeof HeximalBaseElement)._preparedTemplate?.(
      this,
    );
  }

  /**
   * Returns a function that can be used in event handlers to update a property.
   * 
   * This is experimental and may change or be removed in the future!
   */
  protected _getPropertySetter(name: keyof this, value: this[keyof this]) {
    return () => this[name] = value;
  }
}