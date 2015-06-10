'use strict';

const _BINARY_OPERATORS = {
  '+':   function(a, b) { return a + b; },
  '-':   function(a, b) { return a - b; },
  '*':   function(a, b) { return a * b; },
  '/':   function(a, b) { return a / b; },
  '%':   function(a, b) { return a % b; },
  '==':  function(a, b) { return a == b; },
  '!=':  function(a, b) { return a != b; },
  '===': function(a, b) { return a === b; },
  '!==': function(a, b) { return a !== b; },
  '>':   function(a, b) { return a > b; },
  '>=':  function(a, b) { return a >= b; },
  '<':   function(a, b) { return a < b; },
  '<=':  function(a, b) { return a <= b; },
  '||':  function(a, b) { return a || b; },
  '&&':  function(a, b) { return a && b; },
  '|':   function(a, f) { return f(a); },
};

const _UNARY_OPERATORS = {
  '+': function(a) { return a; },
  '-': function(a) { return -a; },
  '!': function(a) { return !a; },
};

const _BOOLEAN_OPERATORS = ['!', '||', '&&'];

// function evaluate(expression, scope) {
//   expression.evaluate(scope);
// }

class EvalAstFactory {

  empty() {
    // TODO(justinfagnani): return null instead?
    return {
      evaluate: function(scope) { return scope; },
    };

  }

  // TODO(justinfagnani): just use a JS literal?
  literal(v) {
    return {
      type: 'Literal',
      value: v,
      evaluate: function(scope) { return this.value; },
    };
  }

  identifier(v) {
    return {
      type: 'Identifier',
      value: v,
      evaluate: function(scope) {
        if (this.value === 'this') return scope;
        return scope[this.value];
      },
    };
  }

  unary(op, expr) {
    return {
      type: 'Unary',
      operator: op,
      child: expr,
      evaluate: function(scope) {
        let op = _UNARY_OPERATORS[this.operator];
        return op(this.child.evaluate(scope));
      },
    };
  }

  binary(l, op, r) {
    return {
      type: 'Binary',
      operator: op,
      left: l,
      right: r,
      evaluate: function(scope) {
        let op = _BINARY_OPERATORS[this.operator];
        return op(this.left.evaluate(scope), this.right.evaluate(scope));
      },
    };
  }

  getter(g, n) {
    return {
      type: 'Getter',
      receiver: g,
      name: n,
      evaluate: function(scope) {
        return this.receiver.evaluate(scope)[this.name];
      },
    };
  }

  invoke(receiver, method, args) {
    if (args == null) {
      throw new Error('args');
    }
    return {
      type: 'Invoke',
      receiver: receiver,
      method: method,
      arguments: args,
      evaluate: function(scope) {
        let o = this.receiver.evaluate(scope);
        let argValues = this.arguments.map(function(a) {
          return a.evaluate(scope);
        });
        let f = this.method == null ? o : o[this.method];
        return f.apply(o, argValues);
      },
    };
  }

  parenthesized(e) {
    return {
      type: 'Parenthesized',
      child: e,
      evaluate: function(scope) {
        return this.child.evaluate(e);
      }
    };
  }

  index(e, a) {
    return {
      type: 'Index',
      receiver: e,
      argument: a,
      evaluate: function(scope) {
        return this.receiver.evaluate(scope)[this.argument.evaluate(scope)];
      },
    };
  }

  ternary(c, t, f) {
    return {
      type: 'Ternary',
      condition: c,
      trueExpr: t,
      falseExpr: f,
      evaluate: function(scope) {
        let c = this.condition.evaluate(scope);
        if (c) {
          return this.trueExpr.evaluate(scope);
        } else {
          return this.falseExpr.evaluate(scope);
        }
      },
    };
  }

  mapLiteral(entries) {
    return {
      type: 'MapLiteral',
      entries: entries,
      evaluate: function(scope) {
        let map = {};
        for (let i = 0; i < this.entries.length; i++) {
          let entry = this.entries[i];
          let key = entry.key.value;
          let value = entry.value.evaluate(scope);
          // console.log('map entry: ', key, value);
          map[key] = value;
        }
        return map;
      }
    };
  }

  // TODO(justinfagnani): replace with a 2-element Array?
  mapLiteralEntry(key, value) {
    return {
      type: 'MapLiteralEntry',
      key: key,
      value: value,
    };
  }

  listLiteral(l) {
    return {
      type: 'ListLiteral',
      items: l,
      evaluate: function(scope) {
        return this.items.map(function(a) {
          return a.evaluate(scope);
        });
      },
    };
  }

}

module.exports = {
  EvalAstFactory: EvalAstFactory,
};
