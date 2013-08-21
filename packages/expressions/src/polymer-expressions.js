// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function (global) {
  'use strict';

  // SideTable is a weak map where possible. If WeakMap is not available the
  // association is stored as an expando property.
  var SideTable;
  // TODO(arv): WeakMap does not allow for Node etc to be keys in Firefox
  if (typeof WeakMap !== 'undefined' && navigator.userAgent.indexOf('Firefox/') < 0) {
    SideTable = WeakMap;
  } else {
    (function() {
      var defineProperty = Object.defineProperty;
      var hasOwnProperty = Object.hasOwnProperty;
      var counter = new Date().getTime() % 1e9;

      SideTable = function() {
        this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
      };

      SideTable.prototype = {
        set: function(key, value) {
          defineProperty(key, this.name, {value: value, writable: true});
        },
        get: function(key) {
          return hasOwnProperty.call(key, this.name) ? key[this.name] : undefined;
        },
        delete: function(key) {
          this.set(key, undefined);
        }
      }
    })();
  }

  // JScript does not have __proto__. We wrap all object literals with
  // createObject which uses Object.create, Object.defineProperty and
  // Object.getOwnPropertyDescriptor to create a new object that does the exact
  // same thing. The main downside to this solution is that we have to extract
  // all those property descriptors for IE.
  var createObject = ('__proto__' in {}) ?
      function(obj) { return obj; } :
      function(obj) {
        var proto = obj.__proto__;
        if (!proto)
          return obj;
        var newObject = Object.create(proto);
        Object.getOwnPropertyNames(obj).forEach(function(name) {
          Object.defineProperty(newObject, name,
                               Object.getOwnPropertyDescriptor(obj, name));
        });
        return newObject;
      };

  var identStart = '[\$_a-zA-Z]';
  var identPart = '[\$_a-zA-Z0-9]';
  var ident = identStart + '+' + identPart + '*';
  var capturedIdent = '(' + ident + ')';
  var elementIndex = '(?:[0-9]|[1-9]+[0-9]+)';
  var identOrElementIndex = '(?:' + ident + '|' + elementIndex + ')';
  var path = '(?:' +
                identOrElementIndex +
              ')(?:\\.' +
                identOrElementIndex +
              ')*';

  var pathPattern = new RegExp('^' + path + '$');
  var repeatPattern = new RegExp('^' + capturedIdent + '\\s* in (.*)$');
  var bindPattern = new RegExp('^(.*) as \\s*' + capturedIdent + '$');

  var templateScopeTable = new SideTable;

  function getNamedScopeBinding(model, pathString, name, node) {
    if (node.nodeType !== Node.ELEMENT_NODE || node.tagName !== 'TEMPLATE' ||
       (name !== 'bind' && name !== 'repeat')) {
      return;
    }

    var ident, expressionText;
    var match = pathString.match(repeatPattern);
    if (match) {
      ident = match[1];
      expressionText = match[2];
    } else {
      match = pathString.match(bindPattern);
      if (match) {
        ident = match[2];
        expressionText = match[1];
      }
    }
    if (!match)
      return;

    var binding;
    expressionText = expressionText.trim();
    if (expressionText.match(pathPattern)) {
      binding = new CompoundBinding(function(values) {
        return values.path;
      });
      binding.bind('path', model, expressionText);
    } else {
      try {
        binding = getExpressionBinding(model, expressionText);
      } catch (ex) {
        console.error('Invalid expression syntax: ' + expressionText, ex);
      }
    }

    if (!binding)
      return;

    templateScopeTable.set(node, ident);
    return binding;
  }

  function getExpressionBinding(model, expressionText) {
    try {
      // TODO(rafaelw): Cache expressions.
      var delegate = new ASTDelegate();
      esprima.parse(expressionText, delegate);

      if (!delegate.expression && !delegate.labeledStatements.length)
        return;

      // TODO(rafaelw): This is a bit of hack. We'd like to support syntax for
      // binding to class like class="{{ foo: bar; baz: bat }}", so we're
      // abusing ECMAScript labelled statements for this use. The main downside
      // is that ECMAScript indentifiers are more limited than CSS classnames.
      var resolveFn = delegate.labeledStatements.length ?
          newLabeledResolve(delegate.labeledStatements) :
          getFn(delegate.expression);

      delegate.filters.forEach(function(filter) {
        resolveFn = filter.toDOM(resolveFn);
      });

      var paths = [];
      for (var prop in delegate.deps) {
        paths.push(prop);
      }

      if (!paths.length)
        return { value: resolveFn({}) }; // only literals in expression.

      if (paths.length === 1 && delegate.filters.length &&
          delegate.expression instanceof IdentPath) {
        var binding = new TwoWayFilterBinding(resolveFn, delegate.filters);
        var path = delegate.expression.getPath();
        binding.bind(path, model, path);
        return binding;
      }

      var binding = new CompoundBinding(resolveFn);
      for (var i = 0; i < paths.length; i++) {
        binding.bind(paths[i], model, paths[i]);
      }

      return binding;
    } catch (ex) {
      console.error('Invalid expression syntax: ' + expressionText, ex);
    }
  }

  function newLabeledResolve(labeledStatements) {
    return function(values) {
      var labels = [];
      for (var i = 0; i < labeledStatements.length; i++) {
        if (labeledStatements[i].expression(values))
          labels.push(labeledStatements[i].label);
      }

      return labels.join(' ');
    }
  }

  function TwoWayFilterBinding(combinator, filters) {
    CompoundBinding.call(this, combinator);
    this.model = null;
    this.path = null;
    this.filters = filters;
    this.selfObserver = null;
  }

  TwoWayFilterBinding.prototype = createObject({
    __proto__: CompoundBinding.prototype,

    domValueChanged: function(value, oldValue) {
      var modelValue = this.toModel(value);
      PathObserver.setValueAtPath(this.model, this.path, modelValue);
    },

    bind: function(name, model, path) {
      CompoundBinding.prototype.bind.call(this, name, model, path);
      this.model = model;
      this.path = path;
      this.selfObserver = new PathObserver(this, 'value', this.domValueChanged,
                                           this, name);
    },

    unbind: function(name) {
      CompoundBinding.prototype.unbind.call(this, name);
      if (this.selfObserver)
        this.selfObserver.close();
    },

    toModel: function(value) {
      for (var i = this.filters.length - 1; i >= 0; i--) {
        value = this.filters[i].toModel(value);
      }
      return value;
    }
  });

  function IdentPath(deps, name, last) {
    this.deps = deps;
    this.name = name;
    this.last = last;
  }

  IdentPath.prototype = {
    getPath: function() {
      if (!this.last)
        return this.name;

      return this.last.getPath() + '.' + this.name;
    },

    valueFn: function() {
      var path = this.getPath();
      this.deps[path] = true;
      return function(values) {
        return values[path];
      };
    }
  };

  function Filter(name, args) {
    this.name = name;
    this.args = args;
    this.object_ = null;
  }

  Filter.prototype = {
    get object() {
      if (this.object_)
        return this.object_;

      var f = PolymerExpressions.filters[this.name];
      var argumentValues = this.args.map(function(arg) {
        var fn = getFn(arg);
        return fn();
      });
      return this.object_ = f.apply(null, argumentValues);
    },

    toDOM: function(fn) {
      var object = this.object;
      return function(values) {
        var value = fn(values);
        return object.toDOM(value);
      };
    },

    toModel: function(value) {
      var object = this.object;
      if (object.toModel)
        return object.toModel(value);
      return value;
    }
  };

  function ASTDelegate() {
    this.expression = null;
    this.filters = [];
    this.labeledStatements = [];
    this.deps = {};
    this.currentPath = undefined;
  }

  function notImplemented() { throw Error('Not Implemented'); }

  var unaryOperators = {
    '+': function(v) { return +v; },
    '-': function(v) { return -v; },
    '!': function(v) { return !v; }
  };

  var binaryOperators = {
    '+': function(l, r) { return l+r; },
    '-': function(l, r) { return l-r; },
    '*': function(l, r) { return l*r; },
    '/': function(l, r) { return l/r; },
    '%': function(l, r) { return l%r; },
    '<': function(l, r) { return l<r; },
    '>': function(l, r) { return l>r; },
    '<=': function(l, r) { return l<=r; },
    '>=': function(l, r) { return l>=r; },
    '==': function(l, r) { return l==r; },
    '!=': function(l, r) { return l!=r; },
    '===': function(l, r) { return l===r; },
    '!==': function(l, r) { return l!==r; },
    '&&': function(l, r) { return l&&r; },
    '||': function(l, r) { return l||r; },
  };

  function getFn(arg) {
    return arg instanceof IdentPath ? arg.valueFn() : arg;
  }

  ASTDelegate.prototype = {

    createLabeledStatement: function(label, expression) {
      this.labeledStatements.push({
        label: label,
        expression: expression instanceof IdentPath ? expression.valueFn() : expression
      });
      return expression;
    },

    createUnaryExpression: function(op, argument) {
      if (!unaryOperators[op])
        throw Error('Disallowed operator: ' + op);

      argument = getFn(argument);

      return function(values) {
        return unaryOperators[op](argument(values));
      };
    },

    createBinaryExpression: function(op, left, right) {
      if (!binaryOperators[op])
        throw Error('Disallowed operator: ' + op);

      left = getFn(left);
      right = getFn(right);

      return function(values) {
        return binaryOperators[op](left(values), right(values));
      };
    },

    createConditionalExpression: function(test, consequent, alternate) {
      test = getFn(test);
      consequent = getFn(consequent);
      alternate = getFn(alternate);

      return function(values) {
        return test(values) ? consequent(values) : alternate(values);
      }
    },

    createIdentifier: function(name) {
      var ident = new IdentPath(this.deps, name);
      ident.type = 'Identifier';
      return ident;
    },

    createMemberExpression: function(accessor, object, property) {
      if (accessor === '[') {
        object = getFn(object);
        property = getFn(property);
        return function(values) {
          return object(values)[property(values)];
        };
      }
      return new IdentPath(this.deps, property.name, object);
    },

    createLiteral: function(token) {
      return function() { return token.value; };
    },

    createArrayExpression: function(elements) {
      for (var i = 0; i < elements.length; i++)
        elements[i] = getFn(elements[i]);

      return function(values) {
        var arr = []
        for (var i = 0; i < elements.length; i++)
          arr.push(elements[i](values));
        return arr;
      }
    },

    createProperty: function(kind, key, value) {
      return {
        key: key instanceof IdentPath ? key.getPath() : key(),
        value: value
      };
    },

    createObjectExpression: function(properties) {
      for (var i = 0; i < properties.length; i++)
        properties[i].value = getFn(properties[i].value);

      return function(values) {
        var obj = {};
        for (var i = 0; i < properties.length; i++)
          obj[properties[i].key] = properties[i].value(values);
        return obj;
      }
    },

    createFilter: function(name, args) {
      this.filters.push(new Filter(name, args));
    },

    createTopLevel: function(expression) {
      this.expression = expression;
    },

    createThisExpression: notImplemented
  }

  function PolymerExpressions() {}

  PolymerExpressions.filters = Object.create(null);

  PolymerExpressions.prototype = {
    getBinding: function(model, pathString, name, node) {
      pathString = pathString.trim();
      if (!pathString || pathString.match(pathPattern))
        return; // bail out early if pathString is simple path.

      return getNamedScopeBinding(model, pathString, name, node) ||
             getExpressionBinding(model, pathString, name, node);
    },

    getInstanceModel: function(template, model) {
      var scopeName = templateScopeTable.get(template);
      if (!scopeName)
        return model;

      var parentScope = template.templateInstance ?
          template.templateInstance.model :
          template.model;

      var scope = Object.create(parentScope);
      scope[scopeName] = model;
      return scope;
    }
  };

  global.PolymerExpressions = PolymerExpressions;

})(this);