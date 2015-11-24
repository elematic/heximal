import * as idom from 'incremental-dom';
import { Parser } from 'polymer-expressions/parser';
import { EvalAstFactory } from 'polymer-expressions/eval';

let astFactory = new EvalAstFactory();

idom.attributes.__default = function(element, name, value) {
  if (name.endsWith('$')) {
    name = name.substring(0, name.length - 1);
    element.setAttribute(name, value);
  } else {
    element[name] = value;
  }
};

function getValue(value, model) {
  if (value.startsWith('{{') && value.endsWith('}}')) {
    let expression = value.substring(2, value.length - 2);
    let ast = new Parser(expression, astFactory).parse();
    return ast.evaluate(model);
  }
  if (value.startsWith('\\{{')) {
    return value.substring(1);
  }
  return value;
}

const defaultHandlers = {
  'if': function(template, model, renderers, handlers) {
    let ifAttribute = template.getAttribute('if');
    if (ifAttribute && getValue(ifAttribute, model)) {
      _render(template.content, model, renderers, handlers);
    }
  },

  'repeat': function(template, model, renderers, handlers) {
    let repeatAttribute = template.getAttribute('repeat');

    if (repeatAttribute) {
      let items = getValue(repeatAttribute, model);
      for (let item of items) {
        // TODO: provide keys to incremental-dom
        let itemModel = Object.create(model);
        itemModel.item = item;
        _render(template.content, itemModel, renderers, handlers);
      }
    }
  },
};

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
export function render(template, container, model, opts) {
  opts = opts || {};
  let _extends = opts.extends;
  let handlers = opts.handlers || defaultHandlers;
  let renderers = opts.renderers || {};

  if (_extends) {
    // TODO: this only finds unnested named templates. Named templates nested
    // in other templates won't be returned by querySelectorAll, although it's
    // slightly unclear what they would mean when filling a hole, vs defining
    // one. It's probably best to actually tighten this restriction and require
    // named templates be top-level
    // TODO: super support
    let namedTemplates = template.content.querySelectorAll('[name]');
    for (let i = 0; i < namedTemplates.length; i++) {
      let t = namedTemplates[i];
      console.assert(t);
      let name = t.getAttribute('name');
      renderers[name] = (model, renderers, handlers) =>
          _render(t.content, model, renderers, handlers);
    }
    template = _extends;
  }

  idom.patch(container, () => _render(template.content, model, renderers, handlers), model);
}

function _render(node, model, renderers, handlers) {
  switch (node.nodeType) {
    // We encounter DocumentFragments when we recurse into a nested template
    case Node.DOCUMENT_FRAGMENT_NODE:
      let children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        _render(children[i], model, renderers, handlers);
      }
      break;
    case Node.ELEMENT_NODE:
      if (node.tagName.toLowerCase() === 'template') {
        // Handle template types, like: 'if' and 'repeat'
        let typeAttribute = node.getAttribute('type');
        if (typeAttribute) {
          let handler = handlers[typeAttribute];
          if (handler) {
            handler(node, model, renderers, handlers);
          } else {
            console.warn('No handler for template type', typeAttribute);
            return;
          }
        }
        // Handle named holes
        let nameAttribute = node.getAttribute('name');
        if (nameAttribute) {
          if (renderers) {
            let renderer = renderers[nameAttribute];
            if (renderer) {
              renderer(model, renderers, handlers);
              return;
            }
          }
          // if there's no named renderer, render the default content
          _render(node.content, model, renderers, handlers);
          return;
        }
        // by default, templates are not rendered
      } else {
        // elementOpen has a weird API. It takes varargs, so we need to build
        // up the arguments array to pass to Function.apply :(
        let args = [node.tagName, null, null];
        let attributes = node.attributes;
        for (let i = 0; i < attributes.length; i++) {
          // TODO: if attribute is a literal, add it to statics instead
          args.push(attributes[i].name);
          args.push(getValue(attributes[i].value, model));
        }
        idom.elementOpen.apply(null, args);
        let children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
          _render(children[i], model, renderers);
        }
        idom.elementClose(node.tagName);
      }
      break;
    case Node.TEXT_NODE:
      let value = getValue(node.nodeValue, model);
      idom.text(value);
      break;
    default:
      console.warn('unhandled node type', node.nodeType);
  }
}
