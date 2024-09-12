import {HeximalElement, css, customElement, property} from '@heximal/element';
import {AsyncComputed} from './internal/async-computed.js';

/**
 * Fetches a resource over the network with fetch() API.
 *
 * Fetches are run automatically upon creating and when the `url`, `mode`, or
 * `type` properties change.
 *
 * The result of the fetch is available in the `value` and `error` properties.
 * They hold the result of the last completed or errored fetch.
 *
 * A difference from the fetch() API is that if the fetch completes with an HTTP
 * error status, the fetch will throw an error and the `error` property will be
 * set to the error.
 *
 * When the fetch is pending, the `value` and `error` properties will hold the
 * result of the previous fetch.
 *
 * The `url`, `mode`, `type`, `state`, `value`, and `error` properties are
 * backed by signals, so any signals that read them will be tracked as
 * dependents of them.
 */
@customElement('h-fetch')
export class HeximalFetch extends HeximalElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  #fetch = new AsyncComputed<unknown>(async ({signal}) => {
    const url = this.url;

    if (url === undefined || url.trim() === '') {
      return undefined;
    }

    const response = await fetch(url, {mode: this.mode, signal});
    if (!response.ok) {
      // TODO: HttpError
      throw new Error(
        `h-include fetch for ${url} failed: ${response.statusText}`,
      );
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

  /**
   * The type of the response to fetch: "text", "json", "blob", "arrayBuffer",
   * "formData", or "stream".
   *
   * Defaults to "text".
   *
   * Setting this property will re-fetch the resource.
   */
  @property({reflect: true})
  accessor type:
    | 'text'
    | 'json'
    | 'blob'
    | 'arrayBuffer'
    | 'formData'
    | 'stream' = 'text';

  /**
   * The current status of the fetch, which is one of 'initial',
   * 'pending', 'complete', or 'error'.
   */
  get status() {
    return this.#fetch.status;
  }

  get value() {
    return this.#fetch.value;
  }

  get error() {
    return this.#fetch.error;
  }

  get complete() {
    return this.#fetch.complete;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#fetch.run();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-fetch': HeximalFetch;
  }
}
