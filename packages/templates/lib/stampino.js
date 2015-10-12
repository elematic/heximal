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
  return value;
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
export function render(template, container, model, opts) {
  opts = opts || {};
  let _extends = opts.extends;
  if (_extends) {
    // TODO: this only finds unnested named templates. Named templates nested
    // in other templates won't be returned by querySelectorAll, although it's
    // slightly unclear what they would mean when filling a hole, vs defining
    // one. It's probably best to actually tighten this restriction and require
    // named templates be top-level
    // TODO: super support
    let namedTemplates = template.content.querySelectorAll('[name]');
    let renderers = {};
    for (let i = 0; i < namedTemplates.length; i++) {
      let t = namedTemplates[i];
      let name = t.getAttribute('name');
      renderers[name] = (model, renderers) => _render(t.content, model, renderers);
    }
    idom.patch(container, () => _render(_extends.content, model, renderers), model);
  } else {
    idom.patch(container, () => _render(template.content, model), model);
  }
}

function _render(node, model, renderers) {
  switch (node.nodeType) {
    case Node.DOCUMENT_FRAGMENT_NODE:
      let children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        _render(children[i], model, renderers);
      }
      break;
    case Node.ELEMENT_NODE:
      if (node.tagName.toLowerCase() === 'template') {
        // Handle named holes
        let nameAttribute = node.getAttribute('name');
        if (nameAttribute) {
          if (renderers) {
            let renderer = renderers[nameAttribute];
            if (renderer) {
              renderer(model, renderers);
              return;
            }
          }
          // if there's no named renderer, render the default content
          _render(node.content, model, renderers);
          return;
        }

        // Handle conditionals and repeats
        let ifAttribute = node.getAttribute('if');
        let repeatAttribute = node.getAttribute('repeat');
        let doRender = ifAttribute && getValue(ifAttribute, model);

        if (repeatAttribute) {
          if (!ifAttribute || doRender) {
            let items = getValue(repeatAttribute, model);
            for (let item of items) {
              // TODO: provide keys to incremental-dom
              let itemModel = Object.create(model);
              itemModel.item = item;
              _render(node.content, itemModel, renderers);
            }
          }
        } else if (doRender) {
          _render(node.content, model, renderers);
        }
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
