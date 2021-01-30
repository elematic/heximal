import * as ast from './ast.js';

export interface AstFactory<E extends ast.Expression> {
  empty(): E;
  literal(value: ast.LiteralValue): E;
  id(name: string): E;
  unary(operator: string, expression: E): E;
  binary(left: E, op: string, right: E | undefined): E;
  getter(receiver: E, name: string): E;
  invoke(
    receiver: E,
    method: string | undefined,
    args: Array<E | undefined> | undefined
  ): E;
  paren(child: E | undefined): E;
  index(receiver: E, argument: E | undefined): E;
  ternary(condition: E, trueExpr: E | undefined, falseExpr: E | undefined): E;
  map(entries: {[key: string]: E | undefined} | undefined): E;
  list(items: Array<E | undefined> | undefined): E;
}

export class DefaultAstFactory implements AstFactory<ast.Expression> {
  empty(): ast.Empty {
    return {type: 'Empty'};
  }

  // TODO(justinfagnani): just use a JS literal?
  literal(value: ast.LiteralValue): ast.Literal {
    return {
      type: 'Literal',
      value,
    };
  }

  id(value: string): ast.ID {
    return {
      type: 'ID',
      value,
    };
  }

  unary(operator: string, child: ast.Expression): ast.Unary {
    return {
      type: 'Unary',
      operator,
      child,
    };
  }

  binary(
    left: ast.Expression,
    operator: string,
    right: ast.Expression
  ): ast.Binary {
    return {
      type: 'Binary',
      operator,
      left,
      right,
    };
  }

  getter(receiver: ast.Expression, name: string): ast.Getter {
    return {
      type: 'Getter',
      receiver,
      name,
    };
  }

  invoke(
    receiver: ast.Expression,
    method: string | undefined,
    args: Array<ast.Expression> | undefined
  ): ast.Invoke {
    // TODO(justinfagnani): do this assertion in the parser
    if (args === undefined) {
      throw new Error('args');
    }
    return {
      type: 'Invoke',
      receiver,
      method,
      arguments: args,
    };
  }

  paren(child: ast.Expression): ast.Paren {
    return {
      type: 'Paren',
      child,
    };
  }

  index(
    receiver: ast.Expression,
    argument: ast.Expression | undefined
  ): ast.Index {
    return {
      type: 'Index',
      receiver,
      argument,
    };
  }

  ternary(
    condition: ast.Expression,
    trueExpr: ast.Expression,
    falseExpr: ast.Expression
  ): ast.Ternary {
    return {
      type: 'Ternary',
      condition,
      trueExpr,
      falseExpr,
    };
  }

  map(entries: {[key: string]: ast.Expression}): ast.Map {
    return {
      type: 'Map',
      entries,
    };
  }

  list(items: Array<ast.Expression>): ast.List {
    return {
      type: 'List',
      items,
    };
  }
}
