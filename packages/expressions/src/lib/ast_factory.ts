import * as ast from './ast.js';

export interface AstFactory<E extends ast.Expression> {
  empty(): E;
  literal(value: ast.LiteralValue): E;
  id(name: string): E;
  unary(operator: string, expression: E): E;
  binary(left: E, op: string, right: E): E;
  getter(receiver: E, name: string): E;
  invoke(receiver: E, method: string | null, args: Array<E> | null): E;
  paren(child: E): E;
  index(receiver: E, argument: E): E;
  ternary(condition: E, trueExpr: E, falseExpr: E): E;
  map(entries: { [key: string]: E } | null): E;
  list(items: Array<E> | null): E;
}

export class DefaultAstFactory implements AstFactory<ast.Expression> {
  empty(): ast.Empty {
    return { type: 'Empty' };
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

  binary(left: ast.Expression, operator: string, right: ast.Expression): ast.Binary {
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

  invoke(receiver: ast.Expression, method: string | null, args: Array<ast.Expression | null> | null):
    ast.Invoke {
    // TODO(justinfagnani): do this assertion in the parser
    if (args == null) {
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

  index(receiver: ast.Expression, argument: ast.Expression): ast.Index {
    return {
      type: 'Index',
      receiver,
      argument,
    };
  }

  ternary(condition: ast.Expression, trueExpr: ast.Expression, falseExpr: ast.Expression): ast.Ternary {
    return {
      type: 'Ternary',
      condition,
      trueExpr,
      falseExpr,
    };
  }

  map(entries: { [key: string]: ast.Expression } | null): ast.Map {
    return {
      type: 'Map',
      entries,
    };
  }

  list(items: Array<ast.Expression> | null): ast.List {
    return {
      type: 'List',
      items,
    };
  }
}
