'use strict';

import {AstFactory} from './ast_factory';

const _BINARY_OPERATORS = {
  '+': function(a: any, b: any) {
    return a + b;
  },
  '-': function(a: any, b: any) {
    return a - b;
  },
  '*': function(a: any, b: any) {
    return a * b;
  },
  '/': function(a: any, b: any) {
    return a / b;
  },
  '%': function(a: any, b: any) {
    return a % b;
  },
  '==': function(a: any, b: any) {
    return a == b;  // tslint:disable-line: triple-equals
  },
  '!=': function(a: any, b: any) {
    return a != b;  // tslint:disable-line: triple-equals
  },
  '===': function(a: any, b: any) {
    return a === b;
  },
  '!==': function(a: any, b: any) {
    return a !== b;
  },
  '>': function(a: any, b: any) {
    return a > b;
  },
  '>=': function(a: any, b: any) {
    return a >= b;
  },
  '<': function(a: any, b: any) {
    return a < b;
  },
  '<=': function(a: any, b: any) {
    return a <= b;
  },
  '||': function(a: any, b: any) {
    return a || b;
  },
  '&&': function(a: any, b: any) {
    return a && b;
  },
  '|': function(a: any, f: Function) {
    return f(a);
  },
};

const _UNARY_OPERATORS = {
  '+': function(a: any) {
    return a;
  },
  '-': function(a: any) {
    return -a;
  },
  '!': function(a: any) {
    return !a;
  },
};

export interface Scope { [key: string]: any; }

export interface BaseNode {
  evaluate: (this: this, scope: Scope) => any;
  getIds(this: this, idents: string[]): string[];
}

export type Node = Literal | Empty | ID | Unary | Binary | Getter | Invoke |
    Index | Ternary | Map | List;
export interface Literal extends BaseNode {
  type: 'Literal';
  value: string|number|boolean|RegExp|null;
}
export interface Empty extends BaseNode { type: 'Empty'; }
export interface ID extends BaseNode {
  type: 'ID';
  value: string;
}
export interface Unary extends BaseNode {
  type: 'Unary';
  operator: string;
  child: Node;
}
export interface Binary extends BaseNode {
  type: 'Binary';
  operator: string;
  left: Node;
  right: Node;
}
export interface Getter extends BaseNode {
  type: 'Getter';
  receiver: Node;
  name: string;
}
export interface Invoke extends BaseNode {
  type: 'Invoke';
  receiver: Node;
  method: string|null;
  arguments: Array<Node|null>|null;
}
export interface Index extends BaseNode {
  type: 'Index';
  receiver: Node;
  argument: Node;
}
export interface Ternary extends BaseNode {
  type: 'Ternary';
  condition: Node;
  trueExpr: Node;
  falseExpr: Node;
}
export interface Map extends BaseNode {
  type: 'Map';
  entries: {[key: string]: Node | null}|null;
}
export interface List extends BaseNode {
  type: 'List';
  items: Array<Node|null>|null;
}

export class EvalAstFactory implements AstFactory<Node> {
  empty(): Empty {
    // TODO(justinfagnani): return null instead?
    return {
      type: 'Empty',
      evaluate: function(scope) {
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
      evaluate: function(_scope) {
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
      evaluate: function(scope) {
        // TODO(justinfagnani): this prevernts access to properties named 'this'
        if (this.value === 'this')
          return scope;
        return scope[this.value];
      },
      getIds(idents) {
        idents.push(this.value);
        return idents;
      },
    };
  }

  unary(op: string, expr: Node): Unary {
    let f = _UNARY_OPERATORS[op];
    return {
      type: 'Unary',
      operator: op,
      child: expr,
      evaluate: function(scope) {
        return f(this.child.evaluate(scope));
      },
      getIds(idents) {
        return this.child.getIds(idents);
      },
    };
  }

  binary(l: Node, op: string, r: Node): Binary {
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

  getter(g: Node, n: string): Getter {
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

  invoke(receiver: Node, method: string, args: Node[]): Invoke {
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
        const f = this.method ? receiver[method] : receiver;
        const args = this.arguments || [];
        let argValues = args.map((a) => (a && a.evaluate(scope)));
        return f.apply(_this, argValues);
      },
      getIds(idents) {
        this.receiver.getIds(idents);
        (this.arguments || []).forEach(function(a) {
          return (a && a.getIds(idents));
        });
        return idents;
      },
    };
  }

  paren(e: Node): Node {
    return e;
  }

  index(e: Node, a: Node): Index {
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

  ternary(c: Node, t: Node, f: Node): Ternary {
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

  map(entries: {[key: string]: Node | null}|null): Map {
    return {
      type: 'Map',
      entries: entries,
      evaluate: function(scope) {
        let map = {};
        if (entries && this.entries) {
          for (let key in entries) {
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
          for (let key in entries) {
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
  list(l: Array<Node|null>|null): List {
    return {
      type: 'List',
      items: l,
      evaluate: function(scope) {
        return (this.items || []).map(function(a) {
          return (a && a.evaluate(scope));
        });
      },
      getIds(idents) {
        (this.items || []).forEach(function(i) {
          (i && i.getIds(idents));
        });
        return idents;
      },
    };
  }
}
