/* 
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
 */

export type Expression =
  | Literal
  | Empty
  | ID
  | Unary
  | Binary
  | Getter
  | Invoke
  | Paren
  | Index
  | Ternary
  | Map
  | List;

export type LiteralValue = string | number | boolean | null;

export interface Literal {
  type: 'Literal';
  value: LiteralValue;
}

export interface Empty {
  type: 'Empty';
}

export interface ID {
  type: 'ID';
  value: string;
}

export interface Unary {
  type: 'Unary';
  operator: string;
  child: Expression;
}

export interface Binary {
  type: 'Binary';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface Getter {
  type: 'Getter';
  receiver: Expression;
  name: string;
}

export interface Invoke {
  type: 'Invoke';
  receiver: Expression;
  method?: string;
  arguments?: Array<Expression>;
}

export interface Paren {
  type: 'Paren';
  child: Expression;
}

export interface Index {
  type: 'Index';
  receiver: Expression;
  argument?: Expression;
}

export interface Ternary {
  type: 'Ternary';
  condition: Expression;
  trueExpr: Expression;
  falseExpr: Expression;
}

export interface Map {
  type: 'Map';
  entries?: {[key: string]: Expression | undefined};
}

export interface List {
  type: 'List';
  items?: Array<Expression>;
}
