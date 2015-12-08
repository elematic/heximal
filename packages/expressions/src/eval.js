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

export class EvalAstFactory {

  empty() {
    // TODO(justinfagnani): return null instead?
    return {
      evaluate: function(scope) { return scope; },
      getIds(idents) { return idents; },
    };

  }

  // TODO(justinfagnani): just use a JS literal?
  literal(v) {
    return {
      type: 'Literal',
      value: v,
      evaluate: function(scope) { return this.value; },
      getIds(idents) { return idents; },
    };
  }

  id(v) {
    return {
      type: 'ID',
      value: v,
      evaluate: function(scope) {
        // TODO(justinfagnani): this prevernts access to properties named 'this'
        if (this.value === 'this') return scope;
        return scope[this.value];
      },
      getIds(idents) {
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
      getIds(idents) { return this.child.getIds(idents); },
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
      getIds(idents) {
        this.left.getIds(idents);
        this.right.getIds(idents);
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
      getIds(idents) {
        this.receiver.getIds(idents);
        return idents;
      },
    };
  }

  invoke(receiver, method, args) {
    if (method != null && typeof method !== 'string') {
      throw new Error('method not a string');
    }
    return {
      type: 'Invoke',
      receiver: receiver,
      method: method,
      arguments: args,
      evaluate: function(scope) {
        let receiver = this.receiver.evaluate(scope);
        // TODO(justinfagnani): this might be wrong in cases where we're
        // invoking a top-level function rather than a method. If method is
        // defined on a nested scope, then we should probably set _this to null.
        let _this = this.method ? receiver : scope['this'] || scope;
        var f = this.method ? receiver[method] : receiver;
        let argValues = this.arguments.map((a) => a.evaluate(scope));
        return f.apply(_this, argValues);
      },
      getIds(idents) {
        this.receiver.getIds(idents);
        this.arguments.forEach(function(a) {
          return a.getIds(idents);
        });
        return idents;
      },
    };
  }

  parenthesized(e) {
    return e;
  }

  index(e, a) {
    return {
      type: 'Index',
      receiver: e,
      argument: a,
      evaluate: function(scope) {
        return this.receiver.evaluate(scope)[this.argument.evaluate(scope)];
      },
      getIds(idents) {
        this.receiver.getIds(idents);
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
      getIds(idents) {
        this.condition.getIds(idents);
        this.trueExpr.getIds(idents);
        this.falseExpr.getIds(idents);
        return idents;
      },
    };
  }

  map(entries) {
    return {
      type: 'Map',
      entries: entries,
      evaluate: function(scope) {
        let map = {};
        for (let key in entries) {
          map[key] = this.entries[key].evaluate(scope);
        }
        return map;
      },
      getIds(idents) {
        for (let key in entries) {
          this.entries[key].getIds(idents);
        }
        return idents;
      },
    };
  }

  // TODO(justinfagnani): if the list is deeply literal
  list(l) {
    return {
      type: 'List',
      items: l,
      evaluate: function(scope) {
        return this.items.map(function(a) {
          return a.evaluate(scope);
        });
      },
      getIds(idents) {
        this.items.forEach(function(i) {
          i.getIds(idents);
        });
        return idents;
      },
    };
  }

}
