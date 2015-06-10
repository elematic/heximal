'use strict';

const _TAB = 9;
const _LF = 10;
const _VTAB = 11;
const _FF = 12;
const _CR = 13;
const _SPACE = 32;
const _BANG = 33;
const _DQ = 34;
const _$ = 36;
const _PERCENT = 37;
const _AMPERSAND = 38;
const _SQ = 39;
const _OPEN_PAREN = 40;
const _CLOSE_PAREN = 41;
const _STAR = 42;
const _PLUS = 43;
const _COMMA = 44;
const _MINUS = 45;
const _PERIOD = 46;
const _SLASH = 47;
const _0 = 48;
const _9 = 57;
const _COLON = 58;
const _LT = 60;
const _EQ = 61;
const _GT = 62;
const _QUESTION = 63;
const _A = 65;
const _Z = 90;
const _OPEN_SQUARE_BRACKET = 91;
const _BACKSLASH = 92;
const _CLOSE_SQUARE_BRACKET = 93;
const _CARET = 94;
const _US = 95;
const _a = 97;
const _f = 102;
const _n = 110;
const _r = 114;
const _t = 116;
const _v = 118;
const _z = 122;
const _OPEN_CURLY_BRACKET = 123;
const _BAR = 124;
const _CLOSE_CURLY_BRACKET = 125;
const _NBSP = 160;

const _OPERATORS = [_PLUS, _MINUS, _STAR, _SLASH, _BANG, _AMPERSAND, _PERCENT,
    _LT, _EQ, _GT, _QUESTION, _CARET, _BAR];

const _GROUPERS = [_OPEN_PAREN, _CLOSE_PAREN, _OPEN_SQUARE_BRACKET,
    _CLOSE_SQUARE_BRACKET, _OPEN_CURLY_BRACKET, _CLOSE_CURLY_BRACKET];

const _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];

const KEYWORDS = ['this'];

const _PRECEDENCE = {
  '!':  0,
  ':':  0,
  ',':  0,
  ')':  0,
  ']':  0,
  '}':  0, // ?
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

const POSTFIX_PRECEDENCE = 11;

const STRING_TOKEN = 1;
const IDENTIFIER_TOKEN = 2;
const DOT_TOKEN = 3;
const COMMA_TOKEN = 4;
const COLON_TOKEN = 5;
const INTEGER_TOKEN = 6;
const DECIMAL_TOKEN = 7;
const OPERATOR_TOKEN = 8;
const GROUPER_TOKEN = 9;
const KEYWORD_TOKEN = 10;

function isWhitespace(next) {
  return next === _SPACE || next === _TAB || next === _NBSP;
}

function isIdentifierOrKeywordStart(next) {
  return (_a <= next && next <= _z) ||
      (_A <= next && next <= _Z) || next === _US || next === _$ || next > 127;
}

function isIdentifier(next) {
  return (_a <= next && next <= _z) ||
      (_A <= next && next <= _Z) || (_0 <= next && next <= _9) ||
      next === _US || next === _$ || next > 127;
}

function isQuote(next) {
  return next === _DQ || next === _SQ;
}

function isNumber(next) {
  return _0 <= next && next <= _9;
}

function isOperator(next) {
  return _OPERATORS.indexOf(next) !== -1;
}

function isGrouper(next) {
  return _GROUPERS.indexOf(next) !== -1;
}

function escape(c) {
  switch (c) {
    case _f: return _FF;
    case _n: return _LF;
    case _r: return _CR;
    case _t: return _TAB;
    case _v: return _VTAB;
    default: return c;
  }
}

// TODO(justinfagnani): remove StringBuffer and RuneIterator. Tnstead track
// current token start index and end index and use String.substring to pull out
// individual token values. This will eliminate much string->char code->String
// conversion and reduce garbage.
class StringBuffer {

  constructor() {
    this.buffer = [];
  }

  clear() {
    this.buffer = [];
  }

  append(s) {
    this.buffer.push(s);
  }

  writeCharCode(c) {
    this.buffer.push(String.fromCharCode(c));
  }

  toString() {
    return this.buffer.join('');
  }

}

class RuneIterator {

  constructor(str) {
    this._str = str;
    this._index = -1;
    this._length = str.length;
  }

  moveNext() {
    if (this._index < this._length) this._index++;
    // console.log('moveNext', this.current);
    return this._index < this._length;
  }

  get current() {
    return (this._index === -1) || (this._index === this._length)
        ? null
        : this._str.charCodeAt(this._index);
  }
}

// TODO(justinfagnani): Pre-initialize and reuse the most common tokens: dot,
// comma, colon, etc.
class Token {
  constructor(kind, value, precedence) {
    this.kind = kind;
    this.value = value;
    this.precedence = precedence || 0;
  }

  toString() {
    return `(${kind}, '${value}')`;
  }
}

class Tokenizer {

  constructor(input) {
    this._tokens = [];
    this._sb = new StringBuffer();
    this._iterator = new RuneIterator(input);
    this._next = null;
  }

  _advance() {
    this._next = this._iterator.moveNext() ? this._iterator.current : null;
  }

  tokenize() {
    this._advance();
    while(this._next !== null) {
      if (isWhitespace(this._next)) {
        this._advance();
      } else if (isQuote(this._next)) {
        this.tokenizeString();
      } else if (isIdentifierOrKeywordStart(this._next)) {
        this.tokenizeIdentifierOrKeyword();
      } else if (isNumber(this._next)) {
        this.tokenizeNumber();
      } else if (this._next === _PERIOD) {
        this.tokenizeDot();
      } else if (this._next === _COMMA) {
        this.tokenizeComma();
      } else if (this._next === _COLON) {
        this.tokenizeColon();
      } else if (isOperator(this._next)) {
        this.tokenizeOperator();
      } else if (isGrouper(this._next)) {
        this.tokenizeGrouper();
      } else {
        this._advance();
      }
    }
    return this._tokens;
  }

  tokenizeString() {
    let quoteChar = this._next;
    this._advance();
    while (this._next !== quoteChar) {
      if (this._next === null) throw new ParseException("unterminated string");
      if (this._next === _BACKSLASH) {
        this._advance();
        if (this._next === null) throw new ParseException("unterminated string");
        this._sb.writeCharCode(escape(this._next));
      } else {
        this._sb.writeCharCode(this._next);
      }
      this._advance();
    }
    this._tokens.push(new Token(STRING_TOKEN, this._sb.toString()));
    this._sb.clear();
    this._advance();
  }

  tokenizeIdentifierOrKeyword() {
    while (this._next !== null && isIdentifier(this._next)) {
      this._sb.writeCharCode(this._next);
      this._advance();
    }
    let value = this._sb.toString();
    if (KEYWORDS.indexOf(value) !== -1) {
      this._tokens.push(new Token(KEYWORD_TOKEN, value));
    } else {
      this._tokens.push(new Token(IDENTIFIER_TOKEN, value));
    }
    this._sb.clear();
  }

  tokenizeNumber() {
    while (this._next !== null && isNumber(this._next)) {
      this._sb.writeCharCode(this._next);
      this._advance();
    }
    if (this._next === _PERIOD) {
      this.tokenizeDot();
    } else {
      this._tokens.push(new Token(INTEGER_TOKEN, this._sb.toString()));
      this._sb.clear();
    }
  }

  tokenizeDot() {
    this._advance();
    if (isNumber(this._next)) {
      this.tokenizeFraction();
    } else {
      this._tokens.push(new Token(DOT_TOKEN, '.', POSTFIX_PRECEDENCE));
    }
  }

  tokenizeComma() {
    this._advance();
    this._tokens.push(new Token(COMMA_TOKEN, ','));
  }

  tokenizeColon() {
    this._advance();
    this._tokens.push(new Token(COLON_TOKEN, ':'));
  }

  tokenizeFraction() {
    this._sb.writeCharCode(_PERIOD);
    while (this._next !== null && isNumber(this._next)) {
      this._sb.writeCharCode(this._next);
      this._advance();
    }
    this._tokens.push(new Token(DECIMAL_TOKEN, this._sb.toString()));
    this._sb.clear();
  }

  tokenizeOperator() {
    let startChar = this._next;
    this._advance();
    let op;
    // check for 2 character operators
    if (isOperator(this._next)) {
      let op2 = String.fromCharCode(startChar, this._next);
      if (_TWO_CHAR_OPS.indexOf(op2) !== -1) {
        op = op2;
        this._advance();
        // kind of hacky check for === and !==, could be better / more general
        if (this._next === _EQ && (startChar === _BANG || startChar === _EQ)) {
          op = op2 + '=';
          this._advance();
        }
      } else {
        op = String.fromCharCode(startChar);
      }
    } else {
      op = String.fromCharCode(startChar);
    }
    this._tokens.push(new Token(OPERATOR_TOKEN, op, _PRECEDENCE[op]));
  }

  tokenizeGrouper() {
    let value = String.fromCharCode(this._next);
    this._tokens.push(new Token(GROUPER_TOKEN, value, _PRECEDENCE[value]));
    this._advance();
  }
}

class ParseException /* implements Exception */ {
  // String message;
  constructor(message) {
    this.message = message;
  }

  toString() {
    return `ParseException: ${this.message}`;
  }
}

module.exports = {
  Tokenizer: Tokenizer,
  Token: Token,
  STRING_TOKEN: STRING_TOKEN,
  IDENTIFIER_TOKEN: IDENTIFIER_TOKEN,
  DOT_TOKEN: DOT_TOKEN,
  COMMA_TOKEN: COMMA_TOKEN,
  COLON_TOKEN: COLON_TOKEN,
  INTEGER_TOKEN: INTEGER_TOKEN,
  DECIMAL_TOKEN: DECIMAL_TOKEN,
  OPERATOR_TOKEN: OPERATOR_TOKEN,
  GROUPER_TOKEN: GROUPER_TOKEN,
  KEYWORD_TOKEN: KEYWORD_TOKEN,
  POSTFIX_PRECEDENCE: POSTFIX_PRECEDENCE,
  PRECEDENCE: _PRECEDENCE,
};
