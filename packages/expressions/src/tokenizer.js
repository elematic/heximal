'use strict';

const _GROUPERS = '()[]{}';
const _OPERATORS = '+-*/!&%<=>?^|';
const _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];
const _THREE_CHAR_OPS = ['===', '!=='];
const KEYWORDS = ['this'];

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
export const PRECEDENCE = _PRECEDENCE;

export const POSTFIX_PRECEDENCE = 11;

export const STRING_TOKEN = 1;
export const IDENTIFIER_TOKEN = 2;
export const DOT_TOKEN = 3;
export const COMMA_TOKEN = 4;
export const COLON_TOKEN = 5;
export const INTEGER_TOKEN = 6;
export const DECIMAL_TOKEN = 7;
export const OPERATOR_TOKEN = 8;
export const GROUPER_TOKEN = 9;
export const KEYWORD_TOKEN = 10;

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
  return KEYWORDS.indexOf(str) !== -1;
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
function escapeString(str) {
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

// TODO(justinfagnani): Pre-initialize and reuse the most common tokens: dot,
// comma, colon, etc.
export class Token {
  constructor(kind, value, precedence) {
    this.kind = kind;
    this.value = value;
    this.precedence = precedence || 0;
  }
}

export class Tokenizer {

  constructor(input) {
    this._input = input;
    this._index = -1;
    this._tokenStart = 0;
    this._tokens = [];
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

  _getTokenValue(lookahead, escape) {
    let end = lookahead ? this._index + lookahead : this._index;
    let subValue = this._input.substring(this._tokenStart, end);
    if (escape) {
      return escapeString(subValue);
    }
    return subValue;
  }

  _clearTokenValue() {
    this._tokenStart = this._index;
  }

  tokenize() {
    this._advance();
    while(this._next !== null) {
      if (isWhitespace(this._next)) {
        this._advance(true);
      } else if (isQuote(this._next)) {
        this.tokenizeString();
      } else if (isIdentifierOrKeywordStart(this._next)) {
        this.tokenizeIdentifierOrKeyword();
      } else if (isNumber(this._next)) {
        this.tokenizeNumber();
      } else if (this._next === '.') {
        this.tokenizeDot();
      } else if (this._next === ',') {
        this.tokenizeComma();
      } else if (this._next === ':') {
        this.tokenizeColon();
      } else if (isOperator(this._next)) {
        this.tokenizeOperator();
      } else if (isGrouper(this._next)) {
        this.tokenizeGrouper();
      } else {
        this._advance(true);
        console.assert(this._next == null);
      }
    }
    return this._tokens;
  }

  tokenizeString() {
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
    this._tokens.push(new Token(STRING_TOKEN, this._getTokenValue(0, true)));
    this._clearTokenValue();
    this._advance();
  }

  tokenizeIdentifierOrKeyword() {
    while (this._next !== null && isIdentifier(this._next)) {
      this._advance();
    }
    let value = this._getTokenValue();
    let kind = isKeyword(value) ? KEYWORD_TOKEN : IDENTIFIER_TOKEN;
    this._tokens.push(new Token(kind, value));
    this._clearTokenValue();
  }

  tokenizeNumber() {
    while (this._next !== null && isNumber(this._next)) {
      this._advance();
    }
    if (this._next === '.') {
      this.tokenizeDot();
    } else {
      this._tokens.push(new Token(INTEGER_TOKEN, this._getTokenValue()));
      this._clearTokenValue();
    }
  }

  tokenizeDot() {
    this._advance();
    if (isNumber(this._next)) {
      this.tokenizeFraction();
    } else {
      this._clearTokenValue();
      this._tokens.push(new Token(DOT_TOKEN, '.', POSTFIX_PRECEDENCE));
    }
  }

  tokenizeComma() {
    this._advance(true);
    this._tokens.push(new Token(COMMA_TOKEN, ','));
  }

  tokenizeColon() {
    this._advance(true);
    this._tokens.push(new Token(COLON_TOKEN, ':'));
  }

  tokenizeFraction() {
    while (this._next !== null && isNumber(this._next)) {
      this._advance();
    }
    this._tokens.push(new Token(DECIMAL_TOKEN, this._getTokenValue()));
    this._clearTokenValue();
  }

  tokenizeOperator() {
    let startChar = this._next;
    this._advance();
    let op = this._getTokenValue(2);

    if (_THREE_CHAR_OPS.indexOf(op) !== -1) {
      this._advance();
      this._advance();
    } else {
      op = this._getTokenValue(1);
      if (_TWO_CHAR_OPS.indexOf(op) !== -1) {
        this._advance();
      } else {
        op = this._getTokenValue();
      }
    }
    this._clearTokenValue();
    this._tokens.push(new Token(OPERATOR_TOKEN, op, _PRECEDENCE[op]));
  }

  tokenizeGrouper() {
    let value = this._next;
    this._tokens.push(new Token(GROUPER_TOKEN, value, _PRECEDENCE[value]));
    this._advance(true);
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
