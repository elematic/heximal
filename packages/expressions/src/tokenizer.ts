import {Kind, POSTFIX_PRECEDENCE, PRECEDENCE} from './constants';

const _KEYWORDS = ['this'];
const _GROUPERS = '()[]{}';
const _OPERATORS = '+-*/!&%<=>?^|';
const _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];
const _THREE_CHAR_OPS = ['===', '!=='];

export interface Token {
  kind: Kind;
  value: string;
  precedence: number;
}

export function token(kind: Kind, value: string, precedence?: number) {
  return {
    kind: kind,
    value: value,
    precedence: precedence || 0,
  };
}

function _isWhitespace(next: string) {
  return /^\s$/.test(next);
}

// TODO(justinfagnani): allow code points > 127
function _isIdentOrKeywordStart(next: string) {
  return /^[a-zA-Z_$]$/.test(next);
}

// TODO(justinfagnani): allow code points > 127
function _isIdentifier(next: string) {
  return /^[a-zA-Z0-9_$]$/.test(next);
}

function _isKeyword(str: string) {
  return _KEYWORDS.indexOf(str) !== -1;
}

function _isQuote(next: string) {
  return /^[\"\']$/.test(next);
}

function _isNumber(next: string) {
  return /^[0-9]$/.test(next);
}

function _isOperator(next: string) {
  return _OPERATORS.indexOf(next) !== -1;
}

function _isGrouper(next: string) {
  return _GROUPERS.indexOf(next) !== -1;
}

function _escapeString(str: string) {
  return str.replace(/\\(.)/g, function(_match, group) {
    switch (group) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      case 'b':
        return '\b';
      case 'f':
        return '\f';
      default:
        return group;
    }
  });
}

export class Tokenizer {
  private _input: string;
  private _index = -1;
  private _tokenStart = 0;
  private _next: string|null = null;
  constructor(input: string) {
    this._input = input;
  }

  nextToken() {
    if (this._index === -1)
      this._advance();
    while (_isWhitespace(this._next!)) {
      this._advance(true);
    }
    if (_isQuote(this._next!))
      return this._tokenizeString();
    if (_isIdentOrKeywordStart(this._next!))
      return this._tokenizeIdentOrKeyword();
    if (_isNumber(this._next!))
      return this._tokenizeNumber();
    if (this._next === '.')
      return this._tokenizeDot();
    if (this._next === ',')
      return this._tokenizeComma();
    if (this._next === ':')
      return this._tokenizeColon();
    if (_isOperator(this._next!))
      return this._tokenizeOperator();
    if (_isGrouper(this._next!))
      return this._tokenizeGrouper();
    // no match, should be end of input
    this._advance();
    if (this._next) {
      throw new Error(`Expected end of input, got ${this._next}`);
    }
    return null;
  }

  private _advance(resetTokenStart?: boolean) {
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

  private _getValue(lookahead?: number) {
    const v =
        this._input.substring(this._tokenStart, this._index + (lookahead || 0));
    if (!lookahead)
      this._clearValue();
    return v;
  }

  private _clearValue() {
    this._tokenStart = this._index;
  }

  private _tokenizeString() {
    const _us = 'unterminated string';
    const quoteChar = this._next;
    this._advance(true);
    while (this._next !== quoteChar) {
      if (!this._next)
        throw new Error(_us);
      if (this._next === '\\') {
        this._advance();
        if (!this._next)
          throw new Error(_us);
      }
      this._advance();
    }
    const t = token(Kind.STRING, _escapeString(this._getValue()));
    this._advance();
    return t;
  }

  private _tokenizeIdentOrKeyword() {
    while (_isIdentifier(this._next!)) {
      this._advance();
    }
    const value = this._getValue();
    const kind = _isKeyword(value) ? Kind.KEYWORD : Kind.IDENTIFIER;
    return token(kind, value);
  }

  private _tokenizeNumber() {
    while (_isNumber(this._next!)) {
      this._advance();
    }
    if (this._next === '.')
      return this._tokenizeDot();
    return token(Kind.INTEGER, this._getValue());
  }

  private _tokenizeDot() {
    this._advance();
    if (_isNumber(this._next!))
      return this._tokenizeFraction();
    this._clearValue();
    return token(Kind.DOT, '.', POSTFIX_PRECEDENCE);
  }

  private _tokenizeComma() {
    this._advance(true);
    return token(Kind.COMMA, ',');
  }

  private _tokenizeColon() {
    this._advance(true);
    return token(Kind.COLON, ':');
  }

  private _tokenizeFraction() {
    while (_isNumber(this._next!)) {
      this._advance();
    }
    return token(Kind.DECIMAL, this._getValue());
  }

  private _tokenizeOperator() {
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
    return token(Kind.OPERATOR, op, PRECEDENCE[op]);
  }

  private _tokenizeGrouper() {
    const value = this._next;
    const t = token(Kind.GROUPER, value!, PRECEDENCE[value!]);
    this._advance(true);
    return t;
  }
}
