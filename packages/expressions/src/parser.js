'use strict';

const _GROUPERS = '()[]{}';
const _OPERATORS = '+-*/!&%<=>?^|';
const _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];
const _THREE_CHAR_OPS = ['===', '!=='];
const _KEYWORDS = ['this'];
const _UNARY_OPERATORS = ['+', '-', '!'];
const _BINARY_OPERATORS = ['+', '-', '*', '/', '%', '^', '==',
    '!=', '>', '<', '>=', '<=', '||', '&&', '&', '===', '!==', '|'];

export const PRECEDENCE = {
  '!':  0,
  ':':  0,
  ',':  0,
  ')':  0,
  ']':  0,
  '}':  0,
  '?':  1,
  '||': 2,
  '&&': 3,
  '|':  4,
  '^':  5,
  '&':  6,

  // equality
  '!=': 7,
  '==': 7,
  '!==': 7,
  '===': 7,

  // relational
  '>=': 8,
  '>':  8,
  '<=': 8,
  '<':  8,

  // additive
  '+':  9,
  '-':  9,

  // multiplicative
  '%':  10,
  '/':  10,
  '*':  10,

  // postfix
  '(':  11,
  '[':  11,
  '.':  11,
  '{': 11, //not sure this is correct
};

export const POSTFIX_PRECEDENCE = 11;

export const STRING = 1;
export const IDENTIFIER = 2;
export const DOT = 3;
export const COMMA = 4;
export const COLON = 5;
export const INTEGER = 6;
export const DECIMAL = 7;
export const OPERATOR = 8;
export const GROUPER = 9;
export const KEYWORD = 10;


export function token(kind, value, precedence) {
  return {
    kind: kind,
    value: value,
    precedence: precedence || 0,
  };
}

export const Tokenizer = (function() {

  function _isWhitespace(next) {
    return /^\s$/.test(next);
  }

  // TODO(justinfagnani): allow code points > 127
  function _isIdentOrKeywordStart(next) {
    return /^[a-zA-Z_$]$/.test(next);
  }

  // TODO(justinfagnani): allow code points > 127
  function _isIdentifier(next) {
    return /^[a-zA-Z0-9_$]$/.test(next);
  }

  function _isKeyword(str) {
    return _KEYWORDS.indexOf(str) !== -1;
  }

  function _isQuote(next) {
    return /^[\"\']$/.test(next);
  }

  function _isNumber(next) {
    return /^[0-9]$/.test(next);
  }

  function _isOperator(next) {
    return _OPERATORS.indexOf(next) !== -1;
  }

  function _isGrouper(next) {
    return _GROUPERS.indexOf(next) !== -1;
  }

  function _escapeString(str) {
    return str.replace(/\\(.)/g, function(match, group) {
      switch(group) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'b': return '\b';
        case 'f': return '\f';
        default: return group;
      }
    });
  }

  class Tokenizer {

    constructor(input) {
      this._input = input;
      this._index = -1;
      this._tokenStart = 0;
      this._next = null;
    }

    _advance(resetTokenStart) {
      if (this._index < this._input.length) {
        this._index++;
        this._next = this._input[this._index];
        if (resetTokenStart) {
          this._tokenStart = this._index;
        }
      } else {
        this._next = null;
      }
    }

    _getValue(lookahead) {
      let v = this._input.substring(this._tokenStart, this._index + (lookahead || 0));
      if (!lookahead) this._clearValue();
      return v;
    }

    _clearValue() {
      this._tokenStart = this._index;
    }

    nextToken() {
      if (this._index === -1) this._advance();
      while(_isWhitespace(this._next)) {
        this._advance(true);
      }
      if (_isQuote(this._next)) return this._tokenizeString();
      if (_isIdentOrKeywordStart(this._next)) return this._tokenizeIdentOrKeyword();
      if (_isNumber(this._next)) return this._tokenizeNumber();
      if (this._next === '.') return this._tokenizeDot();
      if (this._next === ',') return this._tokenizeComma();
      if (this._next === ':') return this._tokenizeColon();
      if (_isOperator(this._next)) return this._tokenizeOperator();
      if (_isGrouper(this._next)) return this._tokenizeGrouper();
      // no match, should be end of input
      this._advance();
      console.assert(!this._next);
      return null;
    }

    _tokenizeString() {
      const _us = "unterminated string";
      let quoteChar = this._next;
      this._advance(true);
      while (this._next !== quoteChar) {
        if (!this._next) throw new Error(_us);
        if (this._next === '\\') {
          this._advance();
          if (!this._next) throw new Error(_us);
        }
        this._advance();
      }
      let t = token(STRING, _escapeString(this._getValue()));
      this._advance();
      return t;
    }

    _tokenizeIdentOrKeyword() {
      while (_isIdentifier(this._next)) {
        this._advance();
      }
      let value = this._getValue();
      let kind = _isKeyword(value) ? KEYWORD : IDENTIFIER;
      return token(kind, value);
    }

    _tokenizeNumber() {
      while (_isNumber(this._next)) {
        this._advance();
      }
      if (this._next === '.') return this._tokenizeDot();
      return token(INTEGER, this._getValue());
    }

    _tokenizeDot() {
      this._advance();
      if (_isNumber(this._next)) return this._tokenizeFraction();
      this._clearValue();
      return token(DOT, '.', POSTFIX_PRECEDENCE);
    }

    _tokenizeComma() {
      this._advance(true);
      return token(COMMA, ',');
    }

    _tokenizeColon() {
      this._advance(true);
      return token(COLON, ':');
    }

    _tokenizeFraction() {
      while (_isNumber(this._next)) {
        this._advance();
      }
      return token(DECIMAL, this._getValue());
    }

    _tokenizeOperator() {
      this._advance();
      let op = this._getValue(2);

      if (_THREE_CHAR_OPS.indexOf(op) !== -1) {
        this._advance();
        this._advance();
      } else {
        op = this._getValue(1);
        if (_TWO_CHAR_OPS.indexOf(op) !== -1) {
          this._advance();
        }
      }
      op = this._getValue();
      return token(OPERATOR, op, PRECEDENCE[op]);
    }

    _tokenizeGrouper() {
      let value = this._next;
      let t = token(GROUPER, value, PRECEDENCE[value]);
      this._advance(true);
      return t;
    }
  }
  return Tokenizer;
})();

export function parse(expr, astFactory) {
  return new Parser(expr, astFactory).parse();
}

export class Parser {

  constructor(input, astFactory) {
    this._tokenizer = new Tokenizer(input);
    this._ast = astFactory;
    this._token = null;
    this._kind = null;
    this._value = null;
  }

  parse() {
    this._advance();
    return this._parseExpression();
  }

  _advance(kind, value) {
    if (!this._matches(kind, value)) {
      throw new Error(`Expected kind ${kind} (${value}), was ${this._token}`);
    }
    let t = this._tokenizer.nextToken();
    this._token = t
    this._kind = t && t.kind;
    this._value = t && t.value;
  }

  _matches(kind, value) {
    return !(kind && (this._kind != kind) || value && (this._value !== value));
  }

  _parseExpression() {
    if (!this._token) return this._ast.empty();
    let expr = this._parseUnary();
    return (!expr) ? null : this._parsePrecedence(expr, 0);
  }

  // _parsePrecedence and _parseBinary implement the precedence climbing
  // algorithm as described in:
  // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
  _parsePrecedence(left, precedence) {
    console.assert(left);
    while (this._token) {
      if (this._matches(GROUPER, '(')) {
        let args = this._parseArguments();
        left = this._ast.invoke(left, null, args);
      } else if (this._matches(GROUPER, '[')) {
        let indexExpr = this._parseIndex();
        left = this._ast.index(left, indexExpr);
      } else if (this._matches(DOT)) {
        this._advance();
        let right = this._parseUnary();
        left = this._makeInvokeOrGetter(left, right);
      } else if (this._matches(KEYWORD)) {
        break;
      } else if (this._matches(OPERATOR)
          && this._token.precedence >= precedence) {
        left = this._value == '?'
            ? this._parseTernary(left)
            : this._parseBinary(left);
      } else {
        break;
      }
    }
    return left;
  }

  _makeInvokeOrGetter(left, right) {
    if (right.type === 'ID') {
      return this._ast.getter(left, right.value);
    } else if (right.type === 'Invoke' && right.receiver.type === 'ID') {
      let method = right.receiver;
      return this._ast.invoke(left, method.value, right.arguments);
    } else {
      throw new Error(`expected identifier: ${right}`);
    }
  }

  _parseBinary(left) {
    let op = this._token;
    if (_BINARY_OPERATORS.indexOf(op.value) === -1) {
      throw new Error(`unknown operator: ${op.value}`);
    }
    this._advance();
    let right = this._parseUnary();
    while ((this._kind == OPERATOR
            || this._kind == DOT
            || this._kind == GROUPER)
        && this._token.precedence > op.precedence) {
      right = this._parsePrecedence(right, this._token.precedence);
    }
    return this._ast.binary(left, op.value, right);
  }

  _parseUnary() {
    if (this._matches(OPERATOR)) {
      let value = this._value;
      this._advance();
      // handle unary + and - on numbers as part of the literal, not as a
      // unary operator
      if (value === '+' || value === '-') {
        if (this._matches(INTEGER)) {
          return this._parseInteger(value);
        } else if (this._matches(DECIMAL)) {
          return this._parseDecimal(value);
        }
      }
      if (_UNARY_OPERATORS.indexOf(value) === -1) throw new Error(`unexpected token: ${value}`);
      let expr = this._parsePrecedence(this._parsePrimary(), POSTFIX_PRECEDENCE);
      return this._ast.unary(value, expr);
    }
    return this._parsePrimary();
  }

  _parseTernary(condition) {
    this._advance(OPERATOR, '?');
    let trueExpr = this._parseExpression();
    this._advance(COLON);
    let falseExpr = this._parseExpression();
    return this._ast.ternary(condition, trueExpr, falseExpr);
  }

  _parsePrimary() {
    switch (this._kind) {
      case KEYWORD:
        var keyword = this._value;
        if (keyword === 'this') {
          this._advance();
          // TODO(justin): return keyword node
          return this._ast.id(keyword);
        } else if (_KEYWORDS.indexOf(keyword) !== -1) {
          throw new Error(`unexpected keyword: ${keyword}`);
        }
        throw new Error(`unrecognized keyword: ${keyword}`);
      case IDENTIFIER:
        return this._parseInvokeOrIdentifier();
      case STRING:
        return this._parseString();
      case INTEGER:
        return this._parseInteger();
      case DECIMAL:
        return this._parseDecimal();
      case GROUPER:
        if (this._value == '(') {
          return this._parseParen();
        } else if (this._value == '{') {
          return this._parseMap();
        } else if (this._value == '[') {
          return this._parseList();
        }
        return null;
      case COLON:
        throw new Error('unexpected token ":"');
      default:
        return null;
    }
  }

  _parseList() {
    let items = [];
    do {
      this._advance();
      if (this._matches(GROUPER, ']')) break;
      items.push(this._parseExpression());
    } while(this._matches(COMMA));
    this._advance(GROUPER, ']');
    return this._ast.list(items);
  }

  _parseMap() {
    let entries = {};
    do {
      this._advance();
      if (this._matches(GROUPER, '}')) break;
      let key = this._value;
      this._advance(STRING);
      this._advance(COLON);
      entries[key] = this._parseExpression();
    } while(this._matches(COMMA));
    this._advance(GROUPER, '}');
    return this._ast.map(entries);
  }

  _parseInvokeOrIdentifier() {
    let value = this._value;
    if (value === 'true') {
      this._advance();
      return this._ast.literal(true);
    }
    if (value === 'false') {
      this._advance();
      return this._ast.literal(false);
    }
    if (value == 'null') {
      this._advance();
      return this._ast.literal(null);
    }
    let identifier = this._parseIdentifier();
    let args = this._parseArguments();
    return (!args) ? identifier : this._ast.invoke(identifier, null, args);
  }

  _parseIdentifier() {
    if (!this._matches(IDENTIFIER)) {
      throw new Error(`expected identifier: ${this._value}`);
    }
    let value = this._value;
    this._advance();
    return this._ast.id(value);
  }

  _parseArguments() {
    if (this._matches(GROUPER, '(')) {
      let args = [];
      do {
        this._advance();
        if (this._matches(GROUPER, ')')) {
          break;
        }
        let expr = this._parseExpression();
        args.push(expr);
      } while(this._matches(COMMA));
      this._advance(GROUPER, ')');
      return args;
    }
    return null;
  }

  _parseIndex() {
    if (this._matches(GROUPER, '[')) {
      this._advance();
      let expr = this._parseExpression();
      this._advance(GROUPER, ']');
      return expr;
    }
    return null;
  }

  _parseParen() {
    this._advance();
    let expr = this._parseExpression();
    this._advance(GROUPER, ')');
    return this._ast.paren(expr);
  }

  _parseString() {
    let value = this._ast.literal(this._value);
    this._advance();
    return value;
  }

  _parseInteger(prefix) {
    prefix = prefix || '';
    let value = this._ast.literal(parseInt(`${prefix}${this._value}`, 10));
    this._advance();
    return value;
  }

  _parseDecimal(prefix) {
    prefix = prefix || '';
    let value = this._ast.literal(parseFloat(`${prefix}${this._value}`));
    this._advance();
    return value;
  }

}
