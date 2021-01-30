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

export function parse(
  expr: string,
  astFactory: AstFactory<Expression>
): Expression | undefined {
  return new Parser(expr, astFactory).parse();
}

export class Parser<N extends Expression> {
  private _kind?: Kind;
  private _tokenizer: Tokenizer;
  private _ast: AstFactory<N>;
  private _token?: Token;
  private _value?: string;

  constructor(input: string, astFactory: AstFactory<N>) {
    this._tokenizer = new Tokenizer(input);
    this._ast = astFactory;
  }

  parse(): N | undefined {
    this._advance();
    return this._parseExpression();
  }

  private _advance(kind?: Kind, value?: string) {
    if (!this._matches(kind, value)) {
      throw new Error(`Expected kind ${kind} (${value}), was ${this._token}`);
    }
    const t = this._tokenizer.nextToken();
    this._token = t;
    this._kind = t?.kind;
    this._value = t?.value;
  }

  _matches(kind?: Kind, value?: string) {
    return !((kind && this._kind !== kind) || (value && this._value !== value));
  }

  private _parseExpression(): N | undefined {
    if (!this._token) return this._ast.empty();
    const expr = this._parseUnary();
    return expr === undefined ? undefined : this._parsePrecedence(expr, 0);
  }

  // _parsePrecedence and _parseBinary implement the precedence climbing
  // algorithm as described in:
  // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
  private _parsePrecedence(left: N | undefined, precedence: number) {
    if (left === undefined) {
      throw new Error('Expected left to be defined.');
    }
    while (this._token) {
      if (this._matches(Kind.GROUPER, '(')) {
        const args = this._parseArguments();
        left = this._ast.invoke(left, undefined, args);
      } else if (this._matches(Kind.GROUPER, '[')) {
        const indexExpr = this._parseIndex();
        left = this._ast.index(left, indexExpr);
      } else if (this._matches(Kind.DOT)) {
        this._advance();
        const right = this._parseUnary();
        left = this._makeInvokeOrGetter(left, right);
      } else if (this._matches(Kind.KEYWORD)) {
        break;
      } else if (
        this._matches(Kind.OPERATOR) &&
        this._token.precedence >= precedence
      ) {
        left =
          this._value === '?'
            ? this._parseTernary(left)
            : this._parseBinary(left, this._token);
      } else {
        break;
      }
    }
    return left;
  }

  private _makeInvokeOrGetter(left: N, right: N | undefined) {
    if (right === undefined) {
      throw new Error('expected identifier');
    }
    if (right.type === 'ID') {
      return this._ast.getter(left, (right as ID).value);
    } else if (
      right.type === 'Invoke' &&
      (right as Invoke).receiver.type === 'ID'
    ) {
      const method = (right as Invoke).receiver as ID;
      return this._ast.invoke(
        left,
        method.value,
        (right as Invoke).arguments as any
      );
    } else {
      throw new Error(`expected identifier: ${right}`);
    }
  }

  private _parseBinary(left: N, op: Token) {
    if (BINARY_OPERATORS.indexOf(op.value) === -1) {
      throw new Error(`unknown operator: ${op.value}`);
    }
    this._advance();
    let right = this._parseUnary();
    while (
      (this._kind === Kind.OPERATOR ||
        this._kind === Kind.DOT ||
        this._kind === Kind.GROUPER) &&
      this._token!.precedence > op.precedence
    ) {
      right = this._parsePrecedence(right, this._token!.precedence);
    }
    return this._ast.binary(left, op.value, right);
  }

  private _parseUnary(): N | undefined {
    if (this._matches(Kind.OPERATOR)) {
      const value = this._value;
      this._advance();
      // handle unary + and - on numbers as part of the literal, not as a
      // unary operator
      if (value === '+' || value === '-') {
        if (this._matches(Kind.INTEGER)) {
          return this._parseInteger(value);
        } else if (this._matches(Kind.DECIMAL)) {
          return this._parseDecimal(value);
        }
      }
      if (UNARY_OPERATORS.indexOf(value!) === -1)
        throw new Error(`unexpected token: ${value}`);
      const expr = this._parsePrecedence(
        this._parsePrimary(),
        POSTFIX_PRECEDENCE
      );
      return this._ast.unary(value!, expr);
    }
    return this._parsePrimary();
  }

  private _parseTernary(condition: N) {
    this._advance(Kind.OPERATOR, '?');
    const trueExpr = this._parseExpression();
    this._advance(Kind.COLON);
    const falseExpr = this._parseExpression();
    return this._ast.ternary(condition, trueExpr, falseExpr);
  }

  private _parsePrimary() {
    switch (this._kind) {
      case Kind.KEYWORD:
        const keyword = this._value!;
        if (keyword === 'this') {
          this._advance();
          // TODO(justin): return keyword node
          return this._ast.id(keyword);
        } else if (KEYWORDS.indexOf(keyword) !== -1) {
          throw new Error(`unexpected keyword: ${keyword}`);
        }
        throw new Error(`unrecognized keyword: ${keyword}`);
      case Kind.IDENTIFIER:
        return this._parseInvokeOrIdentifier();
      case Kind.STRING:
        return this._parseString();
      case Kind.INTEGER:
        return this._parseInteger();
      case Kind.DECIMAL:
        return this._parseDecimal();
      case Kind.GROUPER:
        if (this._value === '(') {
          return this._parseParen();
        } else if (this._value === '{') {
          return this._parseMap();
        } else if (this._value === '[') {
          return this._parseList();
        }
        return undefined;
      case Kind.COLON:
        throw new Error('unexpected token ":"');
      default:
        return undefined;
    }
  }

  private _parseList() {
    const items: (N | undefined)[] = [];
    do {
      this._advance();
      if (this._matches(Kind.GROUPER, ']')) break;
      items.push(this._parseExpression());
    } while (this._matches(Kind.COMMA));
    this._advance(Kind.GROUPER, ']');
    return this._ast.list(items);
  }

  private _parseMap() {
    const entries: {[key: string]: N | undefined} = {};
    do {
      this._advance();
      if (this._matches(Kind.GROUPER, '}')) break;
      const key = this._value!;
      this._advance(Kind.STRING);
      this._advance(Kind.COLON);
      entries[key] = this._parseExpression();
    } while (this._matches(Kind.COMMA));
    this._advance(Kind.GROUPER, '}');
    return this._ast.map(entries);
  }

  private _parseInvokeOrIdentifier() {
    const value = this._value;
    if (value === 'true') {
      this._advance();
      return this._ast.literal(true);
    }
    if (value === 'false') {
      this._advance();
      return this._ast.literal(false);
    }
    if (value === 'null') {
      this._advance();
      return this._ast.literal(null);
    }
    const identifier = this._parseIdentifier();
    const args = this._parseArguments();
    return !args ? identifier : this._ast.invoke(identifier, undefined, args);
  }

  private _parseIdentifier() {
    if (!this._matches(Kind.IDENTIFIER)) {
      throw new Error(`expected identifier: ${this._value}`);
    }
    const value = this._value;
    this._advance();
    return this._ast.id(value!);
  }

  private _parseArguments() {
    if (!this._matches(Kind.GROUPER, '(')) {
      return undefined;
    }
    const args: Array<N | undefined> = [];
    do {
      this._advance();
      if (this._matches(Kind.GROUPER, ')')) {
        break;
      }
      const expr = this._parseExpression();
      args.push(expr);
    } while (this._matches(Kind.COMMA));
    this._advance(Kind.GROUPER, ')');
    return args;
  }

  private _parseIndex() {
    // console.assert(this._matches(Kind.GROUPER, '['));
    this._advance();
    const expr = this._parseExpression();
    this._advance(Kind.GROUPER, ']');
    return expr;
  }

  private _parseParen() {
    this._advance();
    const expr = this._parseExpression();
    this._advance(Kind.GROUPER, ')');
    return this._ast.paren(expr);
  }

  private _parseString() {
    const value = this._ast.literal(this._value!);
    this._advance();
    return value;
  }

  private _parseInteger(prefix: string = '') {
    const value = this._ast.literal(parseInt(`${prefix}${this._value}`, 10));
    this._advance();
    return value;
  }

  private _parseDecimal(prefix: string = '') {
    const value = this._ast.literal(parseFloat(`${prefix}${this._value}`));
    this._advance();
    return value;
  }
}
