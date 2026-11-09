import {
  HeximalElement,
  css,
  customElement,
  html,
  nothing,
  property,
} from '@heximal/element';
import {TemplateFunction, prepareTemplate} from '@heximal/templates';
import {getScope} from '@heximal/components';
import {HeximalSlideDeck} from './slide-deck.js';
import {HeximalSlideTheme} from './slide-theme.js';
import {radicaStyles} from './styles.js';
import {presentationTimer} from './timer.js';

@customElement('h-slide')
export class HeximalSlide extends HeximalElement {
  static override styles = [
    ...radicaStyles,
    css`
      :where(:host) {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        margin: 0;
        position: absolute;
        top: 0;
        left: 0;
        overflow: hidden;
      }
      :host(:not([visible])) {
        display: none;
      }
    `,
  ];

  @property({attribute: 'name', reflect: true})
  accessor name: string | undefined;

  @property({attribute: 'layout', reflect: true})
  accessor layoutName: string | undefined;

  @property({type: Boolean, reflect: true})
  accessor visible = false;

  @property({type: Number, reflect: true})
  accessor step = 0;

  @property({type: Number, reflect: true, attribute: 'steps'})
  accessor stepCount = 0;

  #preparedTemplate?: TemplateFunction;
  #error?: unknown;

  get deck(): HeximalSlideDeck | null {
    return this.closest('h-slide-deck');
  }

  get theme(): HeximalSlideTheme | null {
    const parent = this.parentElement;
    if (parent instanceof HeximalSlideTheme) {
      return parent;
    }
    return this.deck?.theme ?? null;
  }

  get layout(): HeximalSlide | null {
    if (this.layoutName === undefined) {
      return null;
    }
    return this.theme?.getLayout(this.layoutName) ?? null;
  }

  get template(): HTMLTemplateElement | undefined {
    const unnamed = this.querySelector(
      ':scope > template:not([name])',
    ) as HTMLTemplateElement | null;
    if (unnamed !== null) {
      return unnamed;
    }
    const namedTemplates = this.querySelectorAll(':scope > template[name]');
    if (namedTemplates.length > 0) {
      const wrapper = document.createElement('template');
      for (const t of namedTemplates) {
        wrapper.content.appendChild(t.cloneNode(true));
      }
      return wrapper;
    }
    return (
      (this.querySelector('template') as HTMLTemplateElement | null) ??
      undefined
    );
  }

  get preparedTemplate(): TemplateFunction | undefined {
    this.#prepareTemplate();
    return this.#preparedTemplate;
  }

  override get title(): string {
    const titleAttr = this.getAttribute('title');
    if (titleAttr) {
      return titleAttr;
    }
    const heading = this.#extractHeadingTitle();
    if (heading) {
      return heading;
    }
    return this.name ?? '';
  }

  override set title(value: string) {
    this.setAttribute('title', value);
  }

  #collectHeadings(root: ParentNode, tag: string, results: Element[]) {
    for (const el of root.querySelectorAll(tag)) {
      if (!el.closest('h-slide-notes')) {
        results.push(el);
      }
    }
    for (const tmpl of root.querySelectorAll('template')) {
      this.#collectHeadings(tmpl.content, tag, results);
    }
  }

  #extractHeadingTitle(): string {
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      if (this.shadowRoot && this.shadowRoot.children.length > 0) {
        for (const el of this.shadowRoot.querySelectorAll(tag)) {
          const text = el.textContent?.replace(/\s+/g, ' ').trim();
          if (text) {
            return text;
          }
        }
      }
      const matches: Element[] = [];
      this.#collectHeadings(this, tag, matches);
      for (const match of matches) {
        const text = match.textContent?.replace(/\s+/g, ' ').trim();
        if (text) {
          return text;
        }
      }
    }
    return '';
  }

  get notes(): string {
    const notesEl = this.querySelector('h-slide-notes');
    if (notesEl !== null) {
      return notesEl.innerHTML.trim();
    }
    const notesAttr = this.getAttribute('notes');
    if (notesAttr !== null) {
      return notesAttr;
    }
    return '';
  }

  #renderError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    return html`
      <div
        style="
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          padding: 40px;
          background: linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%);
          color: #fecaca;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        "
      >
        <div
          style="font-size: 20px; font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 8px;"
        >
          <span>⚠️</span> Slide Render Error
          ${this.name ? `(${this.name})` : ''}
        </div>
        <div
          style="font-size: 15px; font-weight: 600; color: #fff; background: rgba(0, 0, 0, 0.4); padding: 12px; border-radius: 6px; border-left: 4px solid #ef4444;"
        >
          ${message}
        </div>
        ${
          stack
            ? html`<pre
                style="font-size: 12px; line-height: 1.5; opacity: 0.85; white-space: pre-wrap; margin: 0; background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 6px; overflow-x: auto;"
              >
${stack}</pre>`
            : nothing
        }
      </div>
    `;
  }

  renderSlideContent(stepOverride?: number) {
    const template = this.preparedTemplate;
    if (this.#error !== undefined) {
      return this.#renderError(this.#error);
    }
    if (template === undefined) {
      return nothing;
    }

    const outerScope = getScope(this);
    const model = Object.create(outerScope ?? {});
    model.this = this;
    model.slide = this;
    model.host = this;
    model.step = stepOverride ?? this.step;
    model.stepCount = this.stepCount;
    model.timer = this.deck?.timer ?? presentationTimer;

    const deck = this.deck;
    if (deck !== null) {
      const idx = deck.indexOf(this);
      model.index = idx;
      model.slideNumber = idx + 1;
      model.totalSlides = deck.length;
      model.deck = deck;
    }

    try {
      return template(model);
    } catch (e) {
      console.error(`Error rendering slide ${this.name ?? ''}:`, e);
      return this.#renderError(e);
    }
  }

  override render() {
    if (!this.visible) {
      return nothing;
    }
    return this.renderSlideContent();
  }

  #prepareTemplate() {
    if (this.#preparedTemplate !== undefined) {
      return this.#preparedTemplate;
    }
    const template = this.template;
    if (template === undefined) {
      return undefined;
    }

    let superTemplate: TemplateFunction | HTMLTemplateElement | undefined;
    if (this.layoutName !== undefined) {
      const layout = this.layout;
      if (layout !== null) {
        superTemplate = layout.preparedTemplate;
      }
    }

    try {
      this.#preparedTemplate = prepareTemplate(
        template,
        undefined,
        undefined,
        superTemplate,
      );
      this.#error = undefined;
    } catch (e) {
      this.#error = e;
      console.error(
        `Error preparing template for slide ${this.name ?? ''}:`,
        e,
      );
    }
    return this.#preparedTemplate;
  }

  next(): boolean {
    if (this.step < this.stepCount) {
      this.step++;
      return true;
    }
    return false;
  }

  previous(): boolean {
    if (this.step > 0) {
      this.step--;
      return true;
    }
    return false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-slide': HeximalSlide;
  }
}
