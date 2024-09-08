export class HeximalProperty extends HTMLElement {
  static observedAttributes = [
    'name',
    'type',
    'noattribute',
    'attribute',
    'reflect',
  ];
}
customElements.define('h-prop', HeximalProperty);
