define(['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _TAB = 9;
  var _LF = 10;
  var _VTAB = 11;
  var _FF = 12;
  var _CR = 13;
  var _SPACE = 32;
  var _BANG = 33;
  var _DQ = 34;
  var _$ = 36;
  var _PERCENT = 37;
  var _AMPERSAND = 38;
  var _SQ = 39;
  var _OPEN_PAREN = 40;
  var _CLOSE_PAREN = 41;
  var _STAR = 42;
  var _PLUS = 43;
  var _COMMA = 44;
  var _MINUS = 45;
  var _PERIOD = 46;
  var _SLASH = 47;
  var _0 = 48;
  var _9 = 57;
  var _COLON = 58;
  var _LT = 60;
  var _EQ = 61;
  var _GT = 62;
  var _QUESTION = 63;
  var _A = 65;
  var _Z = 90;
  var _OPEN_SQUARE_BRACKET = 91;
  var _BACKSLASH = 92;
  var _CLOSE_SQUARE_BRACKET = 93;
  var _CARET = 94;
  var _US = 95;
  var _a = 97;
  var _f = 102;
  var _n = 110;
  var _r = 114;
  var _t = 116;
  var _v = 118;
  var _z = 122;
  var _OPEN_CURLY_BRACKET = 123;
  var _BAR = 124;
  var _CLOSE_CURLY_BRACKET = 125;
  var _NBSP = 160;

  var _OPERATORS = [_PLUS, _MINUS, _STAR, _SLASH, _BANG, _AMPERSAND, _PERCENT, _LT, _EQ, _GT, _QUESTION, _CARET, _BAR];

  var _GROUPERS = [_OPEN_PAREN, _CLOSE_PAREN, _OPEN_SQUARE_BRACKET, _CLOSE_SQUARE_BRACKET, _OPEN_CURLY_BRACKET, _CLOSE_CURLY_BRACKET];

  var _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];

  var KEYWORDS = ['this'];

  var _PRECEDENCE = {
    '!': 0,
    ':': 0,
    ',': 0,
    ')': 0,
    ']': 0,
    '}': 0, // ?
    '?': 1,
    '||': 2,
    '&&': 3,
    '|': 4,
    '^': 5,
    '&': 6,

    // equality
    '!=': 7,
    '==': 7,
    '!==': 7,
    '===': 7,

    // relational
    '>=': 8,
    '>': 8,
    '<=': 8,
    '<': 8,

    // additive
    '+': 9,
    '-': 9,

    // multiplicative
    '%': 10,
    '/': 10,
    '*': 10,

    // postfix
    '(': 11,
    '[': 11,
    '.': 11,
    '{': 11 };

  var POSTFIX_PRECEDENCE = 11;

  exports.POSTFIX_PRECEDENCE = POSTFIX_PRECEDENCE;
  var STRING_TOKEN = 1;
  exports.STRING_TOKEN = STRING_TOKEN;
  var IDENTIFIER_TOKEN = 2;
  exports.IDENTIFIER_TOKEN = IDENTIFIER_TOKEN;
  var DOT_TOKEN = 3;
  exports.DOT_TOKEN = DOT_TOKEN;
  var COMMA_TOKEN = 4;
  exports.COMMA_TOKEN = COMMA_TOKEN;
  var COLON_TOKEN = 5;
  exports.COLON_TOKEN = COLON_TOKEN;
  var INTEGER_TOKEN = 6;
  exports.INTEGER_TOKEN = INTEGER_TOKEN;
  var DECIMAL_TOKEN = 7;
  exports.DECIMAL_TOKEN = DECIMAL_TOKEN;
  var OPERATOR_TOKEN = 8;
  exports.OPERATOR_TOKEN = OPERATOR_TOKEN;
  var GROUPER_TOKEN = 9;
  exports.GROUPER_TOKEN = GROUPER_TOKEN;
  var KEYWORD_TOKEN = 10;

  exports.KEYWORD_TOKEN = KEYWORD_TOKEN;
  function isWhitespace(next) {
    return next === _SPACE || next === _TAB || next === _NBSP;
  }

  function isIdentifierOrKeywordStart(next) {
    return _a <= next && next <= _z || _A <= next && next <= _Z || next === _US || next === _$ || next > 127;
  }

  function isIdentifier(next) {
    return _a <= next && next <= _z || _A <= next && next <= _Z || _0 <= next && next <= _9 || next === _US || next === _$ || next > 127;
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
      case _f:
        return _FF;
      case _n:
        return _LF;
      case _r:
        return _CR;
      case _t:
        return _TAB;
      case _v:
        return _VTAB;
      default:
        return c;
    }
  }

  // TODO(justinfagnani): remove StringBuffer and RuneIterator. Tnstead track
  // current token start index and end index and use String.substring to pull out
  // individual token values. This will eliminate much string->char code->String
  // conversion and reduce garbage.

  var StringBuffer = (function () {
    function StringBuffer() {
      _classCallCheck(this, StringBuffer);

      this.buffer = [];
    }

    _createClass(StringBuffer, [{
      key: 'clear',
      value: function clear() {
        this.buffer = [];
      }
    }, {
      key: 'append',
      value: function append(s) {
        this.buffer.push(s);
      }
    }, {
      key: 'writeCharCode',
      value: function writeCharCode(c) {
        this.buffer.push(String.fromCharCode(c));
      }
    }, {
      key: 'toString',
      value: function toString() {
        return this.buffer.join('');
      }
    }]);

    return StringBuffer;
  })();

  var RuneIterator = (function () {
    function RuneIterator(str) {
      _classCallCheck(this, RuneIterator);

      this._str = str;
      this._index = -1;
      this._length = str.length;
    }

    _createClass(RuneIterator, [{
      key: 'moveNext',
      value: function moveNext() {
        if (this._index < this._length) this._index++;
        // console.log('moveNext', this.current);
        return this._index < this._length;
      }
    }, {
      key: 'current',
      get: function () {
        return this._index === -1 || this._index === this._length ? null : this._str.charCodeAt(this._index);
      }
    }]);

    return RuneIterator;
  })();

  // TODO(justinfagnani): Pre-initialize and reuse the most common tokens: dot,
  // comma, colon, etc.

  var Token = (function () {
    function Token(kind, value, precedence) {
      _classCallCheck(this, Token);

      this.kind = kind;
      this.value = value;
      this.precedence = precedence || 0;
    }

    _createClass(Token, [{
      key: 'toString',
      value: function toString() {
        return '(' + kind + ', \'' + value + '\')';
      }
    }]);

    return Token;
  })();

  exports.Token = Token;

  var Tokenizer = (function () {
    function Tokenizer(input) {
      _classCallCheck(this, Tokenizer);

      this._tokens = [];
      this._sb = new StringBuffer();
      this._iterator = new RuneIterator(input);
      this._next = null;
    }

    _createClass(Tokenizer, [{
      key: '_advance',
      value: function _advance() {
        this._next = this._iterator.moveNext() ? this._iterator.current : null;
      }
    }, {
      key: 'tokenize',
      value: function tokenize() {
        this._advance();
        while (this._next !== null) {
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
    }, {
      key: 'tokenizeString',
      value: function tokenizeString() {
        var quoteChar = this._next;
        this._advance();
        while (this._next !== quoteChar) {
          if (this._next === null) throw new ParseException('unterminated string');
          if (this._next === _BACKSLASH) {
            this._advance();
            if (this._next === null) throw new ParseException('unterminated string');
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
    }, {
      key: 'tokenizeIdentifierOrKeyword',
      value: function tokenizeIdentifierOrKeyword() {
        while (this._next !== null && isIdentifier(this._next)) {
          this._sb.writeCharCode(this._next);
          this._advance();
        }
        var value = this._sb.toString();
        if (KEYWORDS.indexOf(value) !== -1) {
          this._tokens.push(new Token(KEYWORD_TOKEN, value));
        } else {
          this._tokens.push(new Token(IDENTIFIER_TOKEN, value));
        }
        this._sb.clear();
      }
    }, {
      key: 'tokenizeNumber',
      value: function tokenizeNumber() {
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
    }, {
      key: 'tokenizeDot',
      value: function tokenizeDot() {
        this._advance();
        if (isNumber(this._next)) {
          this.tokenizeFraction();
        } else {
          this._tokens.push(new Token(DOT_TOKEN, '.', POSTFIX_PRECEDENCE));
        }
      }
    }, {
      key: 'tokenizeComma',
      value: function tokenizeComma() {
        this._advance();
        this._tokens.push(new Token(COMMA_TOKEN, ','));
      }
    }, {
      key: 'tokenizeColon',
      value: function tokenizeColon() {
        this._advance();
        this._tokens.push(new Token(COLON_TOKEN, ':'));
      }
    }, {
      key: 'tokenizeFraction',
      value: function tokenizeFraction() {
        this._sb.writeCharCode(_PERIOD);
        while (this._next !== null && isNumber(this._next)) {
          this._sb.writeCharCode(this._next);
          this._advance();
        }
        this._tokens.push(new Token(DECIMAL_TOKEN, this._sb.toString()));
        this._sb.clear();
      }
    }, {
      key: 'tokenizeOperator',
      value: function tokenizeOperator() {
        var startChar = this._next;
        this._advance();
        var op = undefined;
        // check for 2 character operators
        if (isOperator(this._next)) {
          var op2 = String.fromCharCode(startChar, this._next);
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
    }, {
      key: 'tokenizeGrouper',
      value: function tokenizeGrouper() {
        var value = String.fromCharCode(this._next);
        this._tokens.push(new Token(GROUPER_TOKEN, value, _PRECEDENCE[value]));
        this._advance();
      }
    }]);

    return Tokenizer;
  })();

  exports.Tokenizer = Tokenizer;

  var ParseException = (function () {
    // String message;

    function ParseException(message) {
      _classCallCheck(this, ParseException);

      this.message = message;
    }

    _createClass(ParseException, [{
      key: 'toString',
      value: function toString() {
        return 'ParseException: ' + this.message;
      }
    }]);

    return ParseException;
  })();
});
//not sure this is correct
/* implements Exception */

// module.exports = {
//   Tokenizer: Tokenizer,
//   Token: Token,
//   STRING_TOKEN: STRING_TOKEN,
//   IDENTIFIER_TOKEN: IDENTIFIER_TOKEN,
//   DOT_TOKEN: DOT_TOKEN,
//   COMMA_TOKEN: COMMA_TOKEN,
//   COLON_TOKEN: COLON_TOKEN,
//   INTEGER_TOKEN: INTEGER_TOKEN,
//   DECIMAL_TOKEN: DECIMAL_TOKEN,
//   OPERATOR_TOKEN: OPERATOR_TOKEN,
//   GROUPER_TOKEN: GROUPER_TOKEN,
//   KEYWORD_TOKEN: KEYWORD_TOKEN,
//   POSTFIX_PRECEDENCE: POSTFIX_PRECEDENCE,
//   PRECEDENCE: _PRECEDENCE,
// };