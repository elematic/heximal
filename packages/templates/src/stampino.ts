import {render as renderLit, TemplateInstance, nothing} from 'lit-html';
import {CompiledTemplate, CompiledTemplateResult} from 'lit-html';

import {parse, Parser, EvalAstFactory} from 'jexpr';
import type {Expression, Scope} from 'jexpr/lib/eval';

import {_$LH} from 'lit-html/private-ssr-support.js';
const {AttributePart, PropertyPart, BooleanAttributePart, EventPart} = _$LH;

const astFactory = new EvalAstFactory();
const expressionCache = new Map<string, Expression | undefined>();

const toCamelCase = (s: string) =>
  s.replace(/-(-|\w)/g, (_, p1: string) => p1.toUpperCase());

/**
 * Gets the value from a string that contains a delimted expression: {{ ... }}
 */
const getSingleValue = (s: string, model: any) => {
  let ast = expressionCache.get(s);
  if (ast === undefined) {
    if (expressionCache.has(s)) {
      return undefined;
    }
    s = s.trim();
    if (s.startsWith('{{') && s.endsWith('}}')) {
      const expression = s.substring(2, s.length - 2).trim();
      ast = new Parser(expression, astFactory).parse();
      expressionCache.set(s, ast);
    }
  }
  return ast?.evaluate(model);
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
  renderers: Renderers,
) => unknown;

export interface TemplateHandlers {
  [name: string]: TemplateHandler;
}

export const ifHandler: TemplateHandler = (
  template: HTMLTemplateElement,
  model: object,
  handlers: TemplateHandlers,
  renderers: Renderers,
) => {
  const ifAttribute = template.getAttribute('if');
  if (ifAttribute !== null && getSingleValue(ifAttribute, model)) {
    return evaluateTemplate(template, model, handlers, renderers);
  }
  return undefined;
};

const bindingRegex = /(?<!\\){{(.*?)(?:(?<!\\)}})/g;

const hasEscapedBindingMarkers = (s: string) => /(?:\\{{)|(?:\\}})/g.test(s);

const unescapeBindingMarkers = (s: string) =>
  s.replaceAll(/\\{{/g, '{{').replace(/\\}}/g, '}}');

export const repeatHandler: TemplateHandler = (
  template: HTMLTemplateElement,
  model: object & {this?: unknown},
  handlers: TemplateHandlers,
  renderers: Renderers,
) => {
  const repeatAttribute = template.getAttribute('repeat');
  if (repeatAttribute !== null) {
    const items = getSingleValue(repeatAttribute, model);
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

      const values = [];
      for (const part of litTemplate.parts) {
        const value = part.update(itemModel, handlers, renderers);
        if (part.type === 1) {
          values.push(...(value as Iterable<unknown>));
        } else {
          values.push(value);
        }
      }
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
  superTemplate?: HTMLTemplateElement,
): TemplateFunction => {
  const litTemplate = getLitTemplate(template);
  const templateRenderers = litTemplate.renderers;
  if (superTemplate) {
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
                renderers,
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
  } else {
    // No super call
    renderers = {
      // template's named blocks
      ...templateRenderers,
      // passed-in renderers
      ...renderers,
    };
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
  handlers: TemplateHandlers = defaultHandlers,
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
  renderers: Renderers = {},
) => {
  const litTemplate = getLitTemplate(template);
  const values: Array<unknown> = [];
  for (const part of litTemplate.parts) {
    const value = part.update(model, handlers, renderers);
    if (part.type === 1) {
      values.push(...(value as Iterable<unknown>));
    } else {
      values.push(value);
    }
  }
  const templateResult: CompiledTemplateResult = {
    _$litType$: litTemplate,
    values,
  };
  return templateResult;
};

type TemplatePart = TemplateInstance['_$template']['parts'][0];

type StampinoTemplatePart = TemplatePart & {
  update: PartUpdater;
};

type PartUpdater = (
  model: object,
  handlers: TemplateHandlers,
  blocks: Renderers,
) => unknown;

interface StampinoTemplate extends CompiledTemplate {
  parts: Array<StampinoTemplatePart>;
  renderers: Renderers;
}

const litTemplateCache = new Map<HTMLTemplateElement, StampinoTemplate>();

export const getLitTemplate = (
  template: HTMLTemplateElement,
): StampinoTemplate => {
  let litTemplate = litTemplateCache.get(template);
  if (litTemplate === undefined) {
    litTemplateCache.set(template, (litTemplate = makeLitTemplate(template)));
  }
  return litTemplate;
};

const makeLitTemplate = (template: HTMLTemplateElement): StampinoTemplate => {
  const litTemplate: StampinoTemplate = {
    h: undefined as unknown as TemplateStringsArray,
    el: template.cloneNode(true) as HTMLTemplateElement,
    parts: [],
    renderers: {},
  };
  const walker = document.createTreeWalker(
    litTemplate.el!.content,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT,
  );
  let node: Node | null = walker.currentNode;
  let nodeIndex = -1;
  const elementsToRemove = [];

  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      nodeIndex++;
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
              renderers: Renderers,
            ) => {
              const handler = handlers[type];
              return handler?.(
                element as HTMLTemplateElement,
                model,
                handlers,
                renderers,
              );
            };
          } else {
            // This is a named block
            if (name === 'super') {
              litTemplate.renderers['super'] = (
                model: any,
                handlers: TemplateHandlers,
                renderers: Renderers,
              ) => {
                // Instead of rendering this block, delegate to a passed in
                // 'super' renderer which will actually render the late-bound
                // super template. We pass that renderer the child blocks from
                // this block for block overrides.
                const superRenderer = renderers['super'];
                const superCallTemplate = getLitTemplate(
                  element as HTMLTemplateElement,
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
                renderers: Renderers,
              ) => {
                return evaluateTemplate(
                  element as HTMLTemplateElement,
                  model,
                  handlers,
                  renderers,
                );
              };
            }
            // The updater runs when the template is evaluated and functions as
            // a template _call_. It looks for a named renderer, which might be
            // the renderer function above if the block is not overridden.
            update = (
              model: object,
              handlers: TemplateHandlers,
              renderers: Renderers,
            ) => {
              const renderer = renderers[name!];
              return renderer?.(model, handlers, renderers);
            };
          }
          litTemplate.parts.push({
            type: 2, // text binding
            index: nodeIndex,
            update,
          });
        }
      } else {
        const attributeNames = element.getAttributeNames();
        for (const attributeName of attributeNames) {
          const attributeValue = element.getAttribute(attributeName)!;
          // TODO: use alternative to negative lookbehind
          // (but it's so convenient!)
          const splitValue = attributeValue.split(bindingRegex);
          if (splitValue.length === 1) {
            if (hasEscapedBindingMarkers(attributeValue)) {
              element.setAttribute(
                attributeName,
                unescapeBindingMarkers(attributeValue),
              );
            }
            continue;
          }
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
            name = toCamelCase(attributeName.substring(1));
            ctor = EventPart;
          }

          const strings = [unescapeBindingMarkers(splitValue[0])];
          const exprs: Array<Expression> = [];
          for (let i = 1; i < splitValue.length; i += 2) {
            const exprText = splitValue[i];
            exprs.push(parse(exprText, astFactory) as Expression);
            strings.push(unescapeBindingMarkers(splitValue[i + 1]));
          }

          litTemplate.parts.push({
            type: 1, // attribute binding
            index: nodeIndex,
            name,
            strings,
            ctor,
            update: (
              model: object,
              _handlers: TemplateHandlers,
              _renderers: Renderers,
            ) => {
              return exprs.map((expr) => expr.evaluate(model));
            },
          });
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      let textNode = node as Text;
      const text = textNode.textContent!;
      const strings = text.split(bindingRegex);
      if (strings.length > 1) {
        textNode.textContent = unescapeBindingMarkers(strings[0]);
      } else if (hasEscapedBindingMarkers(text)) {
        textNode.textContent = unescapeBindingMarkers(text);
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
        textNode.parentNode!.insertBefore(
          document.createComment(''),
          textNode.nextSibling,
        );
        textNode = newTextNode;
        // This TreeWalker isn't configured to walk comment nodes, but this
        // node will be returned next time through the loop. This is the easiest
        // way to get the walker to proceed to the next successor after the
        // marker, even when the marker doesn't have a nextSibling
        walker.currentNode = newTextNode;
      }
    }
  }
  for (const e of elementsToRemove) {
    e.remove();
  }
  return litTemplate;
};
