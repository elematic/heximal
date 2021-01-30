import * as ast from './ast.js';
import {AstFactory} from './ast_factory.js';

const _BINARY_OPERATORS = {
  '+': (a: any, b: any) => a + b,
  '-': (a: any, b: any) => a - b,
  '*': (a: any, b: any) => a * b,
  '/': (a: any, b: any) => a / b,
  '%': (a: any, b: any) => a % b,
  '==': (a: any, b: any) => a == b,
  '!=': (a: any, b: any) => a != b,
  '===': (a: any, b: any) => a === b,
  '!==': (a: any, b: any) => a !== b,
  '>': (a: any, b: any) => a > b,
  '>=': (a: any, b: any) => a >= b,
  '<': (a: any, b: any) => a < b,
  '<=': (a: any, b: any) => a <= b,
  '||': (a: any, b: any) => a || b,
  '&&': (a: any, b: any) => a && b,
  '|': (a: any, f: (a: any) => any) => f(a),
};

const _UNARY_OPERATORS = {
  '+': (a: any) => a,
  '-': (a: any) => -a,
  '!': (a: any) => !a,
};

export interface Scope {
  [key: string]: any;
}

export interface Evaluatable {
  evaluate(scope: Scope): any;
  getIds(idents: string[]): string[];
}

export type Expression =
  | Literal
  | Empty
  | ID
  | Unary
  | Binary
  | Getter
  | Invoke
  | Index
  | Ternary
  | Map
  | List;

export interface Literal extends Evaluatable {
  type: 'Literal';
  value: ast.LiteralValue;
}
export interface Empty extends Evaluatable {
  type: 'Empty';
}
export interface ID extends Evaluatable {
  type: 'ID';
  value: string;
}
export interface Unary extends Evaluatable {
  type: 'Unary';
  operator: string;
  child: Expression;
}
export interface Binary extends Evaluatable {
  type: 'Binary';
  operator: string;
  left: Expression;
  right: Expression;
}
export interface Getter extends Evaluatable {
  type: 'Getter';
  receiver: Expression;
  name: string;
}
export interface Invoke extends Evaluatable {
  type: 'Invoke';
  receiver: Expression;
  method: string | null;
  arguments: Array<Expression> | null;
}
export interface Index extends Evaluatable {
  type: 'Index';
  receiver: Expression;
  argument: Expression;
}
export interface Ternary extends Evaluatable {
  type: 'Ternary';
  condition: Expression;
  trueExpr: Expression;
  falseExpr: Expression;
}
export interface Map extends Evaluatable {
  type: 'Map';
  entries: {[key: string]: Expression | null} | null;
}
export interface List extends Evaluatable {
  type: 'List';
  items: Array<Expression> | null;
}

export class EvalAstFactory implements AstFactory<Expression> {
  empty(): Empty {
    // TODO(justinfagnani): return null instead?
    return {
      type: 'Empty',
      evaluate(scope) {
        return scope;
      },
      getIds(idents) {
        return idents;
      },
    };
  }

  // TODO(justinfagnani): just use a JS literal?
  literal(v: string): Literal {
    return {
      type: 'Literal',
      value: v,
      evaluate(_scope) {
        return this.value;
      },
      getIds(idents) {
        return idents;
      },
    };
  }

  id(v: string): ID {
    return {
      type: 'ID',
      value: v,
      evaluate(scope) {
        // TODO(justinfagnani): this prevents access to properties named 'this'
        if (this.value === 'this') return scope;
        return scope[this.value];
      },
      getIds(idents) {
        idents.push(this.value);
        return idents;
      },
    };
  }

  unary(op: string, expr: Expression): Unary {
    const f = _UNARY_OPERATORS[op];
    return {
      type: 'Unary',
      operator: op,
      child: expr,
      evaluate(scope) {
        return f(this.child.evaluate(scope));
      },
      getIds(idents) {
        return this.child.getIds(idents);
      },
    };
  }

  binary(l: Expression, op: string, r: Expression): Binary {
    const f = _BINARY_OPERATORS[op];
    return {
      type: 'Binary',
      operator: op,
      left: l,
      right: r,
      evaluate(scope) {
        return f(this.left.evaluate(scope), this.right.evaluate(scope));
      },
      getIds(idents) {
        this.left.getIds(idents);
        this.right.getIds(idents);
        return idents;
      },
    };
  }

  getter(g: Expression, n: string): Getter {
    return {
      type: 'Getter',
      receiver: g,
      name: n,
      evaluate(scope) {
        return this.receiver.evaluate(scope)[this.name];
      },
      getIds(idents) {
        this.receiver.getIds(idents);
        return idents;
      },
    };
  }

  invoke(receiver: Expression, method: string, args: Expression[]): Invoke {
    if (method != null && typeof method !== 'string') {
      throw new Error('method not a string');
    }
    return {
      type: 'Invoke',
      receiver: receiver,
      method: method,
      arguments: args,
      evaluate(scope) {
        const receiver = this.receiver.evaluate(scope);
        // TODO(justinfagnani): this might be wrong in cases where we're
        // invoking a top-level function rather than a method. If method is
        // defined on a nested scope, then we should probably set _this to null.
        const _this = this.method ? receiver : scope['this'] ?? scope;
        const f = this.method ? receiver[method] : receiver;
        const args = this.arguments ?? [];
        const argValues = args.map((a) => a?.evaluate(scope));
        return f.apply(_this, argValues);
      },
      getIds(idents) {
        this.receiver.getIds(idents);
        this.arguments?.forEach((a) => a?.getIds(idents));
        return idents;
      },
    };
  }

  paren(e: Expression): Expression {
    return e;
  }

  index(e: Expression, a: Expression): Index {
    return {
      type: 'Index',
      receiver: e,
      argument: a,
      evaluate(scope) {
        return this.receiver.evaluate(scope)[this.argument.evaluate(scope)];
      },
      getIds(idents) {
        this.receiver.getIds(idents);
        return idents;
      },
    };
  }

  ternary(c: Expression, t: Expression, f: Expression): Ternary {
    return {
      type: 'Ternary',
      condition: c,
      trueExpr: t,
      falseExpr: f,
      evaluate(scope) {
        const c = this.condition.evaluate(scope);
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

  map(entries: {[key: string]: Expression} | null): Map {
    return {
      type: 'Map',
      entries: entries,
      evaluate(scope) {
        const map = {};
        if (entries && this.entries) {
          for (const key in entries) {
            const val = this.entries[key];
            if (val) {
              map[key] = val.evaluate(scope);
            }
          }
        }
        return map;
      },
      getIds(idents) {
        if (entries && this.entries) {
          for (const key in entries) {
            const val = this.entries[key];
            if (val) {
              val.getIds(idents);
            }
          }
        }
        return idents;
      },
    };
  }

  // TODO(justinfagnani): if the list is deeply literal
  list(l: Array<Expression> | null): List {
    return {
      type: 'List',
      items: l,
      evaluate(scope) {
        return this.items?.map((a) => a?.evaluate(scope));
      },
      getIds(idents) {
        this.items?.forEach((i) => i?.getIds(idents));
        return idents;
      },
    };
  }
}
