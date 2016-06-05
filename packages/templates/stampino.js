define("stampino", ["require", "exports", 'incremental-dom', 'polymer-expressions/parser', 'polymer-expressions/eval'], function (require, exports, idom, parser_1, eval_1) {
    "use strict";
    var astFactory = new eval_1.EvalAstFactory();
    var toCamelCase = function (s) { return s.replace(/-(\w)/, function (_, p1) { return p1.toUppercase(); }); };
    idom.attributes.__default = function (element, name, value) {
        if (name.endsWith('$')) {
            name = name.substring(0, name.length - 1);
            element.setAttribute(name, value);
        }
        else {
            element[toCamelCase(name)] = value;
        }
    };
    var _expressionCache = new WeakMap();
    function getValue(node, model) {
        var ast = _expressionCache.get(node);
        if (ast) {
            return ast.evaluate(model);
        }
        var value = node.textContent;
        if (value.startsWith('{{') && value.endsWith('}}')) {
            var expression = value.substring(2, value.length - 2).trim();
            ast = (new parser_1.Parser(expression, astFactory).parse());
            _expressionCache.set(node, ast);
            return ast.evaluate(model);
        }
        if (value.startsWith('\\{{')) {
            return value.substring(1);
        }
        return value;
    }
    exports.getValue = getValue;
    var defaultHandlers = {
        'if': function (template, model, renderers, handlers, attributeHandler) {
            var ifAttribute = template.getAttributeNode('if');
            if (ifAttribute && getValue(ifAttribute, model)) {
                renderNode(template.content, model, renderers, handlers, attributeHandler);
            }
        },
        'repeat': function (template, model, renderers, handlers, attributeHandler) {
            var repeatAttribute = template.getAttributeNode('repeat');
            if (repeatAttribute) {
                var items = getValue(repeatAttribute, model);
                for (var index = 0; index < items.length; index++) {
                    var item = items[index];
                    // TODO: provide keys to incremental-dom
                    var itemModel = Object.create(model);
                    itemModel.item = item;
                    itemModel.index = index;
                    itemModel['this'] = model['this'] || model;
                    renderNode(template.content, itemModel, renderers, handlers, attributeHandler);
                }
            }
        },
    };
    function getRenderers(template) {
        var blocks = template.content.querySelectorAll('template[name]');
        var renderers = {};
        var _loop_1 = function(i) {
            var block = blocks[i];
            var name_1 = block.getAttribute('name');
            if (name_1 !== 'super') {
                renderers[name_1] = function (model, renderers, handlers, attributeHandler) {
                    return renderNode(block.content, model, renderers, handlers, attributeHandler);
                };
            }
        };
        for (var i = 0; i < blocks.length; i++) {
            _loop_1(i);
        }
        return renderers;
    }
    /**
     * @returns {Function} a render function that can be passed to incremental-dom's
     * patch() function.
     */
    function prepareTemplate(template, renderers, handlers, attributeHandler, superTemplate) {
        handlers = handlers || defaultHandlers;
        renderers = renderers || {};
        if (superTemplate) {
            var superNode = template.content.querySelector('[name=super]');
            if (superNode) {
                var superRenderers_1 = getRenderers(superNode);
                renderers = {
                    'super': function (model, renderers, handlers, attributeHandler) {
                        renderNode(superTemplate.content, model, superRenderers_1, handlers, attributeHandler);
                    },
                };
            }
            else {
                // Wrap the whole template in an implicit super call: immediately render
                // the super template, with all renderers from this template
                var templateRenderers = getRenderers(template);
                Object.assign(templateRenderers, renderers);
                renderers = templateRenderers;
                template = superTemplate;
            }
        }
        return function (model) { return renderNode(template.content, model, renderers, handlers, attributeHandler); };
    }
    exports.prepareTemplate = prepareTemplate;
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
    function render(template, container, model, opts) {
        var _render = prepareTemplate(template, opts.renderers, opts.handlers, opts.attributeHandler, opts.extends);
        idom.patch(container, _render, model);
    }
    exports.render = render;
    function renderNode(node, model, renderers, handlers, attributeHandler) {
        switch (node.nodeType) {
            // We encounter DocumentFragments when we recurse into a nested template
            case Node.DOCUMENT_FRAGMENT_NODE:
                var children = node.childNodes;
                for (var i = 0; i < children.length; i++) {
                    renderNode(children[i], model, renderers, handlers, attributeHandler);
                }
                break;
            case Node.ELEMENT_NODE:
                var element = node;
                if (element.tagName.toLowerCase() === 'template') {
                    var template = element;
                    // Handle template types, like: 'if' and 'repeat'
                    var typeAttribute = element.getAttribute('type');
                    if (typeAttribute) {
                        var handler = handlers[typeAttribute];
                        if (handler) {
                            handler(template, model, renderers, handlers, attributeHandler);
                        }
                        else {
                            console.warn('No handler for template type', typeAttribute);
                            return;
                        }
                    }
                    // Handle named holes
                    var nameAttribute = element.getAttribute('name');
                    if (nameAttribute) {
                        if (renderers) {
                            var renderer = renderers[nameAttribute];
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
                }
                else {
                    // elementOpen has a weird API. It takes varargs, so we need to build
                    // up the arguments array to pass to Function.apply :(
                    var args = [element.tagName, null, null];
                    var attributes = element.attributes;
                    var handledAttributes = [];
                    for (var i = 0; i < attributes.length; i++) {
                        var attr = attributes[i];
                        if (attributeHandler && attributeHandler.matches(attr.name)) {
                            handledAttributes.push(attr);
                        }
                        else {
                            // TODO: if attribute is a literal, add it to statics instead
                            args.push(attr.name);
                            args.push(getValue(attr, model));
                        }
                    }
                    var el = idom.elementOpen.apply(null, args);
                    for (var i = 0; i < handledAttributes.length; i++) {
                        var attr = handledAttributes[i];
                        attributeHandler.handle(el, attr.name, attr.value, model);
                    }
                    var children_1 = node.childNodes;
                    for (var i = 0; i < children_1.length; i++) {
                        renderNode(children_1[i], model, renderers, handlers, attributeHandler);
                    }
                    idom.elementClose(element.tagName);
                }
                break;
            case Node.TEXT_NODE:
                var value = getValue(node, model);
                idom.text(value);
                break;
            default:
                console.warn('unhandled node type', node.nodeType);
        }
    }
    exports.renderNode = renderNode;
});
