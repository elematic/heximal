declare module "stampino" {
    export function getValue(value: string, model: any): any;
    export interface TemplateUpdater {
        (model: any): void;
    }
    export interface AttributeHandler {
        matches(name: string): boolean;
        handle(el: Element, name: string, value: any, model: any): void;
    }
    export interface Renderers {
        [name: string]: Renderer;
    }
    export interface Renderer {
        (model: any, renderers: Renderers, handlers: Handlers, attributeHandler: AttributeHandler): void;
    }
    export interface Handler {
        (template: HTMLTemplateElement, model: any, renderers: Renderers, handlers: Handlers, attributeHandler: AttributeHandler): void;
    }
    export interface Handlers {
        [name: string]: Handler;
    }
    /**
     * @returns {Function} a render function that can be passed to incremental-dom's
     * patch() function.
     */
    export function prepareTemplate(template: HTMLTemplateElement, renderers: Renderers, handlers: Handlers, attributeHandler: AttributeHandler, superTemplate: HTMLTemplateElement): TemplateUpdater;
    export interface RenderOptions {
        attributeHandler: AttributeHandler;
        renderers: Renderers;
        handlers: Handlers;
        extends: HTMLTemplateElement;
    }
    /**
     * Renders a template element containing a Stampino template.
     *
     * This version interprets the template by walking its content and invoking
     * incremental-dom calls for each node, and evaluating Polymer expressions
     * contained within {{ }} blocks.
     *
     * As an optimization we can compile templates into a list of objects that
     * directly translate to incremental-dom calls, and includes pre-parsed
     * expressions. We won't optimize until we have benchmarks in place however.
     */
    export function render(template: HTMLTemplateElement, container: Element, model: any, opts: RenderOptions): void;
    export function renderNode(node: Node, model: any, renderers: Renderers, handlers: Handlers, attributeHandler: AttributeHandler): void;
}
