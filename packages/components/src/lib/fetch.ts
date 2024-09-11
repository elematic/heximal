import {HeximalElement, css, customElement, property} from '@heximal/element';
import {AsyncComputed} from './internal/async-computed.js';

/**
 * Fetches a resource over the network with fetch() API.
 */
@customElement('h-fetch')
export class HeximalFetch extends HeximalElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  #fetch = new AsyncComputed<unknown>(async () => {
    if (this.url === undefined) {
      return undefined;
    }
    const response = await fetch(this.url, {mode: this.mode});
    if (!response.ok) {
      // TODO: HttpError
      throw new Error(`h-include fetch failed: ${response.statusText}`);
    }
    const type = this.type;
    if (type === 'json') {
      return response.json();
    }
    if (type === 'blob') {
      return response.blob();
    }
    if (type === 'arrayBuffer') {
      return response.arrayBuffer();
    }
    if (type === 'formData') {
      return response.formData();
    }
    if (type === 'stream') {
      return response.body;
    }
    return response.text();
  });

  /**
   * The URL to fetch a resource.
   *
   * Setting this property causes a fetch() from the URL.
   */
  @property({reflect: true})
  accessor url: string | undefined;

  /**
   * The fetch mode to use: "cors", "no-cors", or "same-origin".
   * See the fetch() documents for more information.
   *
   * Setting this property will re-fetch the resource.
   */
  @property({reflect: true})
  accessor mode: RequestMode | undefined;

  @property({reflect: true})
  accessor type:
    | 'text'
    | 'json'
    | 'blob'
    | 'arrayBuffer'
    | 'formData'
    | 'stream' = 'text';

  get status() {
    return this.#fetch.status;
  }

  get value() {
    return this.#fetch.value;
  }

  get error() {
    return this.#fetch.error;
  }

  constructor() {
    super();
    console.log('h-fetch constructed');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-fetch': HeximalFetch;
  }
}
