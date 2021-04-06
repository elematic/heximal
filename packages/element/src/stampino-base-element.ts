import {LitElement} from 'lit';
import {prepareTemplate} from 'stampino';

export class StampinoBaseElement extends LitElement {
  static template?: HTMLTemplateElement;
  static _preparedTemplate?: (model: object) => unknown;

  connectedCallback() {
    const ctor = this.constructor as typeof StampinoBaseElement;
    ctor._preparedTemplate =
      ctor.template == undefined ? undefined : prepareTemplate(ctor.template);
    super.connectedCallback();
  }

  render() {
    return (this.constructor as typeof StampinoBaseElement)._preparedTemplate?.(
      this
    );
  }
}
