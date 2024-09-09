import {Task} from '@lit/task';
import {LitElement, PropertyValues, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

const LINK_LOAD_SUPPORTED = 'onload' in HTMLLinkElement.prototype;

const isLinkLoaded = (link: HTMLLinkElement) => {
  try {
    // Firefox may throw when accessing a not-yet-loaded cssRules property, so
    // we access it inside a try-catch block.
    link.sheet?.cssRules;
  } catch (e) {
    const {name} = e as Error;
    if (name === 'InvalidAccessError' || name === 'SecurityError') {
      return false;
    } else {
      throw e;
    }
  }
  return link.sheet !== null;
};

/**
 * Resolves when a `<link>` element has loaded its resource.
 * Gracefully degrades for browsers that don't support the `load` event on links.
 * in which case, it immediately resolves, causing a FOUC, but displaying content.
 * resolves immediately if the stylesheet has already been loaded.
 */
const linkLoaded = async (
  link: HTMLLinkElement,
): Promise<StyleSheet | void> => {
  return new Promise((resolve, reject) => {
    if (!LINK_LOAD_SUPPORTED) {
      resolve();
    } else if (isLinkLoaded(link)) {
      resolve(link.sheet!);
    } else {
      link.addEventListener('load', () => resolve(link.sheet!), {once: true});
      link.addEventListener('error', reject, {once: true});
    }
  });
};

/**
 * Embeds HTML into a document.
 *
 * The HTML is fetched from the URL contained in the `src` attribute, using the
 * fetch() API. A 'load' event is fired when the HTML is updated.
 *
 * The request is made using CORS by default. This can be chaned with the `mode`
 * attribute.
 *
 * By default, the HTML is embedded into a shadow root. If the `no-shadow`
 * attribute is present, the HTML will be embedded into the child content.
 *
 */
@customElement('h-include')
export class HeximalInclude extends LitElement {
  static override shadowRootOptions = {
    mode: 'open',
    delegatesFocus: true,
  } as const;

  static override styles = css`
    :host {
      display: block;
    }
  `;

  // @ts-expect-error unused property
  #fetchTask = new Task(this, {
    task: async ([src, mode], {signal}) => {
      if (src === undefined) {
        return '';
      }
      const response = await fetch(src, {mode, signal});
      if (!response.ok) {
        throw new Error(`h-include fetch failed: ${response.statusText}`);
      }
      return response.text();
    },
    args: () => [this.src, this.mode] as const,
    onComplete: async (value) => {
      if (this.noShadow) {
        this.innerHTML = value;
        // When not using shadow DOM then the consumer is responsible for
        // waiting its own resources to load.
      } else {
        this.shadowRoot!.innerHTML = value;
        // Wait for sub resources to load
        // TODO (justinfagnani): do we need to wait for iframes and images?
        await Promise.all(
          [...this.shadowRoot!.querySelectorAll('link')].map(linkLoaded),
        );
      }
      this.dispatchEvent(new Event('load'));
    },
    onError: (error) => {
      console.error(error);
      // TODO (justinfagnani): dispatch an error event and write error to the
      // element content.
    },
  });

  /**
   * The URL to fetch an HTML document from.
   *
   * Setting this property causes a fetch the HTML from the URL.
   */
  @property({reflect: true})
  accessor src: string | undefined;

  /**
   * The fetch mode to use: "cors", "no-cors", or "same-origin".
   * See the fetch() documents for more information.
   *
   * Setting this property does not re-fetch the HTML.
   */
  @property({reflect: true})
  accessor mode: RequestMode | undefined;

  /**
   * If true, replaces the innerHTML of this element with the text response
   * fetch. Setting this property does not re-fetch the HTML.
   */
  @property({type: Boolean, attribute: 'no-shadow', reflect: true})
  accessor noShadow: boolean = false;

  override update(changedProperties: PropertyValues<this>) {
    super.update(changedProperties);
    if (changedProperties.has('noShadow')) {
      // TODO (justinfagnani): re-fetch? clear innerHTML?
      if (this.noShadow) {
        this.shadowRoot!.innerHTML = '';
      } else {
        this.shadowRoot!.innerHTML = '<slot></slot>';
      }
    }
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    super.createRenderRoot();
    return document.createDocumentFragment();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-include': HeximalInclude;
  }
}
