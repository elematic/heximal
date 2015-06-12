'use strict';

const _GROUPERS = '()[]{}';
const _OPERATORS = '+-*/!&%<=>?^|';
const _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];
const _THREE_CHAR_OPS = ['===', '!=='];
const _KEYWORDS = ['this'];

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

const _WHITESPACE = new RegExp('^\\s$');
function isWhitespace(next) {
  return _WHITESPACE.test(next);
}

// TODO(justinfagnani): allow code points > 127
const _IDENT_START = new RegExp('^[a-zA-Z_$]$');
function isIdentifierOrKeywordStart(next) {
  return _IDENT_START.test(next);
}

// TODO(justinfagnani): allow code points > 127
const _IDENT = new RegExp('^[a-zA-Z0-9_$]$');
function isIdentifier(next) {
  return _IDENT.test(next);
}

function isKeyword(str) {
  return _KEYWORDS.indexOf(str) !== -1;
}

const _QUOTE = new RegExp('^[\\\"\\\']$');
function isQuote(next) {
  return _QUOTE.test(next);
}

const _NUMBER = new RegExp('^[0-9]$');
function isNumber(next) {
  return _NUMBER.test(next);
}

function isOperator(next) {
  return _OPERATORS.indexOf(next) !== -1;
}

function isGrouper(next) {
  return _GROUPERS.indexOf(next) !== -1;
}

const _ESCAPE = new RegExp('\\\\(.)', 'g');
function _escapeString(str) {
  return str.replace(_ESCAPE, function(match, group) {
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

export function token(kind, value, precedence) {
  return {
    kind: kind,
    value: value,
    precedence: precedence || 0,
  };
}

export class Tokenizer {

  constructor(input) {
    this._input = input;
    this._index = -1;
    this._tokenStart = 0;
    // this._tokens = [];
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
    while(this._next !== null && isWhitespace(this._next)) {
      this._advance(true);
    }
    if (isQuote(this._next)) return this._tokenizeString();
    if (isIdentifierOrKeywordStart(this._next)) return this._tokenizeIdentifierOrKeyword();
    if (isNumber(this._next)) return this._tokenizeNumber();
    if (this._next === '.') return this._tokenizeDot();
    if (this._next === ',') return this._tokenizeComma();
    if (this._next === ':') return this._tokenizeColon();
    if (isOperator(this._next)) return this._tokenizeOperator();
    if (isGrouper(this._next)) return this._tokenizeGrouper();
    // no match
    this._advance(true);
    console.assert(this._next == null);
    return null;
  }

  _tokenizeString() {
    let quoteChar = this._next;
    this._advance(true);
    while (this._next !== quoteChar) {
      if (this._next === null) throw new ParseException("unterminated string");
      if (this._next === '\\') {
        this._advance();
        if (this._next === null) throw new ParseException("unterminated string");
      }
      this._advance();
    }
    let t = token(STRING, _escapeString(this._getValue()));
    this._advance();
    return t;
  }

  _tokenizeIdentifierOrKeyword() {
    while (this._next !== null && isIdentifier(this._next)) {
      this._advance();
    }
    let value = this._getValue();
    let kind = isKeyword(value) ? KEYWORD : IDENTIFIER;
    return token(kind, value);
  }

  _tokenizeNumber() {
    while (this._next !== null && isNumber(this._next)) {
      this._advance();
    }
    if (this._next === '.') return this._tokenizeDot();
    return token(INTEGER, this._getValue());
  }

  _tokenizeDot() {
    this._advance();
    if (isNumber(this._next)) return this._tokenizeFraction();
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
    while (this._next !== null && isNumber(this._next)) {
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

class ParseException /* implements Exception */ {
  constructor(message) {
    this.message = message;
  }

  toString() {
    return `ParseException: ${this.message}`;
  }
}
