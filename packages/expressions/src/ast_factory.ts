import * as ast from './ast';

export interface AstFactory<N extends ast.Expression> {
  empty(): N;
  literal(rawValue: string|number|boolean|RegExp|null): N;
  id(name: string): N;
  unary(operator: string, expression: N): N;
  binary(left: N, op: string, right: N): N;
  getter(receiver: N, name: string): N;
  invoke(receiver: N, method: string|null, args: Array<N|null>|null): N;
  paren(child: N): N;
  index(receiver: N, argument: N): N;
  ternary(condition: N, trueExpr: N, falseExpr: N): N;
  map(entries: {[key: string]: N | null}|null): N;
  list(items: Array<N|null>|null): N;
}

export class DefaultAstFactory implements AstFactory<ast.Expression> {
  empty(): ast.Empty {
    return {type: 'Empty'};
  }

  // TODO(justinfagnani): just use a JS literal?
  literal(v: ast.LiteralValue): ast.Literal {
    return {
      type: 'Literal',
      value: v,
    };
  }

  id(v: string): ast.ID {
    return {
      type: 'ID',
      value: v,
    };
  }

  unary(op: string, expr: ast.Expression): ast.Unary {
    return {
      type: 'Unary',
      operator: op,
      child: expr,
    };
  }

  binary(l: ast.Expression, op: string, r: ast.Expression): ast.Binary {
    return {
      type: 'Binary',
      operator: op,
      left: l,
      right: r,
    };
  }

  getter(g: ast.Expression, n: string): ast.Getter {
    return {
      type: 'Getter',
      receiver: g,
      name: n,
    };
  }

  invoke(receiver: ast.Expression, method: string|null, args: Array<ast.Expression|null>|null):
      ast.Invoke {
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

  paren(e: ast.Expression): ast.Paren {
    return {
      type: 'Paren',
      child: e,
    };
  }

  index(e: ast.Expression, a: ast.Expression): ast.Index {
    return {
      type: 'Index',
      receiver: e,
      argument: a,
    };
  }

  ternary(c: ast.Expression, t: ast.Expression, f: ast.Expression): ast.Ternary {
    return {
      type: 'Ternary',
      condition: c,
      trueExpr: t,
      falseExpr: f,
    };
  }

  map(entries: {[key: string]: ast.Expression | null}|null): ast.Map {
    return {
      type: 'Map',
      entries: entries,
    };
  }

  list(l: Array<ast.Expression|null>|null): ast.List {
    return {
      type: 'List',
      items: l,
    };
  }
}
