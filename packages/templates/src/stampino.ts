import {render as renderLit, Template, nothing} from 'lit-html';
import {CompiledTemplate, CompiledTemplateResult} from 'lit-html';

import {parse, Parser, EvalAstFactory} from 'jexpr';
import type {Expression, Scope} from 'jexpr/lib/eval';

import {_Σ} from 'lit-html/private-ssr-support.js';
const {AttributePart, PropertyPart, BooleanAttributePart, EventPart} = _Σ;

const astFactory = new EvalAstFactory();
const _expressionCache = new WeakMap<Node, Expression | undefined>();

const toCamelCase = (s: string) =>
  s.replace(/-(\w)/g, (_, p1: string) => p1.toUpperCase());

const getValue = (node: Node, model: any) => {
  let ast = _expressionCache.get(node);
  if (ast !== undefined) {
    return ast.evaluate(model);
  }
  if (_expressionCache.has(node)) {
    return undefined;
  }
  const value = node.textContent!;
  // TODO: split to support multiple expressions
  if (value.startsWith('{{') && value.endsWith('}}')) {
    const expression = value.substring(2, value.length - 2).trim();
    ast = new Parser(expression, astFactory).parse();
    _expressionCache.set(node, ast);
    return ast?.evaluate(model);
  }
  if (value.startsWith('\\{{')) {
    return value.substring(1);
  }
  return value;
};

const getExpr = (value: string): Expression | undefined => {
  if (value.startsWith('{{') && value.endsWith('}}')) {
    const expression = value.substring(2, value.length - 2).trim();
    return parse(expression, astFactory) as Expression;
  }
  return;
};

export interface TemplateFunction {
  (model: object): unknown;
}

/**
 * A Renderer is responsible for rendering a block call, like
 * <template name="foo">
 */
// TODO: rename to BlockRenderer?
export interface Renderer {
  (model: any, handlers: TemplateHandlers, renderers: Renderers): unknown;
}

export interface Renderers {
  [name: string]: Renderer;
}

/**
 * A TemplateHandlers is responsible for rendering control flow like
 * <template type="if" if="{{x}}">
 */
export type TemplateHandler = (
  template: HTMLTemplateElement,
  model: object,
  handlers: TemplateHandlers,
  renderers: Renderers
) => unknown;

export interface TemplateHandlers {
  [name: string]: TemplateHandler;
}

export const ifHandler: TemplateHandler = (
  template: HTMLTemplateElement,
  model: object,
  handlers: TemplateHandlers,
  renderers: Renderers
) => {
  const ifAttribute = template.getAttributeNode('if');
  if (ifAttribute !== null && getValue(ifAttribute, model)) {
    // TODO: return a template result
    const litTemplate = getLitTemplate(template);
    const values = litTemplate.parts.map((part) =>
      part.update(model, handlers, renderers)
    );
    const templateResult: CompiledTemplateResult = {
      _$litType$: litTemplate,
      values,
    };
    return templateResult;
  }
  return undefined;
};

export const repeatHandler: TemplateHandler = (
  template: HTMLTemplateElement,
  model: object,
  handlers: TemplateHandlers,
  renderers: Renderers
) => {
  const repeatAttribute = template.getAttributeNode('repeat');
  if (repeatAttribute) {
    const items = getValue(repeatAttribute, model);
    if (!items[Symbol.iterator]) {
      return nothing;
    }
    const litTemplate = getLitTemplate(template);

    let index = -1;
    const result = [];
    for (const item of items) {
      index++;
      const itemModel = Object.create(model);
      itemModel.item = item;
      itemModel.index = index;
      itemModel['this'] = model['this'] ?? model;

      const values = litTemplate.parts.map((part) =>
        part.update(itemModel, handlers, renderers)
      );
      const templateResult: CompiledTemplateResult = {
        _$litType$: litTemplate,
        values,
      };
      result.push(templateResult);
    }
    return result;
  }
  return undefined;
};

export const defaultHandlers = <TemplateHandlers>{
  if: ifHandler,
  repeat: repeatHandler,
};

/**
 * @returns {Function} a template function of the form (model) => TemplateResult
 */
export const prepareTemplate = (
  template: HTMLTemplateElement,
  handlers: TemplateHandlers = defaultHandlers,
  renderers: Renderers = {},
  superTemplate?: HTMLTemplateElement
): TemplateFunction => {
  if (superTemplate) {
    const litTemplate = getLitTemplate(template);
    const templateRenderers = litTemplate.renderers;
    const superLitTemplate = getLitTemplate(superTemplate);
    const superRenderers = superLitTemplate.renderers;
    const superCallRenderer = templateRenderers['super'];

    if (superCallRenderer !== undefined) {
      // Explicit super call

      // render the sub template with:
      renderers = {
        // sub template's own renderes
        ...templateRenderers,
        // passed-in renderers
        ...renderers,
        // a super call renderer
        super: (model, handlers, renderers) => {
          // This renderer delegates to the super block in the sub template,
          // which in turn delegates back to the super renderer below, but with
          // the inner blocks of the super call.
          // when the super call goes, render with:
          renderers = {
            // super template's own blocks
            ...superRenderers,
            // passed-in renderers
            ...renderers,
            // sub template's overrides will be added by the inner super call
            super: (model, handlers, renderers) => {
              return evaluateTemplate(
                superTemplate,
                model,
                handlers,
                renderers
              );
            },
          };
          return superCallRenderer(model, handlers, renderers);
        },
      };
    } else {
      // Implicit super call

      // Wrap the whole template in an implicit super call by rendering the
      // super template first, but using the block renderers from this template.
      // Render the super template with:
      renderers = {
        // super template's own blocks
        ...superRenderers,
        // sub template's overrides
        ...templateRenderers,
        // passed-in renderers
        ...renderers,
      };
      template = superTemplate;
    }
  }

  return (model) => evaluateTemplate(template, model, handlers, renderers);
};

export interface RenderOptions {
  renderers?: Renderers;
  extends?: HTMLTemplateElement;
}

/**
 * Renders a template element containing a Stampino template.
 *
 * This is a convenience function wrapper around:
 *
 * ```
 * import {render} from 'lit';
 * const templateFn = prepareTemplate(templateEl);
 * render(templateFn(model), container);
 * ```
 */
export const render = (
  template: HTMLTemplateElement,
  container: HTMLElement,
  model: any,
  handlers: TemplateHandlers = defaultHandlers
) => {
  const litTemplate = prepareTemplate(template, handlers);
  renderLit(litTemplate(model), container);
};

/**
 * Evaluates the given template and returns its result
 *
 * @param template
 * @param model
 * @param handlers
 * @param renderers
 * @returns
 */
export const evaluateTemplate = (
  template: HTMLTemplateElement,
  model: any,
  handlers: TemplateHandlers = defaultHandlers,
  renderers: Renderers = {}
) => {
  const litTemplate = getLitTemplate(template);
  const values = litTemplate.parts.map((part) =>
    part.update(model, handlers, renderers)
  );
  const templateResult: CompiledTemplateResult = {
    _$litType$: litTemplate,
    values,
  };
  return templateResult;
};

type TemplatePart = Template['parts'][0];

type StampinoTemplatePart = TemplatePart & {
  update: PartUpdater;
};

type PartUpdater = (
  model: object,
  handlers: TemplateHandlers,
  blocks: Renderers
) => unknown;

interface StampinoTemplate extends CompiledTemplate {
  parts: Array<StampinoTemplatePart>;
  renderers: Renderers;
}

const litTemplateCache = new Map<HTMLTemplateElement, StampinoTemplate>();

export const getLitTemplate = (
  template: HTMLTemplateElement
): StampinoTemplate => {
  let litTemplate = litTemplateCache.get(template);
  if (litTemplate === undefined) {
    litTemplateCache.set(template, (litTemplate = makeLitTemplate(template)));
  }
  return litTemplate;
};

const makeLitTemplate = (template: HTMLTemplateElement): StampinoTemplate => {
  const litTemplate: StampinoTemplate = {
    h: '',
    el: template.cloneNode(true) as HTMLTemplateElement,
    parts: [],
    renderers: {},
  };
  const walker = document.createTreeWalker(
    litTemplate.el!.content,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT
  );
  let node: Node | null = walker.currentNode;
  let nodeIndex = -1;
  const elementsToRemove = [];

  while ((node = walker.nextNode()) !== null) {
    nodeIndex++;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (element.tagName === 'TEMPLATE') {
        const type = element.getAttribute('type');
        const name = element.getAttribute('name');

        if (type !== null || name !== null) {
          element.parentNode!.insertBefore(document.createComment(''), element);
          elementsToRemove.push(element);
          let update: PartUpdater;
          if (type !== null) {
            // This is a control-flow call, like if/repeat
            update = (
              model: object,
              handlers: TemplateHandlers,
              renderers: Renderers
            ) => {
              const handler = handlers[type];
              return handler?.(
                element as HTMLTemplateElement,
                model,
                handlers,
                renderers
              );
            };
          } else {
            // This is a named block
            if (name === 'super') {
              litTemplate.renderers['super'] = (
                model: any,
                handlers: TemplateHandlers,
                renderers: Renderers
              ) => {
                // Instead of rendering this block, delegate to a passed in
                // 'super' renderer which will actually render the late-bound
                // super template. We pass that renderer the child blocks from
                // this block for block overrides.
                const superRenderer = renderers['super'];
                const superCallTemplate = getLitTemplate(
                  element as HTMLTemplateElement
                );
                renderers = {
                  ...renderers,
                  ...superCallTemplate.renderers,
                };
                return superRenderer(model, handlers, renderers);
              };
            } else {
              // The renderer renders the contents of the named block
              litTemplate.renderers[name!] = (
                model: any,
                handlers: TemplateHandlers,
                renderers: Renderers
              ) => {
                return evaluateTemplate(
                  element as HTMLTemplateElement,
                  model,
                  handlers,
                  renderers
                );
              };
            }
            // The updater runs when the template is evaluated and functions as a template
            // _call_. It looks for a named renderer, which might be the renderer function
            // above if the block is not overridden.
            update = (
              model: object,
              handlers: TemplateHandlers,
              renderers: Renderers
            ) => {
              const renderer = renderers[name!];
              return renderer?.(model, handlers, renderers);
            };
          }
          litTemplate.parts.push({
            type: 2, // ChildPart
            index: nodeIndex,
            update,
          });
        }
      } else {
        const attributeNames = element.getAttributeNames();
        for (const attributeName of attributeNames) {
          const attributeValue = element.getAttribute(attributeName)!;
          const expr = getExpr(attributeValue);
          if (expr !== undefined) {
            element.removeAttribute(attributeName);
            let name = attributeName;
            let ctor = AttributePart;
            const prefix = attributeName[0];
            if (prefix === '.') {
              name = toCamelCase(attributeName.substring(1));
              ctor = PropertyPart;
            } else if (prefix === '?') {
              name = attributeName.substring(1);
              ctor = BooleanAttributePart;
            } else if (prefix === '@') {
              name = attributeName.substring(1);
              ctor = EventPart;
            }
            litTemplate.parts.push({
              type: 1,
              index: nodeIndex,
              name,
              strings: ['', ''],
              ctor,
              update: (model: object, _handlers: TemplateHandlers) =>
                expr.evaluate(model),
            });
          }
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      let textNode = node as Text;
      const text = textNode.textContent!;
      const strings = text.split(/(?<!\\){{(.*?)(?:(?<!\\)}})/g);
      if (strings.length > 1) {
        textNode.textContent = strings[0].replace('\\{{', '{{');
      } else {
        // TODO: do this better
        textNode.textContent = text.replace('\\{{', '{{');
      }
      for (let i = 1; i < strings.length; i += 2) {
        const exprText = strings[i];
        const expr = parse(exprText, astFactory) as Expression;
        litTemplate.parts.push({
          type: 2,
          index: ++nodeIndex,
          update: (model: unknown, _handlers: TemplateHandlers) =>
            expr.evaluate(model as Scope),
        });
        const newTextNode = new Text(strings[i + 1].replace('\\{{', '{{'));
        textNode.parentNode!.insertBefore(newTextNode, textNode.nextSibling);
        textNode = newTextNode;
      }
    } else {
      console.warn(`unhandled nodeType: ${node.nodeType}`);
    }
  }
  for (const e of elementsToRemove) {
    e.remove();
  }
  return litTemplate;
};
