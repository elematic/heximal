declare module 'incremental-dom' {
  export let attributes : any;
  export function elementOpen(
    tagname: string,
    key: string,
    staticPropertyValuePairs: any[],
    ...propertyValuePairs: any[]): Element;
  export function elementClose(tagname: string): void;
  export function text(value: string): void;
  export function patch(container: Element, f: Function, data: any): void;
}
