declare module 'incremental-dom' {
  export let attributes : any;
  export function elementOpen(tagName: string): void;
  export function elementClose(tagName: string): void;
  export function text(value: string): void;
  export function patch(container: Element, f: Function, data: any): void;
}
