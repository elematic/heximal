import {
  type PropertyDeclaration,
  type ReactiveElement,
  defaultConverter,
  notEqual,
} from 'lit';
import {Signal} from 'signal-polyfill';

export type Interface<T> = {
  [K in keyof T]: T[K];
};

const defaultPropertyDeclaration: PropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual,
};

/**
 * An accessor decorator which creates a reactive property that is backed by a
 * signal and optionally reflects its value to an attribute. When a decorated
 * property is set the value of the backing signal is updated, which will cause
 * any computed signals that depend on the property to be re-evaluated. Combined
 * with SignalWatcher, this will cause the element to update.
 *
 * A {@linkcode PropertyDeclaration} object may be vgen to configure property
 * features.
 */
export function property(
  options: PropertyDeclaration = defaultPropertyDeclaration,
) {
  return <C extends Interface<ReactiveElement>, V>(
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>,
  ) => {
    const {metadata, name} = context;

    // Store the property options
    let properties = globalThis.litPropertyMetadata.get(metadata);
    if (properties === undefined) {
      globalThis.litPropertyMetadata.set(metadata, (properties = new Map()));
    }
    properties.set(name, options);

    const get = (target as ClassAccessorDecoratorTarget<C, V>).get as (
      this: C,
    ) => Signal.State<V>;

    return {
      set(this: C, v: V) {
        const signal = get.call(this);
        const oldValue = signal.get();
        signal.set(v);
        this.requestUpdate(name, oldValue, options);
      },
      get(this: C) {
        return get.call(this).get();
      },
      init(this: C, v: V) {
        return new Signal.State(v) as unknown as V;
      },
    };
  };
}
