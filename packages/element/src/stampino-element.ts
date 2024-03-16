import {StampinoBaseElement} from './stampino-base-element.js';
import {css, PropertyDeclaration, unsafeCSS} from 'lit';

const typeHints = {
  String: String,
  Number: Number,
  Boolean: Boolean,
  Object: Object,
  Array: Array,
} as const;

export class StampinoElement extends HTMLElement {
  static observedAttributes = ['name', 'properties'];

  private declare _initialized: boolean;

  _class?: typeof StampinoBaseElement;
  _template?: HTMLTemplateElement;

  constructor() {
    super();
    Object.defineProperty(this, '_initialized', {value: false, writable: true});
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      const extendsName = this.getAttribute('extends');
      const elementName = this.getAttribute('name');
      const propertiesAttr = this.getAttribute('properties');
      const propertyChildren = this.querySelectorAll('st-prop');
      this._template =
        this.querySelector<HTMLTemplateElement>('template') ?? undefined;
      const style = this.querySelector<HTMLStyleElement>(
        "style[type='adopted-css']",
      );

      let superclass = StampinoBaseElement;
      let superTemplate = undefined;

      if (extendsName !== null) {
        const superDefinition = (
          this.getRootNode() as unknown as ParentNode
        ).querySelector(`stampino-element[name=${extendsName}]`);
        if (superDefinition === null) {
          console.warn(
            `Could not find superclass definition for ${extendsName}`,
          );
          return;
        }
        const foundSuperclass = (superDefinition as StampinoElement)._class;
        if (foundSuperclass) {
          superclass = foundSuperclass;
        }
        superTemplate = (superDefinition as StampinoElement)._template;
      }

      const C = (this._class = class extends superclass {});
      if (this._template) {
        C.template = this._template;
      }
      if (superTemplate) {
        C.superTemplate = superTemplate;
      }

      if (style) {
        C.styles = css`
          ${unsafeCSS(style.textContent)}
        `;
      }

      for (const p of propertiesAttr?.split(' ') ?? []) {
        C.createProperty(p);
      }

      for (const p of propertyChildren) {
        const name = p.getAttribute('name');
        const reflect = p.hasAttribute('reflect');
        const noAttribute = p.hasAttribute('noattribute');
        const attribute =
          !noAttribute && (p.getAttribute('attribute') ?? undefined);
        const typeHint = p.getAttribute('type');
        const type =
          typeHint === null
            ? undefined
            : typeHints[typeHint as keyof typeof typeHints];
        const options: PropertyDeclaration = {
          reflect,
          attribute,
          type,
        };
        if (name !== null) {
          C.createProperty(name, options);
        }
      }

      if (elementName) {
        customElements.define(elementName, C);
      }
    }
  }
}
customElements.define('stampino-element', StampinoElement);

class StampinoProperty extends HTMLElement {
  static observedAttributes = [
    'name',
    'type',
    'noattribute',
    'attribute',
    'reflect',
  ];
}
customElements.define('st-prop', StampinoProperty);
