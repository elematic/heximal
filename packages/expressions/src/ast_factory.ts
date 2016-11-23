'use strict';

export type Node = Literal | Empty | ID | Unary | Binary | Getter | Invoke |
    Paren | Index | Ternary | Map | List;
export interface Literal {
  type: 'Literal';
  value: string|number|boolean|RegExp|null;
}
export interface Empty { type: 'Empty'; }
export interface ID {
  type: 'ID';
  value: string;
}
export interface Unary {
  type: 'Unary';
  operator: string;
  child: Node;
}
export interface Binary {
  type: 'Binary';
  operator: string;
  left: Node;
  right: Node;
}
export interface Getter {
  type: 'Getter';
  receiver: Node;
  name: string;
}
export interface Invoke {
  type: 'Invoke';
  receiver: Node;
  method: string|null;
  arguments: Array<Node|null>|null;
}
export interface Paren {
  type: 'Paren';
  child: Node;
}
export interface Index {
  type: 'Index';
  receiver: Node;
  argument: Node;
}
export interface Ternary {
  type: 'Ternary';
  condition: Node;
  trueExpr: Node;
  falseExpr: Node;
}
export interface Map {
  type: 'Map';
  entries: {[key: string]: Node | null}|null;
}
export interface List {
  type: 'List';
  items: Array<Node|null>|null;
}


export interface AstFactory<N> {
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

export class DefaultAstFactory implements AstFactory<Node> {
  empty(): Empty {
    return {type: 'Empty'};
  }

  // TODO(justinfagnani): just use a JS literal?
  literal(v: string|number|boolean|RegExp|null): Literal {
    return {
      type: 'Literal',
      value: v,
    };
  }

  id(v: string): ID {
    return {
      type: 'ID',
      value: v,
    };
  }

  unary(op: string, expr: Node): Unary {
    return {
      type: 'Unary',
      operator: op,
      child: expr,
    };
  }

  binary(l: Node, op: string, r: Node): Binary {
    return {
      type: 'Binary',
      operator: op,
      left: l,
      right: r,
    };
  }

  getter(g: Node, n: string): Getter {
    return {
      type: 'Getter',
      receiver: g,
      name: n,
    };
  }

  invoke(receiver: Node, method: string|null, args: Array<Node|null>|null):
      Invoke {
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

  paren(e: Node): Paren {
    return {
      type: 'Paren',
      child: e,
    };
  }

  index(e: Node, a: Node): Index {
    return {
      type: 'Index',
      receiver: e,
      argument: a,
    };
  }

  ternary(c: Node, t: Node, f: Node): Ternary {
    return {
      type: 'Ternary',
      condition: c,
      trueExpr: t,
      falseExpr: f,
    };
  }

  map(entries: {[key: string]: Node | null}|null): Map {
    return {
      type: 'Map',
      entries: entries,
    };
  }

  list(l: Array<Node|null>|null): List {
    return {
      type: 'List',
      items: l,
    };
  }
}
