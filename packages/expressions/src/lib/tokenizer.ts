/*
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
 */

import {KEYWORDS, POSTFIX_PRECEDENCE, PRECEDENCE} from './constants.js';

const TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&', '??', '|>'];
const THREE_CHAR_OPS = ['===', '!=='];

export interface Token {
  kind: Kind;
  value: string;
  precedence: number;
}

export enum Kind {
  STRING = 1,
  IDENTIFIER = 2,
  DOT = 3,
  COMMA = 4,
  COLON = 5,
  INTEGER = 6,
  DECIMAL = 7,
  OPERATOR = 8,
  GROUPER = 9,
  KEYWORD = 10,
  ARROW = 11,
}

export const token = (kind: Kind, value: string, precedence: number = 0) => ({
  kind,
  value,
  precedence,
});

const isWhitespace = (ch: number) =>
  ch === 9 /* \t */ ||
  ch === 10 /* \n */ ||
  ch === 13 /* \r */ ||
  ch === 32; /* space */

// TODO(justinfagnani): allow code points > 127
const isIdentOrKeywordStart = (ch: number) =>
  ch === 95 /* _ */ ||
  ch === 36 /* $ */ ||
  // ch &= ~32 puts ch into the range [65,90] [A-Z] only if ch was already in
  // the that range or in the range [97,122] [a-z]. We must mutate ch only after
  // checking other characters, thus the comma operator.
  ((ch &= ~32), 65 /* A */ <= ch && ch <= 90); /* Z */

// TODO(justinfagnani): allow code points > 127
const isIdentifier = (ch: number) => isIdentOrKeywordStart(ch) || isNumber(ch);

const isKeyword = (str: string) => KEYWORDS.indexOf(str) !== -1;

const isQuote = (ch: number) => ch === 34 /* " */ || ch === 39; /* ' */

const isNumber = (ch: number) => 48 /* 0 */ <= ch && ch <= 57; /* 9 */

const isOperator = (ch: number) =>
  ch === 43 /* + */ ||
  ch === 45 /* - */ ||
  ch === 42 /* * */ ||
  ch === 47 /* / */ ||
  ch === 33 /* ! */ ||
  ch === 38 /* & */ ||
  ch === 37 /* % */ ||
  ch === 60 /* < */ ||
  ch === 61 /* = */ ||
  ch === 62 /* > */ ||
  ch === 63 /* ? */ ||
  ch === 94 /* ^ */ ||
  ch === 124; /* | */

const _isGrouper = (ch: number) =>
  ch === 40 /* ( */ ||
  ch === 41 /* ) */ ||
  ch === 91 /* [ */ ||
  ch === 93 /* ] */ ||
  ch === 123 /* { */ ||
  ch === 125; /* } */

const escapeString = (str: string) =>
  str.replace(/\\(.)/g, (_match, group) => {
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

export class Tokenizer {
  #input: string;
  #index = -1;
  #tokenStart = 0;
  #next?: number;

  constructor(input: string) {
    this.#input = input;
    this.#advance();
  }

  nextToken() {
    while (isWhitespace(this.#next!)) {
      this.#advance(true);
    }
    if (isQuote(this.#next!)) return this.#tokenizeString();
    if (isIdentOrKeywordStart(this.#next!)) {
      return this.#tokenizeIdentOrKeyword();
    }
    if (isNumber(this.#next!)) return this.#tokenizeNumber();
    if (this.#next === 46 /* . */) return this.#tokenizeDot();
    if (this.#next === 44 /* , */) return this.#tokenizeComma();
    if (this.#next === 58 /* : */) return this.#tokenizeColon();
    if (isOperator(this.#next!)) return this.#tokenizeOperator();
    if (_isGrouper(this.#next!)) return this.#tokenizeGrouper();
    // no match, should be end of input
    this.#advance();
    if (this.#next !== undefined) {
      throw new Error(`Expected end of input, got ${this.#next}`);
    }
    return undefined;
  }

  #advance(resetTokenStart?: boolean) {
    this.#index++;
    if (this.#index < this.#input.length) {
      this.#next = this.#input.charCodeAt(this.#index);
      if (resetTokenStart === true) {
        this.#tokenStart = this.#index;
      }
    } else {
      this.#next = undefined;
    }
  }

  #getValue(lookahead: number = 0) {
    const v = this.#input.substring(this.#tokenStart, this.#index + lookahead);
    if (lookahead === 0) {
      this.#clearValue();
    }
    return v;
  }

  #clearValue() {
    this.#tokenStart = this.#index;
  }

  #tokenizeString() {
    const _us = 'unterminated string';
    const quoteChar = this.#next;
    this.#advance(true);
    while (this.#next !== quoteChar) {
      if (this.#next === undefined) throw new Error(_us);
      if (this.#next === 92 /* \ */) {
        this.#advance();
        if (this.#next === undefined) throw new Error(_us);
      }
      this.#advance();
    }
    const t = token(Kind.STRING, escapeString(this.#getValue()));
    this.#advance();
    return t;
  }

  #tokenizeIdentOrKeyword() {
    // This do/while loops assumes isIdentifier(this._next!), so it must only
    // be called if isIdentOrKeywordStart(this._next!) has returned true.
    do {
      this.#advance();
    } while (isIdentifier(this.#next!));
    const value = this.#getValue();
    const kind = isKeyword(value) ? Kind.KEYWORD : Kind.IDENTIFIER;
    return token(kind, value);
  }

  #tokenizeNumber() {
    // This do/while loops assumes isNumber(this._next!), so it must only
    // be called if isNumber(this._next!) has returned true.
    do {
      this.#advance();
    } while (isNumber(this.#next!));
    if (this.#next === 46 /* . */) return this.#tokenizeDot();
    return token(Kind.INTEGER, this.#getValue());
  }

  #tokenizeDot() {
    this.#advance();
    if (isNumber(this.#next!)) return this.#tokenizeFraction();
    this.#clearValue();
    return token(Kind.DOT, '.', POSTFIX_PRECEDENCE);
  }

  #tokenizeComma() {
    this.#advance(true);
    return token(Kind.COMMA, ',');
  }

  #tokenizeColon() {
    this.#advance(true);
    return token(Kind.COLON, ':');
  }

  #tokenizeFraction() {
    // This do/while loops assumes isNumber(this._next!), so it must only
    // be called if isNumber(this._next!) has returned true.
    do {
      this.#advance();
    } while (isNumber(this.#next!));
    return token(Kind.DECIMAL, this.#getValue());
  }

  #tokenizeOperator() {
    this.#advance();
    let op = this.#getValue(2);

    if (THREE_CHAR_OPS.indexOf(op) !== -1) {
      this.#advance();
      this.#advance();
    } else {
      op = this.#getValue(1);
      if (op === '=>') {
        this.#advance();
        return token(Kind.ARROW, op);
      }
      if (TWO_CHAR_OPS.indexOf(op) !== -1) {
        this.#advance();
      }
    }
    op = this.#getValue();
    return token(Kind.OPERATOR, op, PRECEDENCE[op]);
  }

  #tokenizeGrouper() {
    const value = String.fromCharCode(this.#next!);
    const t = token(Kind.GROUPER, value, PRECEDENCE[value]);
    this.#advance(true);
    return t;
  }
}
