'use strict';

export class AstFactory {

  empty() {
    // TODO(justinfagnani): return null instead?
    return {};
  }

  // TODO(justinfagnani): just use a JS literal?
  literal(v) {
    return {
      type: 'Literal',
      value: v,
    };
  }

  identifier(v) {
    return {
      type: 'Identifier',
      value: v,
    };
  }

  unary(op, expr) {
    return {
      type: 'Unary',
      operator: op,
      child: expr,
    };
  }

  binary(l, op, r) {
    return {
      type: 'Binary',
      operator: op,
      left: l,
      right: r,
    };
  }

  getter(g, n) {
    return {
      type: 'Getter',
      receiver: g,
      name: n,
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
    };
  }

  parenthesized(e) {
    return {
      type: 'Parenthesized',
      child: e,
    };
  }

  index(e, a) {
    return {
      type: 'Index',
      receiver: e,
      argument: a,
    };
  }

  ternary(c, t, f) {
    return {
      type: 'Ternary',
      condition: c,
      trueExpr: t,
      falseExpr: f,
    };
  }

  mapLiteral(entries) {
    return {
      type: 'MapLiteral',
      entries: entries,
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
    };
  }
}
