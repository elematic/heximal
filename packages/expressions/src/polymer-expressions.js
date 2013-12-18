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

  function prepareBinding(expressionText, name, node, filterRegistry) {
    var expression;
    try {
      expression = getExpression(expressionText);
      if (expression.scopeIdent &&
          (node.nodeType !== Node.ELEMENT_NODE ||
           node.tagName !== 'TEMPLATE' ||
           (name !== 'bind' && name !== 'repeat'))) {
        throw Error('as and in can only be used within <template bind/repeat>');
      }
    } catch (ex) {
      console.error('Invalid expression syntax: ' + expressionText, ex);
      return;
    }

    return function(model, node, oneTime) {
      var binding = expression.getBinding(model, filterRegistry, oneTime);
      if (expression.scopeIdent && binding) {
        node.polymerExpressionScopeIdent_ = expression.scopeIdent;
        if (expression.indexIdent)
          node.polymerExpressionIndexIdent_ = expression.indexIdent;
      }

      return binding;
    }
  }

  // TODO(rafaelw): Implement simple LRU.
  var expressionParseCache = Object.create(null);

  function getExpression(expressionText) {
    var expression = expressionParseCache[expressionText];
    if (!expression) {
      var delegate = new ASTDelegate();
      esprima.parse(expressionText, delegate);
      expression = new Expression(delegate);
      expressionParseCache[expressionText] = expression;
    }
    return expression;
  }

  function Literal(value) {
    this.value = value;
  }

  Literal.prototype = {
    valueFn: function() {
      var value = this.value;
      return function() { return value; };
    }
  }

  function IdentPath(delegate, name, last) {
    this.delegate = delegate;
    this.name = name;
    this.last = last;
  }

  IdentPath.prototype = {
    getPath: function() {
      if (!this.path_) {
        if (this.last)
          this.path_ = Path.get(this.last.getPath() + '.' + this.name);
        else
          this.path_ = Path.get(this.name);
      }
      return this.path_;
    },

    valueFn: function() {
      if (!this.valueFn_) {
        var path = this.getPath();
        var index = this.delegate.deps[path];
        if (index === undefined) {
          index = this.delegate.deps[path] = this.delegate.depsList.length;
          this.delegate.depsList.push(path);
        }

        var depsList = this.delegate.depsList;
        this.valueFn_ = function(values) {
          return depsList.length === 1 ? values : values[index];
        }
      }

      return this.valueFn_;
    },

    setValue: function(model, newValue) {
      return this.getPath().setValueFrom(model, newValue);
    }
  };

  function MemberExpression(object, property) {
    this.object = object;
    this.property = property;
  }

  MemberExpression.prototype = {
    valueFn: function() {
      var object = this.object;
      var property = this.property;
      return function(values) {
        return object(values)[property(values)];
      };
    },

    setValue: function(object, newValue, depsValues) {
      object = this.object(depsValues);
      var property = this.property(depsValues);
      return object[property] = newValue;
    }
  };

  function Filter(name, args) {
    this.name = name;
    this.args = [];
    for (var i = 0; i < args.length; i++) {
      this.args[i] = getFn(args[i]);
    }
  }

  Filter.prototype = {
    transform: function(value, depsValues, toModelDirection, filterRegistry,
                        context) {
      var fn = filterRegistry[this.name];
      if (fn) {
        context = undefined;
      } else {
        fn = context[this.name];
        if (!fn) {
          console.error('Cannot find filter: ' + this.name);
          return;
        }
      }

      // If toModelDirection is falsey, then the "normal" (dom-bound) direction
      // is used. Otherwise, it looks for a 'toModel' property function on the
      // object.
      if (toModelDirection) {
        fn = fn.toModel;
      } else if (typeof fn.toDOM == 'function') {
        fn = fn.toDOM;
      }

      if (typeof fn != 'function') {
        console.error('No ' + (toModelDirection ? 'toModel' : 'toDOM') +
                      ' found on' + this.name);
        return;
      }

      var args = [value];
      for (var i = 0; i < this.args.length; i++) {
        args[i + 1] = getFn(this.args[i])(depsValues);
      }

      return fn.apply(context, args);
    }
  };

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
    return typeof arg == 'function' ? arg : arg.valueFn();
  }

  function ASTDelegate() {
    this.expression = null;
    this.filters = [];
    this.deps = {};
    this.depsList = [];
    this.currentPath = undefined;
    this.scopeIdent = undefined;
    this.indexIdent = undefined;
  }

  ASTDelegate.prototype = {
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
      var ident = new IdentPath(this, name);
      ident.type = 'Identifier';
      return ident;
    },

    createMemberExpression: function(accessor, object, property) {
      if (object instanceof IdentPath) {
        if (accessor == '.')
          return new IdentPath(this, property.name, object);

        if (property instanceof Literal && Path.get(property.value).valid)
          return new IdentPath(this, property.value, object);
      }

      return new MemberExpression(getFn(object), getFn(property));
    },

    createLiteral: function(token) {
      return new Literal(token.value);
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
        key: key instanceof IdentPath ? key.name : key.value,
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

    createAsExpression: function(expression, scopeIdent) {
      this.expression = expression;
      this.scopeIdent = scopeIdent;
    },

    createInExpression: function(scopeIdent, indexIdent, expression) {
      this.expression = expression;
      this.scopeIdent = scopeIdent;
      this.indexIdent = indexIdent;
    },

    createTopLevel: function(expression) {
      this.expression = expression;
    },

    createThisExpression: notImplemented
  }

  function ConstantObservable(value) {
    this.value_ = value;
  }

  ConstantObservable.prototype = {
    open: function() { return this.value_; },
    discardChanges: function() { return this.value_; },
    deliver: function() {},
    close: function() {},
  }

  function Expression(delegate) {
    this.scopeIdent = delegate.scopeIdent;
    this.indexIdent = delegate.indexIdent;

    if (!delegate.expression)
      throw Error('No expression found.');

    this.expression = delegate.expression;
    getFn(this.expression); // forces enumeration of path dependencies

    this.paths = delegate.depsList;
    this.filters = delegate.filters;
  }

  Expression.prototype = {
    getBinding: function(model, filterRegistry, oneTime) {
      var paths = this.paths;
      if (oneTime) {
        var values;

        if (paths.length == 1) {
          values = paths[0].getValueFrom(model);
        } else if (paths.length > 1) {
          values = [];
          for (var i = 0; i < paths.length; i++)
            values[i] = paths[i].getValueFrom(model);
        }

        return this.getValue(values, filterRegistry, model);
      }

      if (!paths.length) {
        // only literals in expression.
        return new ConstantObservable(this.getValue(undefined, filterRegistry,
                                                    model));
      }

      var self = this;
      function valueFn(values) {
        return self.getValue(values, filterRegistry, model);
      }

      function setValueFn(newValue) {
        var values;
        if (self.paths.length == 1) {
          // In the singular-dep case, a PathObserver is used and the callback
          // is a scalar value.
          values = self.paths[0].getValueFrom(model);
        } else {
          // Multiple-deps uses a CompoundObserver whose callback is an
          // array of values.
          values = [];
          for (var i = 0; i < self.paths.length; i++) {
            values[i] = self.paths[i].getValueFrom(model);
          }
        }

        self.setValue(model, newValue, values, filterRegistry, model);
        return newValue;
      }

      var observer;
      if (paths.length === 1) {
        observer = new PathObserver(model, paths[0]);
      } else {
        observer = new CompoundObserver();
        for (var i = 0; i < paths.length; i++) {
          observer.addPath(model, paths[i]);
        }
      }

      return new ObserverTransform(observer, valueFn, setValueFn, true);
    },

    getValue: function(depsValues, filterRegistry, context) {
      var value = getFn(this.expression)(depsValues);
      for (var i = 0; i < this.filters.length; i++) {
        value = this.filters[i].transform(value, depsValues, false,
                                          filterRegistry,
                                          context);
      }

      return value;
    },

    setValue: function(model, newValue, depsValues, filterRegistry, context) {
      var count = this.filters ? this.filters.length : 0;
      while (count-- > 0) {
        newValue = this.filters[count].transform(newValue, depsValues, true,
                                                 filterRegistry,
                                                 context);
      }

      if (this.expression.setValue)
        return this.expression.setValue(model, newValue, depsValues);
    }
  }

  /**
   * Converts a style property name to a css property name. For example:
   * "WebkitUserSelect" to "-webkit-user-select"
   */
  function convertStylePropertyName(name) {
    return String(name).replace(/[A-Z]/g, function(c) {
      return '-' + c.toLowerCase();
    });
  }

  function PolymerExpressions() {}

  PolymerExpressions.prototype = {
    // "built-in" filters
    styleObject: function(value) {
      var parts = [];
      for (var key in value) {
        parts.push(convertStylePropertyName(key) + ': ' + value[key]);
      }
      return parts.join('; ');
    },

    tokenList: function(value) {
      var tokens = [];
      for (var key in value) {
        if (value[key])
          tokens.push(key);
      }
      return tokens.join(' ');
    },

    // binding delegate API
    prepareInstancePositionChanged: function(template) {
      var indexIdent = template.polymerExpressionIndexIdent_;
      if (!indexIdent)
        return;

      return function(templateInstance, index) {
        templateInstance.model[indexIdent] = index;
      };
    },

    prepareBinding: function(pathString, name, node) {
      if (Path.get(pathString).valid)
        return; // bail out early if pathString is simple path.

      return prepareBinding(pathString, name, node, this);
    },

    prepareInstanceModel: function(template) {
      var scopeName = template.polymerExpressionScopeIdent_;
      if (!scopeName)
        return;

      var parentScope = template.templateInstance ?
          template.templateInstance.model :
          template.model;

      return function(model) {
        var scope = Object.create(parentScope);
        scope[scopeName] = model;
        return scope;
      };
    }
  };

  global.PolymerExpressions = PolymerExpressions;

})(this);
