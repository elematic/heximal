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

export class EvalAstFactory {

  empty() {
    // TODO(justinfagnani): return null instead?
    return {
      evaluate: function(scope) { return scope; },
      getIdentifiers(idents) { return idents; },
    };

  }

  // TODO(justinfagnani): just use a JS literal?
  literal(v) {
    return {
      type: 'Literal',
      value: v,
      evaluate: function(scope) { return this.value; },
      getIdentifiers(idents) { return idents; },
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
      getIdentifiers(idents) {
        idents.push(this.value);
        return idents;
      },
    };
  }

  unary(op, expr) {
    let f = _UNARY_OPERATORS[op];
    return {
      type: 'Unary',
      operator: op,
      child: expr,
      evaluate: function(scope) {
        return f(this.child.evaluate(scope));
      },
      getIdentifiers(idents) { return this.child.getIdentifiers(idents); },
    };
  }

  binary(l, op, r) {
    let f = _BINARY_OPERATORS[op];
    return {
      type: 'Binary',
      operator: op,
      left: l,
      right: r,
      evaluate: function(scope) {
        return f(this.left.evaluate(scope), this.right.evaluate(scope));
      },
      getIdentifiers(idents) {
        this.left.getIdentifiers(idents);
        this.right.getIdentifiers(idents);
        return idents;
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
      getIdentifiers(idents) {
        this.receiver.getIdentifiers(idents);
        return idents;
      },
    };
  }

  invoke(receiver, method, args) {
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
      getIdentifiers(idents) {
        this.receiver.getIdentifiers(idents);
        this.arguments.forEach(function(a) {
          return a.getIdentifiers(idents);
        });
        return idents;
      },
    };
  }

  parenthesized(e) {
    return {
      type: 'Parenthesized',
      child: e,
      evaluate: function(scope) {
        return this.child.evaluate(scope);
      },
      getIdentifiers(idents) { return this.child.getIdentifiers(idents); },
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
      getIdentifiers(idents) {
        this.receiver.getIdentifiers(idents);
        return idents;
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
      getIdentifiers(idents) {
        this.condition.getIdentifiers(idents);
        this.trueExpr.getIdentifiers(idents);
        this.falseExpr.getIdentifiers(idents);
        return idents;
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
          map[key] = value;
        }
        return map;
      },
      getIdentifiers(idents) {
        this.entries.forEach(function(e) {
          e.value.getIdentifiers(idents);
        });
        return idents;
      },
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

  // TODO(justinfagnani): if the list is deeply literal
  listLiteral(l) {
    return {
      type: 'ListLiteral',
      items: l,
      evaluate: function(scope) {
        return this.items.map(function(a) {
          return a.evaluate(scope);
        });
      },
      getIdentifiers(idents) {
        this.items.forEach(function(i) {
          i.getIdentifiers(idents);
        });
        return idents;
      },
    };
  }

}
