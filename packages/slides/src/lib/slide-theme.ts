import {HeximalElement, css, customElement, property} from '@heximal/element';
import {HeximalSlide} from './slide.js';

@customElement('h-slide-theme')
export class HeximalSlideTheme extends HeximalElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  static themes = new Map<string, HeximalSlideTheme>();

  @property({reflect: true})
  accessor name: string | undefined;

  @property({attribute: 'aspect-ratio', reflect: true})
  accessor aspectRatio: string | undefined;

  override connectedCallback() {
    super.connectedCallback();
    if (this.name !== undefined) {
      HeximalSlideTheme.themes.set(this.name, this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (
      this.name !== undefined &&
      HeximalSlideTheme.themes.get(this.name) === this
    ) {
      HeximalSlideTheme.themes.delete(this.name);
    }
  }

  get slides(): NodeListOf<HeximalSlide> {
    return this.querySelectorAll(':scope > h-slide');
  }

  get length(): number {
    return this.slides.length;
  }

  getLayout(name: string): HeximalSlide | null {
    return this.querySelector(`h-slide[name="${name}"]`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide-theme': HeximalSlideTheme;
  }
}
