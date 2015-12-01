'use strict';

const _GROUPERS = '()[]{}';
const _OPERATORS = '+-*/!&%<=>?^|';
const _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];
const _THREE_CHAR_OPS = ['===', '!=='];
const _KEYWORDS = ['this'];
const _UNARY_OPERATORS = ['+', '-', '!'];
const _BINARY_OPERATORS = ['+', '-', '*', '/', '%', '^', '==',
    '!=', '>', '<', '>=', '<=', '||', '&&', '&', '===', '!==', '|'];

const _PRECEDENCE = {
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

const _POSTFIX_PRECEDENCE = 11;
const _STRING = 1;
const _IDENTIFIER = 2;
const _DOT = 3;
const _COMMA = 4;
const _COLON = 5;
const _INTEGER = 6;
const _DECIMAL = 7;
const _OPERATOR = 8;
const _GROUPER = 9;
const _KEYWORD = 10;

export const PRECEDENCE = _PRECEDENCE;
export const POSTFIX_PRECEDENCE = _POSTFIX_PRECEDENCE;
export const STRING = _STRING;
export const IDENTIFIER = _IDENTIFIER;
export const DOT = _DOT;
export const COMMA = _COMMA;
export const COLON = _COLON;
export const INTEGER = _INTEGER;
export const DECIMAL = _DECIMAL;
export const OPERATOR = _OPERATOR;
export const GROUPER = _GROUPER;
export const KEYWORD = _KEYWORD;

export function token(kind, value, precedence) {
  return {
    kind: kind,
    value: value,
    precedence: precedence || 0,
  };
}

// This closure exists to hide utillity functions from the outter scope so that
// they're properly minimized by Uglify. This shouldn't be neccessary since
// they're not exported, but somehow the combination of Babel transpile to AMD
// modules and Uglify makes them appear in the final output.
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
      let t = token(_STRING, _escapeString(this._getValue()));
      this._advance();
      return t;
    }

    _tokenizeIdentOrKeyword() {
      while (_isIdentifier(this._next)) {
        this._advance();
      }
      let value = this._getValue();
      let kind = _isKeyword(value) ? _KEYWORD : _IDENTIFIER;
      return token(kind, value);
    }

    _tokenizeNumber() {
      while (_isNumber(this._next)) {
        this._advance();
      }
      if (this._next === '.') return this._tokenizeDot();
      return token(_INTEGER, this._getValue());
    }

    _tokenizeDot() {
      this._advance();
      if (_isNumber(this._next)) return this._tokenizeFraction();
      this._clearValue();
      return token(_DOT, '.', _POSTFIX_PRECEDENCE);
    }

    _tokenizeComma() {
      this._advance(true);
      return token(_COMMA, ',');
    }

    _tokenizeColon() {
      this._advance(true);
      return token(_COLON, ':');
    }

    _tokenizeFraction() {
      while (_isNumber(this._next)) {
        this._advance();
      }
      return token(_DECIMAL, this._getValue());
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
      return token(_OPERATOR, op, _PRECEDENCE[op]);
    }

    _tokenizeGrouper() {
      let value = this._next;
      let t = token(_GROUPER, value, _PRECEDENCE[value]);
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
      if (this._matches(_GROUPER, '(')) {
        let args = this._parseArguments();
        left = this._ast.invoke(left, null, args);
      } else if (this._matches(_GROUPER, '[')) {
        let indexExpr = this._parseIndex();
        left = this._ast.index(left, indexExpr);
      } else if (this._matches(_DOT)) {
        this._advance();
        let right = this._parseUnary();
        left = this._makeInvokeOrGetter(left, right);
      } else if (this._matches(_KEYWORD)) {
        break;
      } else if (this._matches(_OPERATOR)
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
    while ((this._kind == _OPERATOR
            || this._kind == _DOT
            || this._kind == _GROUPER)
        && this._token.precedence > op.precedence) {
      right = this._parsePrecedence(right, this._token.precedence);
    }
    return this._ast.binary(left, op.value, right);
  }

  _parseUnary() {
    if (this._matches(_OPERATOR)) {
      let value = this._value;
      this._advance();
      // handle unary + and - on numbers as part of the literal, not as a
      // unary operator
      if (value === '+' || value === '-') {
        if (this._matches(_INTEGER)) {
          return this._parseInteger(value);
        } else if (this._matches(_DECIMAL)) {
          return this._parseDecimal(value);
        }
      }
      if (_UNARY_OPERATORS.indexOf(value) === -1) throw new Error(`unexpected token: ${value}`);
      let expr = this._parsePrecedence(this._parsePrimary(), _POSTFIX_PRECEDENCE);
      return this._ast.unary(value, expr);
    }
    return this._parsePrimary();
  }

  _parseTernary(condition) {
    this._advance(_OPERATOR, '?');
    let trueExpr = this._parseExpression();
    this._advance(_COLON);
    let falseExpr = this._parseExpression();
    return this._ast.ternary(condition, trueExpr, falseExpr);
  }

  _parsePrimary() {
    switch (this._kind) {
      case _KEYWORD:
        var keyword = this._value;
        if (keyword === 'this') {
          this._advance();
          // TODO(justin): return keyword node
          return this._ast.id(keyword);
        } else if (_KEYWORDS.indexOf(keyword) !== -1) {
          throw new Error(`unexpected keyword: ${keyword}`);
        }
        throw new Error(`unrecognized keyword: ${keyword}`);
      case _IDENTIFIER:
        return this._parseInvokeOrIdentifier();
      case _STRING:
        return this._parseString();
      case _INTEGER:
        return this._parseInteger();
      case _DECIMAL:
        return this._parseDecimal();
      case _GROUPER:
        if (this._value == '(') {
          return this._parseParen();
        } else if (this._value == '{') {
          return this._parseMap();
        } else if (this._value == '[') {
          return this._parseList();
        }
        return null;
      case _COLON:
        throw new Error('unexpected token ":"');
      default:
        return null;
    }
  }

  _parseList() {
    let items = [];
    do {
      this._advance();
      if (this._matches(_GROUPER, ']')) break;
      items.push(this._parseExpression());
    } while(this._matches(_COMMA));
    this._advance(_GROUPER, ']');
    return this._ast.list(items);
  }

  _parseMap() {
    let entries = {};
    do {
      this._advance();
      if (this._matches(_GROUPER, '}')) break;
      let key = this._value;
      this._advance(_STRING);
      this._advance(_COLON);
      entries[key] = this._parseExpression();
    } while(this._matches(_COMMA));
    this._advance(_GROUPER, '}');
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
    if (!this._matches(_IDENTIFIER)) {
      throw new Error(`expected identifier: ${this._value}`);
    }
    let value = this._value;
    this._advance();
    return this._ast.id(value);
  }

  _parseArguments() {
    if (this._matches(_GROUPER, '(')) {
      let args = [];
      do {
        this._advance();
        if (this._matches(_GROUPER, ')')) {
          break;
        }
        let expr = this._parseExpression();
        args.push(expr);
      } while(this._matches(_COMMA));
      this._advance(_GROUPER, ')');
      return args;
    }
    return null;
  }

  _parseIndex() {
    if (this._matches(_GROUPER, '[')) {
      this._advance();
      let expr = this._parseExpression();
      this._advance(_GROUPER, ']');
      return expr;
    }
    return null;
  }

  _parseParen() {
    this._advance();
    let expr = this._parseExpression();
    this._advance(_GROUPER, ')');
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
