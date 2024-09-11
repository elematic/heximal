import {LitElement} from 'lit';
import {SignalWatcher} from './signals/signal-watcher.js';

export {html, svg, mathml, css, nothing} from 'lit';
export type {PropertyValues} from 'lit';
export * from 'lit/decorators.js';
export {property} from './signals/property.js';

/**
 * A base class for all Heximal elements.
 *
 * This class adds signal watching to LitElement.
 */
export abstract class HeximalElement extends SignalWatcher(LitElement) {}
