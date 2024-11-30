import {HeximalElement, css, customElement, html} from '@heximal/element';

/**
 * An element for specifying presenter notes for a slide.
 * Hidden in presentation view, displayed in presenter view.
 */
@customElement('h-slide-notes')
export class HeximalSlideNotes extends HeximalElement {
  static override styles = css`
    :host {
      display: none !important;
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-notes': HeximalSlideNotes;
  }
}
