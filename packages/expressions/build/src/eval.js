define(['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _BINARY_OPERATORS = {
    '+': function _(a, b) {
      return a + b;
    },
    '-': function _(a, b) {
      return a - b;
    },
    '*': function _(a, b) {
      return a * b;
    },
    '/': function _(a, b) {
      return a / b;
    },
    '%': function _(a, b) {
      return a % b;
    },
    '==': function _(a, b) {
      return a == b;
    },
    '!=': function _(a, b) {
      return a != b;
    },
    '===': function _(a, b) {
      return a === b;
    },
    '!==': function _(a, b) {
      return a !== b;
    },
    '>': function _(a, b) {
      return a > b;
    },
    '>=': function _(a, b) {
      return a >= b;
    },
    '<': function _(a, b) {
      return a < b;
    },
    '<=': function _(a, b) {
      return a <= b;
    },
    '||': function _(a, b) {
      return a || b;
    },
    '&&': function _(a, b) {
      return a && b;
    },
    '|': function _(a, f) {
      return f(a);
    }
  };

  var _UNARY_OPERATORS = {
    '+': function _(a) {
      return a;
    },
    '-': function _(a) {
      return -a;
    },
    '!': function _(a) {
      return !a;
    }
  };

  var _BOOLEAN_OPERATORS = ['!', '||', '&&'];

  var EvalAstFactory = (function () {
    function EvalAstFactory() {
      _classCallCheck(this, EvalAstFactory);
    }

    _createClass(EvalAstFactory, [{
      key: 'empty',
      value: function empty() {
        // TODO(justinfagnani): return null instead?
        return {
          evaluate: function evaluate(scope) {
            return scope;
          },
          getIdentifiers: function getIdentifiers(idents) {
            return idents;
          }
        };
      }
    }, {
      key: 'literal',

      // TODO(justinfagnani): just use a JS literal?
      value: function literal(v) {
        return {
          type: 'Literal',
          value: v,
          evaluate: function evaluate(scope) {
            return this.value;
          },
          getIdentifiers: function getIdentifiers(idents) {
            return idents;
          }
        };
      }
    }, {
      key: 'identifier',
      value: function identifier(v) {
        return {
          type: 'Identifier',
          value: v,
          evaluate: function evaluate(scope) {
            if (this.value === 'this') return scope;
            return scope[this.value];
          },
          getIdentifiers: function getIdentifiers(idents) {
            idents.push(this.value);
            return idents;
          }
        };
      }
    }, {
      key: 'unary',
      value: function unary(op, expr) {
        return {
          type: 'Unary',
          operator: op,
          child: expr,
          evaluate: function evaluate(scope) {
            var op = _UNARY_OPERATORS[this.operator];
            return op(this.child.evaluate(scope));
          },
          getIdentifiers: function getIdentifiers(idents) {
            return this.child.getIdentifiers(idents);
          }
        };
      }
    }, {
      key: 'binary',
      value: function binary(l, op, r) {
        return {
          type: 'Binary',
          operator: op,
          left: l,
          right: r,
          evaluate: function evaluate(scope) {
            var op = _BINARY_OPERATORS[this.operator];
            return op(this.left.evaluate(scope), this.right.evaluate(scope));
          },
          getIdentifiers: function getIdentifiers(idents) {
            this.left.getIdentifiers(idents);
            this.right.getIdentifiers(idents);
            return idents;
          }
        };
      }
    }, {
      key: 'getter',
      value: function getter(g, n) {
        return {
          type: 'Getter',
          receiver: g,
          name: n,
          evaluate: function evaluate(scope) {
            return this.receiver.evaluate(scope)[this.name];
          },
          getIdentifiers: function getIdentifiers(idents) {
            this.receiver.getIdentifiers(idents);
            return idents;
          }
        };
      }
    }, {
      key: 'invoke',
      value: function invoke(receiver, method, args) {
        return {
          type: 'Invoke',
          receiver: receiver,
          method: method,
          arguments: args,
          evaluate: function evaluate(scope) {
            var o = this.receiver.evaluate(scope);
            var argValues = this.arguments.map(function (a) {
              return a.evaluate(scope);
            });
            var f = this.method == null ? o : o[this.method];
            return f.apply(o, argValues);
          },
          getIdentifiers: function getIdentifiers(idents) {
            this.receiver.getIdentifiers(idents);
            this.arguments.forEach(function (a) {
              return a.getIdentifiers(idents);
            });
            return idents;
          }
        };
      }
    }, {
      key: 'parenthesized',
      value: function parenthesized(e) {
        return {
          type: 'Parenthesized',
          child: e,
          evaluate: function evaluate(scope) {
            return this.child.evaluate(scope);
          },
          getIdentifiers: function getIdentifiers(idents) {
            return this.child.getIdentifiers(idents);
          }
        };
      }
    }, {
      key: 'index',
      value: function index(e, a) {
        return {
          type: 'Index',
          receiver: e,
          argument: a,
          evaluate: function evaluate(scope) {
            return this.receiver.evaluate(scope)[this.argument.evaluate(scope)];
          },
          getIdentifiers: function getIdentifiers(idents) {
            this.receiver.getIdentifiers(idents);
            return idents;
          }
        };
      }
    }, {
      key: 'ternary',
      value: function ternary(c, t, f) {
        return {
          type: 'Ternary',
          condition: c,
          trueExpr: t,
          falseExpr: f,
          evaluate: function evaluate(scope) {
            var c = this.condition.evaluate(scope);
            if (c) {
              return this.trueExpr.evaluate(scope);
            } else {
              return this.falseExpr.evaluate(scope);
            }
          },
          getIdentifiers: function getIdentifiers(idents) {
            this.condition.getIdentifiers(idents);
            this.trueExpr.getIdentifiers(idents);
            this.falseExpr.getIdentifiers(idents);
            return idents;
          }
        };
      }
    }, {
      key: 'mapLiteral',
      value: function mapLiteral(entries) {
        return {
          type: 'MapLiteral',
          entries: entries,
          evaluate: function evaluate(scope) {
            var map = {};
            for (var i = 0; i < this.entries.length; i++) {
              var entry = this.entries[i];
              var key = entry.key.value;
              var value = entry.value.evaluate(scope);
              map[key] = value;
            }
            return map;
          },
          getIdentifiers: function getIdentifiers(idents) {
            this.entries.forEach(function (e) {
              e.value.getIdentifiers(idents);
            });
            return idents;
          }
        };
      }
    }, {
      key: 'mapLiteralEntry',

      // TODO(justinfagnani): replace with a 2-element Array?
      value: function mapLiteralEntry(key, value) {
        return {
          type: 'MapLiteralEntry',
          key: key,
          value: value
        };
      }
    }, {
      key: 'listLiteral',

      // TODO(justinfagnani): if the list is deeply literal
      value: function listLiteral(l) {
        return {
          type: 'ListLiteral',
          items: l,
          evaluate: function evaluate(scope) {
            return this.items.map(function (a) {
              return a.evaluate(scope);
            });
          },
          getIdentifiers: function getIdentifiers(idents) {
            this.items.forEach(function (i) {
              i.getIdentifiers(idents);
            });
            return idents;
          }
        };
      }
    }]);

    return EvalAstFactory;
  })();

  exports.EvalAstFactory = EvalAstFactory;
});