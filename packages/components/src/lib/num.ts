import {
  HeximalElement,
  css,
  customElement,
  property,
  html,
  PropertyValues,
} from '@heximal/element';
import {getTextContent} from './internal/slot.js';

/**
 * A custom element that formats a number according to the user's preferred
 * locale and the provided options.
 */
@customElement('h-num')
export class HeximalNum extends HeximalElement {
  static override styles = css`
    slot {
      display: none;
    }
  `;

  #format!: Intl.NumberFormat;

  // Locale options

  @property({reflect: true})
  accessor localeMatcher: 'lookup' | 'best fit' = 'best fit';

  @property({reflect: true})
  accessor numberingSystem: string | undefined;

  // Digit options

  @property({reflect: true, type: Number})
  accessor minimumIntegerDigits: number | undefined;

  @property({reflect: true, type: Number})
  accessor minimumFractionDigits: number | undefined;

  @property({reflect: true, type: Number})
  accessor maximumFractionDigits: number | undefined;

  @property({reflect: true, type: Number})
  accessor minimumSignificantDigits: number | undefined;

  @property({reflect: true, type: Number})
  accessor maximumSignificantDigits: number | undefined;

  @property({reflect: true})
  accessor roundingPriority: 'auto' | 'morePrecision' | 'lessPrecision' =
    'auto';

  @property({reflect: true, type: Number})
  accessor roundingIncrement:
    | 1
    | 2
    | 5
    | 10
    | 20
    | 25
    | 50
    | 100
    | 200
    | 250
    | 500
    | 1000
    | 2000
    | 2500
    | 5000
    | undefined;

  @property({reflect: true})
  accessor roundingMode:
    | 'ceil'
    | 'floor'
    | 'expand'
    | 'trunc'
    | 'halfCeil'
    | 'halfFloor'
    | 'halfExpand'
    | 'halfTrunc'
    | 'halfEven'
    | undefined = 'halfExpand';

  @property({reflect: true})
  accessor trailingZeroDisplay: 'auto' | 'stripIfInteger' | undefined;

  // Style options

  /**
   * The display style for the number. This sets the `style` option of the
   * `Intl.NumberFormat` constructor.
   */
  @property({reflect: true})
  accessor display: 'decimal' | 'currency' | 'percent' | 'unit' = 'decimal';

  @property({reflect: true})
  accessor currency: string | undefined;

  @property({reflect: true})
  accessor currencyDisplay: 'symbol' | 'narrowSymbol' | 'code' | 'name' =
    'symbol';

  @property({reflect: true})
  accessor currencySign: 'standard' | 'accounting' = 'standard';

  @property({reflect: true})
  accessor unit: string | undefined;

  @property({reflect: true})
  accessor unitDisplay: 'short' | 'long' = 'short';

  // Other options

  @property({reflect: true})
  accessor notation: 'standard' | 'scientific' | 'engineering' | 'compact' =
    'standard';

  @property({reflect: true})
  accessor compactDisplay: 'short' | 'long' = 'short';

  @property({reflect: true})
  accessor useGrouping: boolean | 'always' | 'auto' | 'min2' | undefined =
    undefined;

  @property({reflect: true})
  accessor signDisplay:
    | 'auto'
    | 'always'
    | 'exceptZero'
    | 'negative'
    | 'never' = 'auto';

  // End options

  protected override willUpdate(_changedProperties: PropertyValues): void {
    // Any change to properties requires re-creating the formatter.
    this.#format = new Intl.NumberFormat(undefined, {
      localeMatcher: this.localeMatcher,
      numberingSystem: this.numberingSystem,

      minimumIntegerDigits: this.minimumIntegerDigits,
      minimumFractionDigits: this.minimumFractionDigits,
      maximumFractionDigits: this.maximumFractionDigits,
      minimumSignificantDigits: this.minimumSignificantDigits,
      maximumSignificantDigits: this.maximumSignificantDigits,
      roundingPriority: this.roundingPriority,
      roundingIncrement: this.roundingIncrement,
      roundingMode: this.roundingMode,
      trailingZeroDisplay: this.trailingZeroDisplay,

      style: this.display,
      currency: this.currency,
      currencyDisplay: this.currencyDisplay,
      currencySign: this.currencySign,
      unit: this.unit,
      unitDisplay: this.unitDisplay,

      notation: this.notation,
      compactDisplay: this.compactDisplay,
      useGrouping: this.useGrouping,
      signDisplay: this.signDisplay,
    });
  }

  override render() {
    return html`<slot @slotchange=${this.#slotchange}></slot><span></span>`;
  }

  #slotchange() {
    const slot = this.shadowRoot!.querySelector('slot')!;
    const text = getTextContent(slot);
    console.log('text', text);
    if (text.trim() !== '') {
      const value = parseFloat(text);
      const formatted = this.#format.format(value);

      // Update the DOM directly so we don't need to wait for a re-render.
      const span = this.shadowRoot!.querySelector('span')!;
      span.textContent = formatted;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'h-num': HeximalNum;
  }
}
