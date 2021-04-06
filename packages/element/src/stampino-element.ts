import {StampinoBaseElement} from './stampino-base-element.js';
import {css, unsafeCSS} from 'lit';

export class StampinoElement extends HTMLElement {
  static observedAttributes = ['name', 'properties'];

  private declare _initialized: boolean;

  _class?: typeof StampinoBaseElement;

  constructor() {
    super();
    Object.defineProperty(this, '_initialized', {value: false, writable: true});
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      const extendsName = this.getAttribute('extends');
      const elementName = this.getAttribute('name');
      const properties = this.getAttribute('properties');
      const template = this.querySelector<HTMLTemplateElement>('template');
      const style = this.querySelector<HTMLStyleElement>(
        "style[type='adopted-css']"
      );

      let superclass = StampinoBaseElement;
      if (extendsName !== null) {
        const superDefinition = ((this.getRootNode() as unknown) as ParentNode).querySelector(
          `stampino-element[name=${extendsName}]`
        );
        if (superDefinition === null) {
          console.warn(
            `Could not find superclass definition for ${extendsName}`
          );
          return;
        }
        const foundSuperclass = (superDefinition as StampinoElement)._class;
        if (foundSuperclass) {
          superclass = foundSuperclass;
        }
      }

      const C = (this._class = class extends superclass {});
      if (template) {
        C.template = template;
      }

      if (style) {
        C.styles = css`
          ${unsafeCSS(style.textContent)}
        `;
      }

      for (const p of properties?.split(' ') ?? []) {
        C.createProperty(p);
      }

      if (elementName) {
        customElements.define(elementName, C);
      }
    }
  }
}
customElements.define('stampino-element', StampinoElement);
