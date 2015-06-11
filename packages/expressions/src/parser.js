'use strict';

// var tokenizer = require('./tokenizer');

import * as tokenizer from 'polymer-expressions/tokenizer';

var Tokenizer = tokenizer.Tokenizer;
var Token = tokenizer.Token;
var STRING_TOKEN = tokenizer.STRING_TOKEN;
var IDENTIFIER_TOKEN = tokenizer.IDENTIFIER_TOKEN;
var DOT_TOKEN = tokenizer.DOT_TOKEN;
var COMMA_TOKEN = tokenizer.COMMA_TOKEN;
var COLON_TOKEN = tokenizer.COLON_TOKEN;
var INTEGER_TOKEN = tokenizer.INTEGER_TOKEN;
var DECIMAL_TOKEN = tokenizer.DECIMAL_TOKEN;
var OPERATOR_TOKEN = tokenizer.OPERATOR_TOKEN;
var GROUPER_TOKEN = tokenizer.GROUPER_TOKEN;
var KEYWORD_TOKEN = tokenizer.KEYWORD_TOKEN;
var POSTFIX_PRECEDENCE = tokenizer.POSTFIX_PRECEDENCE;
var PRECEDENCE = tokenizer.PRECEDENCE;

const _UNARY_OPERATORS = ['+', '-', '!'];
const _BINARY_OPERATORS = ['+', '-', '*', '/', '%', '^', '==',
    '!=', '>', '<', '>=', '<=', '||', '&&', '&', '===', '!==', '|'];

export function parse(expr) {
  return new Parser(expr).parse();
}

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

class ArrayIterator {

  constructor(arr) {
    this._arr = arr;
    this._index = -1;
    this._length = arr.length;
  }

  moveNext() {
    if (this._index < this._length) this._index++;
    return this._index < this._length;
  }

  get current() {
    return (this._index === -1) || (this._index === this._length)
        ? null
        : this._arr[this._index];
  }
}

export class Parser {
  // final AstFactory _astFactory;
  // final Tokenizer _tokenizer;
  // List<Token> _tokens;
  // Iterator _iterator;

  constructor(input, astFactory) {
    this._tokenizer = new Tokenizer(input);
    this._astFactory = (astFactory == null) ? new AstFactory() : astFactory;
  }

  parse() {
    this._tokens = this._tokenizer.tokenize();
    this._iterator = new ArrayIterator(this._tokens);
    this._advance();
    return this._parseExpression();
  }

  _advance(kind, value) {
    if ((kind != null && (this._token == null || this._token.kind !== kind))
        || (value != null && (this._token == null || this._token.value !== value))) {
      throw new ParseException("Expected kind $kind ($value): $this._token");
    }
    this._iterator.moveNext();
    // this._token = this._iterator.current;
  }

  get _token() {
    return this._iterator.current;
  }

  _parseExpression() {
    // console.log('_parseExpression', this._token);
    if (this._token == null) return this._astFactory.empty();
    let expr = this._parseUnary();
    // console.log('unary = ', expr);
    return (expr == null) ? null : this._parsePrecedence(expr, 0);
  }

  // _parsePrecedence and _parseBinary implement the precedence climbing
  // algorithm as described in:
  // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
  _parsePrecedence(left, precedence) {
    // console.log('_parsePrecedence', left, precedence);
    // console.log('  token', this._token);
    console.assert(left != null);
    while (this._token != null) {
      if (this._token.kind == GROUPER_TOKEN) {
        if (this._token.value == '(') {
          let args = this._parseArguments();
          console.assert(args != null);
          left = this._astFactory.invoke(left, null, args);
        } else if (this._token.value == '[') {
          let indexExpr = this._parseIndex();
          left = this._astFactory.index(left, indexExpr);
        } else {
          break;
        }
      } else if (this._token.kind == DOT_TOKEN) {
        this._advance();
        let right = this._parseUnary();
        left = this._makeInvokeOrGetter(left, right);
      } else if (this._token.kind == KEYWORD_TOKEN) {
        if (this._token.value == 'in') {
          left = this._parseInExpression(left);
        } else if (this._token.value == 'as') {
          left = this._parseAsExpression(left);
        } else {
          break;
        }
      } else if (this._token.kind == OPERATOR_TOKEN
          && this._token.precedence >= precedence) {
        left = this._token.value == '?' ? this._parseTernary(left) : this._parseBinary(left);
      } else {
        break;
      }
    }
    return left;
  }

  // invoke or getter
  _makeInvokeOrGetter(left, right) {
    if (right.type === 'Identifier') {
      return this._astFactory.getter(left, right.value);
    } else if (right.type === 'Invoke' && right.receiver.type === 'Identifier') {
      let method = right.receiver;
      return this._astFactory.invoke(left, method.value, right.arguments);
    } else {
      throw new ParseException("expected identifier: $right");
    }
  }

  _parseBinary(left) {
    let op = this._token;
    if (_BINARY_OPERATORS.indexOf(op.value) === -1) {
      throw new ParseException("unknown operator: ${op.value}");
    }
    this._advance();
    let right = this._parseUnary();
    while (this._token != null
        && (this._token.kind == OPERATOR_TOKEN
        || this._token.kind == DOT_TOKEN
        || this._token.kind == GROUPER_TOKEN)
        && this._token.precedence > op.precedence) {
      right = this._parsePrecedence(right, this._token.precedence);
    }
    return this._astFactory.binary(left, op.value, right);
  }

  _parseUnary() {
    // console.log('_parseUnary', this._token);
    if (this._token.kind === OPERATOR_TOKEN) {
      let value = this._token.value;
      if (value === '+' || value === '-') {
        this._advance();
        if (this._token.kind === INTEGER_TOKEN) {
          return this._parseInteger(value);
        } else if (this._token.kind === DECIMAL_TOKEN) {
          return this._parseDecimal(value);
        } else {
          let expr = this._parsePrecedence(this._parsePrimary(), POSTFIX_PRECEDENCE);
          return this._astFactory.unary(value, expr);
        }
      } else if (value === '!') {
        this._advance();
        let expr = this._parsePrecedence(this._parsePrimary(), POSTFIX_PRECEDENCE);
        return this._astFactory.unary(value, expr);
      } else {
        throw new ParseException("unexpected token: $value");
      }
    }
    return this._parsePrimary();
  }

  _parseTernary(condition) {
    this._advance(OPERATOR_TOKEN, '?');
    let trueExpr = this._parseExpression();
    this._advance(COLON_TOKEN);
    let falseExpr = this._parseExpression();
    return this._astFactory.ternary(condition, trueExpr, falseExpr);
  }

  _parsePrimary() {
    // console.log('_parsePrimary', this._token);
    let kind = this._token.kind;
    switch (kind) {
      case KEYWORD_TOKEN:
        var keyword = this._token.value;
        if (keyword === 'this') {
          this._advance();
          // TODO(justin): return keyword node
          return this._astFactory.identifier('this');
        } else if (KEYWORDS.indexOf(keyword) !== -1) {
          throw new ParseException('unexpected keyword: $keyword');
        }
        throw new ParseException('unrecognized keyword: $keyword');
      case IDENTIFIER_TOKEN:
        return this._parseInvokeOrIdentifier();
      case STRING_TOKEN:
        return this._parseString();
      case INTEGER_TOKEN:
        return this._parseInteger();
      case DECIMAL_TOKEN:
        return this._parseDecimal();
      case GROUPER_TOKEN:
        if (this._token.value == '(') {
          return this._parseParenthesized();
        } else if (this._token.value == '{') {
          return this._parseMapLiteral();
        } else if (this._token.value == '[') {
          return this._parseListLiteral();
        }
        return null;
      case COLON_TOKEN:
        throw new ParseException('unexpected token ":"');
      default:
        return null;
    }
  }

  _parseListLiteral() {
    let items = [];
    do {
      this._advance();
      if (this._token.kind == GROUPER_TOKEN && this._token.value == ']') {
        break;
      }
      items.push(this._parseExpression());
    } while(this._token != null && this._token.value == ',');
    this._advance(GROUPER_TOKEN, ']');
    return this._astFactory.listLiteral(items);
  }

  _parseMapLiteral() {
    let entries = [];
    do {
      this._advance();
      if (this._token.kind == GROUPER_TOKEN && this._token.value == '}') {
        break;
      }
      entries.push(this._parseMapLiteralEntry());
    } while(this._token != null && this._token.value == ',');
    this._advance(GROUPER_TOKEN, '}');
    return this._astFactory.mapLiteral(entries);
  }

  _parseMapLiteralEntry() {
    let key = this._parseString();
    this._advance(COLON_TOKEN, ':');
    let value = this._parseExpression();
    return this._astFactory.mapLiteralEntry(key, value);
  }

  // _parseInExpression(left) {
  //   console.assert(this._token.value == 'in');
  //   if (!(left instanceof Identifier)) {
  //     throw new ParseException(
  //         "in... statements must start with an identifier");
  //   }
  //   this._advance();
  //   let right = this._parseExpression();
  //   return this._astFactory.inExpr(left, right);
  // }
  //
  // _parseAsExpression(left) {
  //   console.assert(this._token.value == 'as');
  //   this._advance();
  //   let right = _parseExpression();
  //   if (!(right instanceof Identifier)) {
  //     throw new ParseException(
  //         "'as' statements must end with an identifier");
  //   }
  //   return _astFactory.asExpr(left, right);
  // }

  _parseInvokeOrIdentifier() {
    // console.log('_parseInvokeOrIdentifier');
    if (this._token.value === 'true') {
      this._advance();
      return this._astFactory.literal(true);
    }
    if (this._token.value === 'false') {
      this._advance();
      return this._astFactory.literal(false);
    }
    if (this._token.value == 'null') {
      this._advance();
      return this._astFactory.literal(null);
    }
    let identifier = this._parseIdentifier();
    let args = this._parseArguments();
    if (args == null) {
      return identifier;
    } else {
      return this._astFactory.invoke(identifier, null, args);
    }
  }

  _parseIdentifier() {
    // console.log('_parseIdentifier');
    if (this._token.kind !== IDENTIFIER_TOKEN) {
      throw new ParseException("expected identifier: $_token.value");
    }
    let value = this._token.value;
    this._advance();
    return this._astFactory.identifier(value);
  }

  _parseArguments() {
    if (this._token != null && this._token.kind == GROUPER_TOKEN && this._token.value == '(') {
      let args = [];
      do {
        this._advance();
        if (this._token.kind == GROUPER_TOKEN && this._token.value == ')') {
          break;
        }
        let expr = this._parseExpression();
        args.push(expr);
      } while(this._token != null && this._token.value == ',');
      this._advance(GROUPER_TOKEN, ')');
      return args;
    }
    return null;
  }

  _parseIndex() {
    if (this._token != null && this._token.kind == GROUPER_TOKEN && this._token.value == '[') {
      this._advance();
      let expr = this._parseExpression();
      this._advance(GROUPER_TOKEN, ']');
      return expr;
    }
    return null;
  }

  _parseParenthesized() {
    this._advance();
    let expr = this._parseExpression();
    this._advance(GROUPER_TOKEN, ')');
    return this._astFactory.parenthesized(expr);
  }

  _parseString() {
    let value = this._astFactory.literal(this._token.value);
    this._advance();
    return value;
  }

  _parseInteger(prefix) {
    prefix = prefix || '';
    let value = this._astFactory.literal(parseInt(`${prefix}${this._token.value}`, 10));
    this._advance();
    return value;
  }

  _parseDecimal(prefix) {
    prefix = prefix || '';
    let value = this._astFactory.literal(parseFloat(`${prefix}${this._token.value}`));
    this._advance();
    return value;
  }

}

// module.exports = {
//   Parser: Parser,
//   AstFactory: AstFactory,
// };
