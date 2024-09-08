import {LitElement} from 'lit';
import {SignalWatcher} from './signals/signal-watcher.js';

export * from 'lit';
export * from 'lit/decorators.js';

export abstract class HeximalElement extends SignalWatcher(LitElement) {}
