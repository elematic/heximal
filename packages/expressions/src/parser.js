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

export function parse(expr, astFactory) {
  return new Parser(expr, astFactory).parse();
}

export class Parser {

  constructor(input, astFactory) {
    this._tokenizer = new Tokenizer(input);
    this._ast = astFactory;
    this._token = null;
  }

  parse() {
    this._advance();
    return this._parseExpression();
  }

  _advance(kind, value) {
    if ((kind && (this._token == null || this._token.kind !== kind))
        || (value != null && (this._token == null || this._token.value !== value))) {
      throw new ParseException("Expected kind $kind ($value): $this._token");
    }
    this._token = this._tokenizer.nextToken();
  }

  _parseExpression() {
    if (this._token == null) return this._ast.empty();
    let expr = this._parseUnary();
    return (expr == null) ? null : this._parsePrecedence(expr, 0);
  }

  // _parsePrecedence and _parseBinary implement the precedence climbing
  // algorithm as described in:
  // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
  _parsePrecedence(left, precedence) {
    console.assert(left != null);
    while (this._token != null) {
      if (this._token.kind == GROUPER) {
        if (this._token.value == '(') {
          let args = this._parseArguments();
          console.assert(args != null);
          left = this._ast.invoke(left, null, args);
        } else if (this._token.value == '[') {
          let indexExpr = this._parseIndex();
          left = this._ast.index(left, indexExpr);
        } else {
          break;
        }
      } else if (this._token.kind == DOT) {
        this._advance();
        let right = this._parseUnary();
        left = this._makeInvokeOrGetter(left, right);
      } else if (this._token.kind == KEYWORD) {
        break;
      } else if (this._token.kind == OPERATOR
          && this._token.precedence >= precedence) {
        left = this._token.value == '?' ? this._parseTernary(left) : this._parseBinary(left);
      } else {
        break;
      }
    }
    return left;
  }

  _makeInvokeOrGetter(left, right) {
    if (right.type === 'Identifier') {
      return this._ast.getter(left, right.value);
    } else if (right.type === 'Invoke' && right.receiver.type === 'Identifier') {
      let method = right.receiver;
      return this._ast.invoke(left, method.value, right.arguments);
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
        && (this._token.kind == OPERATOR
        || this._token.kind == DOT
        || this._token.kind == GROUPER)
        && this._token.precedence > op.precedence) {
      right = this._parsePrecedence(right, this._token.precedence);
    }
    return this._ast.binary(left, op.value, right);
  }

  _parseUnary() {
    if (this._token.kind === OPERATOR) {
      let value = this._token.value;
      this._advance();
      // handle unary + and - on numbers as part of the literal, not as a
      // unary operator
      if (value === '+' || value === '-') {
        if (this._token.kind === INTEGER) {
          return this._parseInteger(value);
        } else if (this._token.kind === DECIMAL) {
          return this._parseDecimal(value);
        }
      }
      // if (value !== '!') throw new ParseException("unexpected token: $value");
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
    let kind = this._token.kind;
    switch (kind) {
      case KEYWORD:
        var keyword = this._token.value;
        if (keyword === 'this') {
          this._advance();
          // TODO(justin): return keyword node
          return this._ast.identifier('this');
        } else if (KEYWORDS.indexOf(keyword) !== -1) {
          throw new ParseException('unexpected keyword: $keyword');
        }
        throw new ParseException('unrecognized keyword: $keyword');
      case IDENTIFIER:
        return this._parseInvokeOrIdentifier();
      case STRING:
        return this._parseString();
      case INTEGER:
        return this._parseInteger();
      case DECIMAL:
        return this._parseDecimal();
      case GROUPER:
        if (this._token.value == '(') {
          return this._parseParen();
        } else if (this._token.value == '{') {
          return this._parseMap();
        } else if (this._token.value == '[') {
          return this._parseList();
        }
        return null;
      case COLON:
        throw new ParseException('unexpected token ":"');
      default:
        return null;
    }
  }

  _parseList() {
    let items = [];
    do {
      this._advance();
      if (this._token.kind == GROUPER && this._token.value == ']') {
        break;
      }
      items.push(this._parseExpression());
    } while(this._token != null && this._token.value == ',');
    this._advance(GROUPER, ']');
    return this._ast.listLiteral(items);
  }

  _parseMap() {
    let entries = [];
    do {
      this._advance();
      if (this._token.kind == GROUPER && this._token.value == '}') {
        break;
      }
      entries.push(this._parseMapEntry());
    } while(this._token != null && this._token.value == ',');
    this._advance(GROUPER, '}');
    return this._ast.mapLiteral(entries);
  }

  _parseMapEntry() {
    let key = this._parseString();
    this._advance(COLON, ':');
    let value = this._parseExpression();
    return this._ast.mapLiteralEntry(key, value);
  }

  _parseInvokeOrIdentifier() {
    if (this._token.value === 'true') {
      this._advance();
      return this._ast.literal(true);
    }
    if (this._token.value === 'false') {
      this._advance();
      return this._ast.literal(false);
    }
    if (this._token.value == 'null') {
      this._advance();
      return this._ast.literal(null);
    }
    let identifier = this._parseIdentifier();
    let args = this._parseArguments();
    if (args == null) {
      return identifier;
    } else {
      return this._ast.invoke(identifier, null, args);
    }
  }

  _parseIdentifier() {
    if (this._token.kind !== IDENTIFIER) {
      throw new ParseException(`expected identifier: ${_token.value}`);
    }
    let value = this._token.value;
    this._advance();
    return this._ast.identifier(value);
  }

  _parseArguments() {
    if (this._token != null && this._token.kind == GROUPER && this._token.value == '(') {
      let args = [];
      do {
        this._advance();
        if (this._token.kind == GROUPER && this._token.value == ')') {
          break;
        }
        let expr = this._parseExpression();
        args.push(expr);
      } while(this._token != null && this._token.value == ',');
      this._advance(GROUPER, ')');
      return args;
    }
    return null;
  }

  _parseIndex() {
    if (this._token != null && this._token.kind == GROUPER && this._token.value == '[') {
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
    return this._ast.parenthesized(expr);
  }

  _parseString() {
    let value = this._ast.literal(this._token.value);
    this._advance();
    return value;
  }

  _parseInteger(prefix) {
    prefix = prefix || '';
    let value = this._ast.literal(parseInt(`${prefix}${this._token.value}`, 10));
    this._advance();
    return value;
  }

  _parseDecimal(prefix) {
    prefix = prefix || '';
    let value = this._ast.literal(parseFloat(`${prefix}${this._token.value}`));
    this._advance();
    return value;
  }

}
