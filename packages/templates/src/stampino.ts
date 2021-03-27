import * as idom from 'incremental-dom';
import { Parser, EvalAstFactory } from 'jexpr';
import type { Expression } from 'jexpr/lib/eval';

let astFactory = new EvalAstFactory();

const toCamelCase = (s: string) => s.replace(/-(\w)/, (_, p1) => p1.toUppercase());

idom.attributes.__default = function(element: Element, name: string, value: any) {
  if (name.endsWith('$')) {
    name = name.substring(0, name.length - 1);
    element.setAttribute(name, value);
  } else {
    element[toCamelCase(name)] = value;
  }
};

let _expressionCache = new WeakMap<Node, Expression>();

export function getValue(node: Node, model: any) {
  let ast = _expressionCache.get(node);
  if (ast) {
    return ast.evaluate(model);
  }
  let value = node.textContent;
  if (value.startsWith('{{') && value.endsWith('}}')) {
    let expression = value.substring(2, value.length - 2).trim();
    ast = <Expression>(new Parser(expression, astFactory).parse());
    _expressionCache.set(node, ast);
    return ast.evaluate(model);
  }
  if (value.startsWith('\\{{')) {
    return value.substring(1);
  }
  return value;
}

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
  (model: any, renderers: Renderers, handlers: Handlers,
    attributeHandler: AttributeHandler): void;
}

export interface Handler {
  (template: HTMLTemplateElement, model: any, renderers: Renderers,
    handlers: Handlers, attributeHandler: AttributeHandler): void;
}

export interface Handlers {
  [name: string]: Handler;
}

const defaultHandlers = <Handlers>{
  'if': function(template, model, renderers, handlers, attributeHandler) {
    let ifAttribute = template.getAttributeNode('if');
    if (ifAttribute && getValue(ifAttribute, model)) {
      renderNode(template.content, model, renderers, handlers, attributeHandler);
    }
  },

  'repeat': function(template, model, renderers, handlers, attributeHandler) {
    let repeatAttribute = template.getAttributeNode('repeat');

    if (repeatAttribute) {
      let items = getValue(repeatAttribute, model) ?? [];
      for (let index = 0; index < items.length; index++) {
        let item = items[index];
        // TODO: provide keys to incremental-dom
        let itemModel = Object.create(model);
        itemModel.item = item;
        itemModel.index = index;
        itemModel['this'] = model['this'] || model;
        renderNode(template.content, itemModel, renderers, handlers, attributeHandler);
      }
    }
  },
};

function getRenderers(template: HTMLTemplateElement): Renderers {
  let blocks = <NodeListOf<HTMLTemplateElement>>
    template.content.querySelectorAll('template[name]');
  let renderers = <Renderers>{};
  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];
    let name = block.getAttribute('name');
    if (name !== 'super') {
      renderers[name] = (model, renderers, handlers, attributeHandler) =>
          renderNode(block.content, model, renderers, handlers, attributeHandler);
    }
  }
  return renderers;
}

/**
 * @returns {Function} a render function that can be passed to incremental-dom's
 * patch() function.
 */
export function prepareTemplate(
    template: HTMLTemplateElement,
    renderers?: Renderers,
    handlers?: Handlers,
    attributeHandler?: AttributeHandler,
    superTemplate?: HTMLTemplateElement): TemplateUpdater {
  handlers = handlers || defaultHandlers;
  renderers = renderers || {};

  if (superTemplate) {
    let superNode = <HTMLTemplateElement>
      template.content.querySelector('[name=super]');
    if (superNode) {
      let superRenderers = getRenderers(superNode);
      renderers = {
        'super': (model, renderers, handlers, attributeHandler) => {
          renderNode(superTemplate.content, model, superRenderers, handlers,
              attributeHandler);
        },
      };
    } else {
      // Wrap the whole template in an implicit super call: immediately render
      // the super template, with all renderers from this template
      let templateRenderers = getRenderers(template);
      Object.assign(templateRenderers, renderers);
      renderers = templateRenderers;
      template = superTemplate;
    }
  }

  return (model) => renderNode(template.content, model, renderers, handlers,
      attributeHandler);
}

export interface RenderOptions {
  attributeHandler?: AttributeHandler;
  renderers?: Renderers;
  handlers?: Handlers;
  extends?: HTMLTemplateElement;
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
export function render(
    template: HTMLTemplateElement,
    container: Element|DocumentFragment,
    model: any,
    opts?: RenderOptions) {
  let _render = prepareTemplate(template, opts?.renderers, opts?.handlers,
      opts?.attributeHandler, opts?.extends);
  idom.patch(container, _render, model);
}

export function renderNode(
    node: Node,
    model: any,
    renderers: Renderers,
    handlers: Handlers,
    attributeHandler: AttributeHandler) {
  switch (node.nodeType) {
    // We encounter DocumentFragments when we recurse into a nested template
    case Node.DOCUMENT_FRAGMENT_NODE:
      let children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        renderNode(children[i], model, renderers, handlers, attributeHandler);
      }
      break;
    case Node.ELEMENT_NODE:
      let element = <Element>node;
      if (element.tagName.toLowerCase() === 'template') {
        let template = <HTMLTemplateElement>element;
        // Handle template types, like: 'if' and 'repeat'
        let typeAttribute = element.getAttribute('type');
        if (typeAttribute) {
          let handler = handlers[typeAttribute];
          if (handler) {
            handler(template, model, renderers, handlers, attributeHandler);
          } else {
            console.warn('No handler for template type', typeAttribute);
            return;
          }
        }
        // Handle named holes
        let nameAttribute = element.getAttribute('name');
        if (nameAttribute) {
          if (renderers) {
            let renderer = renderers[nameAttribute];
            if (renderer) {
              // TS revealed a type error here:
              renderer(model, renderers, handlers, attributeHandler);
              // renderer(template, model, renderers, handlers, attributeHandler);
              return;
            }
          }
          // if there's no named renderer, render the default content
          renderNode(template.content, model, renderers, handlers, attributeHandler);
          return;
        }
        // by default, templates are not rendered
      } else {
        // elementOpen has a weird API. It takes varargs of alternating
        // attribute name/value pairs
        let propertyValuePairs: any[] = [];
        let attributes = element.attributes;
        let handledAttributes = <Attr[]>[];
        for (let i = 0; i < attributes.length; i++) {
          let attr = attributes[i];
          if (attributeHandler && attributeHandler.matches(attr.name)) {
            handledAttributes.push(attr);
          } else {
            // TODO: if attribute is a literal, add it to statics instead
            propertyValuePairs.push(attr.name);
            propertyValuePairs.push(getValue(attr, model));
          }
        }
        let tagName = element.tagName.toLowerCase();
        let el = idom.elementOpen(tagName, null, null, ...propertyValuePairs);

        for (let i = 0; i < handledAttributes.length; i++) {
          let attr = handledAttributes[i];
          attributeHandler.handle(el, attr.name, attr.value, model);
        }

        let children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
          renderNode(children[i], model, renderers, handlers, attributeHandler);
        }
        idom.elementClose(element.tagName.toLowerCase());
      }
      break;
    case Node.TEXT_NODE:
      let value = getValue(node, model);
      idom.text(value);
      break;
    default:
      console.warn('unhandled node type', node.nodeType);
  }
}
