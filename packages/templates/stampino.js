'use strict';

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'incremental-dom', 'polymer-expressions/parser', 'polymer-expressions/eval'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('incremental-dom'), require('polymer-expressions/parser'), require('polymer-expressions/eval'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.incrementalDom, global.parser, global.eval);
    global.stampino = mod.exports;
  }
})(this, function (exports, _incrementalDom, _parser, _eval) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.getValue = getValue;
  exports.prepareTemplate = prepareTemplate;
  exports.render = render;
  exports.renderNode = renderNode;

  var idom = _interopRequireWildcard(_incrementalDom);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  var astFactory = new _eval.EvalAstFactory();

  idom.attributes.__default = function (element, name, value) {
    if (name.endsWith('$')) {
      name = name.substring(0, name.length - 1);
      element.setAttribute(name, value);
    } else {
      element[name] = value;
    }
  };

  function getValue(value, model) {
    if (value.startsWith('{{') && value.endsWith('}}')) {
      var expression = value.substring(2, value.length - 2);
      var ast = new _parser.Parser(expression, astFactory).parse();
      return ast.evaluate(model);
    }

    if (value.startsWith('\\{{')) {
      return value.substring(1);
    }

    return value;
  }

  var defaultHandlers = {
    'if': function _if(template, model, renderers, handlers, attributeHandler) {
      var ifAttribute = template.getAttribute('if');

      if (ifAttribute && getValue(ifAttribute, model)) {
        renderNode(template.content, model, renderers, handlers, attributeHandler);
      }
    },
    'repeat': function repeat(template, model, renderers, handlers, attributeHandler) {
      var repeatAttribute = template.getAttribute('repeat');

      if (repeatAttribute) {
        var items = getValue(repeatAttribute, model);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;
            var itemModel = Object.create(model);
            itemModel.item = item;
            renderNode(template.content, itemModel, renderers, handlers, attributeHandler);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }
  };

  function getRenderers(template) {
    var blocks = template.content.querySelectorAll('[name]');
    var renderers = {};

    var _loop = function _loop(i) {
      var block = blocks[i];
      var name = block.getAttribute('name');

      if (name !== 'super') {
        renderers[name] = function (model, renderers, handlers, attributeHandler) {
          return renderNode(block.content, model, renderers, handlers, attributeHandler);
        };
      }
    };

    for (var i = 0; i < blocks.length; i++) {
      _loop(i);
    }

    return renderers;
  }

  function prepareTemplate(template, renderers, handlers, attributeHandler, superTemplate) {
    handlers = handlers || defaultHandlers;
    renderers = renderers || {};

    if (superTemplate) {
      var superNode = template.content.querySelector('[name=super]');

      if (superNode) {
        (function () {
          var superRenderers = getRenderers(superNode);
          renderers = {
            'super': function _super(model, renderers, handlers, attributeHandler) {
              renderNode(superTemplate.content, model, superRenderers, handlers, attributeHandler);
            }
          };
        })();
      } else {
        var templateRenderers = getRenderers(template);
        Object.assign(templateRenderers, renderers);
        renderers = templateRenderers;
        template = superTemplate;
      }
    }

    return function (model) {
      return renderNode(template.content, model, renderers, handlers, attributeHandler);
    };
  }

  function render(template, container, model, opts) {
    console.log('stampino.render', opts.attributeHandler);

    var _render = prepareTemplate(template, opts.renderers, opts.handlers, opts.attributeHandler, opts.extends);

    idom.patch(container, _render, model);
  }

  function renderNode(node, model, renderers, handlers, attributeHandler) {
    switch (node.nodeType) {
      case Node.DOCUMENT_FRAGMENT_NODE:
        var children = node.childNodes;

        for (var i = 0; i < children.length; i++) {
          renderNode(children[i], model, renderers, handlers, attributeHandler);
        }

        break;

      case Node.ELEMENT_NODE:
        if (node.tagName.toLowerCase() === 'template') {
          var typeAttribute = node.getAttribute('type');

          if (typeAttribute) {
            var handler = handlers[typeAttribute];

            if (handler) {
              handler(node, model, renderers, handlers, attributeHandler);
            } else {
              console.warn('No handler for template type', typeAttribute);
              return;
            }
          }

          var nameAttribute = node.getAttribute('name');

          if (nameAttribute) {
            if (renderers) {
              var renderer = renderers[nameAttribute];

              if (renderer) {
                renderer(node, model, renderers, handlers, attributeHandler);
                return;
              }
            }

            renderNode(node.content, model, renderers, handlers, attributeHandler);
            return;
          }
        } else {
          var args = [node.tagName, null, null];
          var attributes = node.attributes;
          var handledAttributes = [];

          for (var i = 0; i < attributes.length; i++) {
            var attr = attributes[i];

            if (attributeHandler && attributeHandler.matches(attr.name)) {
              handledAttributes.push(attr);
            } else {
              args.push(attr.name);
              args.push(getValue(attr.value, model));
            }
          }

          var el = idom.elementOpen.apply(null, args);

          for (var i = 0; i < handledAttributes.length; i++) {
            var attr = handledAttributes[i];
            attributeHandler.handle(el, attr.name, attr.value, model);
          }

          var _children = node.childNodes;

          for (var i = 0; i < _children.length; i++) {
            renderNode(_children[i], model, renderers, handlers, attributeHandler);
          }

          idom.elementClose(node.tagName);
        }

        break;

      case Node.TEXT_NODE:
        var value = getValue(node.nodeValue, model);
        idom.text(value);
        break;

      default:
        console.warn('unhandled node type', node.nodeType);
    }
  }
});