/*
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
 */

import {ID, Invoke, Expression} from './ast.js';
import {AstFactory} from './ast_factory.js';
import {
  BINARY_OPERATORS,
  KEYWORDS,
  POSTFIX_PRECEDENCE,
  UNARY_OPERATORS,
} from './constants.js';
import {Kind, Token, Tokenizer} from './tokenizer.js';

export const parse = <E extends Expression>(
  expr: string,
  astFactory: AstFactory<E>,
): E | undefined => new Parser<E>(expr, astFactory).parse();

export class Parser<N extends Expression> {
  #kind?: Kind;
  #tokenizer: Tokenizer;
  #ast: AstFactory<N>;
  #token?: Token;
  #value?: string;

  constructor(input: string, astFactory: AstFactory<N>) {
    this.#tokenizer = new Tokenizer(input);
    this.#ast = astFactory;
  }

  parse(): N | undefined {
    this.#advance();
    return this.#parseExpression();
  }

  #advance(kind?: Kind, value?: string) {
    if (!this._matches(kind, value)) {
      throw new Error(
        `Expected kind ${kind} (${value}), was ${this.#token?.kind} (${this.#token?.value})`,
      );
    }
    const t = this.#tokenizer.nextToken();
    this.#token = t;
    this.#kind = t?.kind;
    this.#value = t?.value;
  }

  _matches(kind?: Kind, value?: string) {
    return !((kind && this.#kind !== kind) || (value && this.#value !== value));
  }

  #parseExpression(): N | undefined {
    if (!this.#token) return this.#ast.empty();
    const expr = this.#parseUnary();
    return expr === undefined ? undefined : this.#parsePrecedence(expr, 0);
  }

  // _parsePrecedence and _parseBinary implement the precedence climbing
  // algorithm as described in:
  // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
  #parsePrecedence(left: N | undefined, precedence: number) {
    if (left === undefined) {
      throw new Error('Expected left to be defined.');
    }
    while (this.#token) {
      if (this._matches(Kind.GROUPER, '(')) {
        const args = this.#parseArguments();
        left = this.#ast.invoke(left, undefined, args);
      } else if (this._matches(Kind.GROUPER, '[')) {
        const indexExpr = this.#parseIndex();
        left = this.#ast.index(left, indexExpr);
      } else if (this._matches(Kind.DOT)) {
        this.#advance();
        const right = this.#parseUnary();
        left = this.#makeInvokeOrGetter(left, right);
      } else if (this._matches(Kind.KEYWORD)) {
        break;
      } else if (
        this._matches(Kind.OPERATOR) &&
        this.#token.precedence >= precedence
      ) {
        left =
          this.#value === '?'
            ? this.#parseTernary(left)
            : this.#parseBinary(left, this.#token);
      } else {
        break;
      }
    }
    return left;
  }

  #makeInvokeOrGetter(left: N, right: N | undefined) {
    if (right === undefined) {
      throw new Error('expected identifier');
    }
    if (right.type === 'ID') {
      return this.#ast.getter(left, (right as ID).value);
    } else if (
      right.type === 'Invoke' &&
      (right as Invoke).receiver.type === 'ID'
    ) {
      const method = (right as Invoke).receiver as ID;
      return this.#ast.invoke(
        left,
        method.value,
        (right as Invoke).arguments as any,
      );
    } else {
      throw new Error(`expected identifier: ${right}`);
    }
  }

  #parseBinary(left: N, op: Token) {
    if (BINARY_OPERATORS.indexOf(op.value) === -1) {
      throw new Error(`unknown operator: ${op.value}`);
    }
    this.#advance();
    let right = this.#parseUnary();
    while (
      (this.#kind === Kind.OPERATOR ||
        this.#kind === Kind.DOT ||
        this.#kind === Kind.GROUPER) &&
      this.#token!.precedence > op.precedence
    ) {
      right = this.#parsePrecedence(right, this.#token!.precedence);
    }
    return this.#ast.binary(left, op.value, right);
  }

  #parseUnary(): N | undefined {
    if (this._matches(Kind.OPERATOR)) {
      const value = this.#value;
      this.#advance();
      // handle unary + and - on numbers as part of the literal, not as a
      // unary operator
      if (value === '+' || value === '-') {
        if (this._matches(Kind.INTEGER)) {
          return this.#parseInteger(value);
        } else if (this._matches(Kind.DECIMAL)) {
          return this.#parseDecimal(value);
        }
      }
      if (UNARY_OPERATORS.indexOf(value!) === -1)
        throw new Error(`unexpected token: ${value}`);
      const expr = this.#parsePrecedence(
        this.#parsePrimary(),
        POSTFIX_PRECEDENCE,
      );
      return this.#ast.unary(value!, expr);
    }
    return this.#parsePrimary();
  }

  #parseTernary(condition: N) {
    this.#advance(Kind.OPERATOR, '?');
    const trueExpr = this.#parseExpression();
    this.#advance(Kind.COLON);
    const falseExpr = this.#parseExpression();
    return this.#ast.ternary(condition, trueExpr, falseExpr);
  }

  #parsePrimary() {
    switch (this.#kind) {
      case Kind.KEYWORD:
        const keyword = this.#value!;
        if (keyword === 'this') {
          this.#advance();
          // TODO(justin): return keyword node
          return this.#ast.id(keyword);
        } else if (KEYWORDS.indexOf(keyword) !== -1) {
          throw new Error(`unexpected keyword: ${keyword}`);
        }
        throw new Error(`unrecognized keyword: ${keyword}`);
      case Kind.IDENTIFIER:
        return this.#parseInvokeOrIdentifier();
      case Kind.STRING:
        return this.#parseString();
      case Kind.INTEGER:
        return this.#parseInteger();
      case Kind.DECIMAL:
        return this.#parseDecimal();
      case Kind.GROUPER:
        if (this.#value === '(') {
          return this.#parseParenOrFunction();
        } else if (this.#value === '{') {
          return this.#parseMap();
        } else if (this.#value === '[') {
          return this.#parseList();
        }
        return undefined;
      case Kind.COLON:
        throw new Error('unexpected token ":"');
      default:
        return undefined;
    }
  }

  #parseList() {
    const items: (N | undefined)[] = [];
    do {
      this.#advance();
      if (this._matches(Kind.GROUPER, ']')) break;
      items.push(this.#parseExpression());
    } while (this._matches(Kind.COMMA));
    this.#advance(Kind.GROUPER, ']');
    return this.#ast.list(items);
  }

  #parseMap() {
    const entries: {[key: string]: N | undefined} = {};
    do {
      this.#advance();
      if (this._matches(Kind.GROUPER, '}')) break;
      const key = this.#value!;
      if (this._matches(Kind.STRING) || this._matches(Kind.IDENTIFIER)) {
        this.#advance();
      }
      this.#advance(Kind.COLON);
      entries[key] = this.#parseExpression();
    } while (this._matches(Kind.COMMA));
    this.#advance(Kind.GROUPER, '}');
    return this.#ast.map(entries);
  }

  #parseInvokeOrIdentifier() {
    const value = this.#value;
    if (value === 'true') {
      this.#advance();
      return this.#ast.literal(true);
    }
    if (value === 'false') {
      this.#advance();
      return this.#ast.literal(false);
    }
    if (value === 'null') {
      this.#advance();
      return this.#ast.literal(null);
    }
    if (value === 'undefined') {
      this.#advance();
      return this.#ast.literal(undefined);
    }
    const identifier = this.#parseIdentifier();
    const args = this.#parseArguments();
    return !args ? identifier : this.#ast.invoke(identifier, undefined, args);
  }

  #parseIdentifier() {
    if (!this._matches(Kind.IDENTIFIER)) {
      throw new Error(`expected identifier: ${this.#value}`);
    }
    const value = this.#value;
    this.#advance();
    return this.#ast.id(value!);
  }

  #parseArguments() {
    if (!this._matches(Kind.GROUPER, '(')) {
      return undefined;
    }
    const args: Array<N | undefined> = [];
    do {
      this.#advance();
      if (this._matches(Kind.GROUPER, ')')) {
        break;
      }
      const expr = this.#parseExpression();
      args.push(expr);
    } while (this._matches(Kind.COMMA));
    this.#advance(Kind.GROUPER, ')');
    return args;
  }

  #parseIndex() {
    // console.assert(this._matches(Kind.GROUPER, '['));
    this.#advance();
    const expr = this.#parseExpression();
    this.#advance(Kind.GROUPER, ']');
    return expr;
  }

  #parseParenOrFunction() {
    const expressions = this.#parseArguments();
    if (this._matches(Kind.ARROW)) {
      this.#advance();
      const body = this.#parseExpression();
      const params = expressions?.map((e) => (e as ID).value) ?? [];
      return this.#ast.arrowFunction(params, body);
    } else {
      return this.#ast.paren(expressions![0]);
    }
  }

  #parseString() {
    const value = this.#ast.literal(this.#value!);
    this.#advance();
    return value;
  }

  #parseInteger(prefix: string = '') {
    const value = this.#ast.literal(parseInt(`${prefix}${this.#value}`, 10));
    this.#advance();
    return value;
  }

  #parseDecimal(prefix: string = '') {
    const value = this.#ast.literal(parseFloat(`${prefix}${this.#value}`));
    this.#advance();
    return value;
  }
}
