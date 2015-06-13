define('polymer-expressions/parser', ['exports'], function (exports) {
  'use strict';

  exports.__esModule = true;
  exports.token = token;
  exports.parse = parse;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _GROUPERS = '()[]{}';
  var _OPERATORS = '+-*/!&%<=>?^|';

  var _KEYWORDS = ['this'];
  exports.PRECEDENCE = _PRECEDENCE;

  var _PRECEDENCE = {
    '!': 0,
    ':': 0,
    ',': 0,
    ')': 0,
    ']': 0,
    '}': 0,
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

  exports.POSTFIX_PRECEDENCE = 11;
  exports.STRING = 1;
  exports.IDENTIFIER = 2;
  exports.DOT = 3;
  exports.COMMA = 4;
  exports.COLON = 5;
  exports.INTEGER = 6;
  exports.DECIMAL = 7;
  exports.OPERATOR = 8;
  exports.GROUPER = 9;
  exports.KEYWORD = 10;

  var _POSTFIX_PRECEDENCE = 11;
  var _STRING = 1;
  var _IDENTIFIER = 2;
  var _DOT = 3;
  var _COMMA = 4;
  var _COLON = 5;
  var _INTEGER = 6;
  var _DECIMAL = 7;
  var _OPERATOR = 8;
  var _GROUPER = 9;
  var _KEYWORD = 10;

  function token(kind, value, precedence) {
    return {
      kind: kind,
      value: value,
      precedence: precedence || 0
    };
  }

  var Tokenizer = (function () {

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
      return '+-*/!&%<=>?^|'.indexOf(next) !== -1;
    }

    function _isGrouper(next) {
      return '()[]{}'.indexOf(next) !== -1;
    }

    function _escapeString(str) {
      return str.replace(/\\(.)/g, function (match, group) {
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

    return (function () {
      function Tokenizer(input) {
        _classCallCheck(this, Tokenizer);

        this._input = input;
        this._index = -1;
        this._tokenStart = 0;
        this._next = null;
      }

      Tokenizer.prototype._advance = function _advance(resetTokenStart) {
        if (this._index < this._input.length) {
          this._index++;
          this._next = this._input[this._index];
          if (resetTokenStart) {
            this._tokenStart = this._index;
          }
        } else {
          this._next = null;
        }
      };

      Tokenizer.prototype._getValue = function _getValue(lookahead) {
        var v = this._input.substring(this._tokenStart, this._index + (lookahead || 0));
        if (!lookahead) this._clearValue();
        return v;
      };

      Tokenizer.prototype._clearValue = function _clearValue() {
        this._tokenStart = this._index;
      };

      Tokenizer.prototype.nextToken = function nextToken() {
        if (this._index === -1) this._advance();
        while (_isWhitespace(this._next)) {
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
      };

      Tokenizer.prototype._tokenizeString = function _tokenizeString() {
        var _us = 'unterminated string';
        var quoteChar = this._next;
        this._advance(true);
        while (this._next !== quoteChar) {
          if (!this._next) throw new Error(_us);
          if (this._next === '\\') {
            this._advance();
            if (!this._next) throw new Error(_us);
          }
          this._advance();
        }
        var t = token(1, _escapeString(this._getValue()));
        this._advance();
        return t;
      };

      Tokenizer.prototype._tokenizeIdentOrKeyword = function _tokenizeIdentOrKeyword() {
        while (_isIdentifier(this._next)) {
          this._advance();
        }
        var value = this._getValue();
        var kind = _isKeyword(value) ? 10 : 2;
        return token(kind, value);
      };

      Tokenizer.prototype._tokenizeNumber = function _tokenizeNumber() {
        while (_isNumber(this._next)) {
          this._advance();
        }
        if (this._next === '.') return this._tokenizeDot();
        return token(6, this._getValue());
      };

      Tokenizer.prototype._tokenizeDot = function _tokenizeDot() {
        this._advance();
        if (_isNumber(this._next)) return this._tokenizeFraction();
        this._clearValue();
        return token(3, '.', 11);
      };

      Tokenizer.prototype._tokenizeComma = function _tokenizeComma() {
        this._advance(true);
        return token(4, ',');
      };

      Tokenizer.prototype._tokenizeColon = function _tokenizeColon() {
        this._advance(true);
        return token(5, ':');
      };

      Tokenizer.prototype._tokenizeFraction = function _tokenizeFraction() {
        while (_isNumber(this._next)) {
          this._advance();
        }
        return token(7, this._getValue());
      };

      Tokenizer.prototype._tokenizeOperator = function _tokenizeOperator() {
        this._advance();
        var op = this._getValue(2);

        if (['===', '!=='].indexOf(op) !== -1) {
          this._advance();
          this._advance();
        } else {
          op = this._getValue(1);
          if (['==', '!=', '<=', '>=', '||', '&&'].indexOf(op) !== -1) {
            this._advance();
          }
        }
        op = this._getValue();
        return token(8, op, _PRECEDENCE[op]);
      };

      Tokenizer.prototype._tokenizeGrouper = function _tokenizeGrouper() {
        var value = this._next;
        var t = token(9, value, _PRECEDENCE[value]);
        this._advance(true);
        return t;
      };

      return Tokenizer;
    })();
  })();

  exports.Tokenizer = Tokenizer;

  function parse(expr, astFactory) {
    return new Parser(expr, astFactory).parse();
  }

  var Parser = (function () {
    function Parser(input, astFactory) {
      _classCallCheck(this, Parser);

      this._tokenizer = new Tokenizer(input);
      this._ast = astFactory;
      this._token = null;
      this._kind = null;
      this._value = null;
    }

    Parser.prototype.parse = function parse() {
      this._advance();
      return this._parseExpression();
    };

    Parser.prototype._advance = function _advance(kind, value) {
      if (!this._matches(kind, value)) {
        throw new Error('Expected kind ' + kind + ' (' + value + '), was ' + this._token);
      }
      var t = this._tokenizer.nextToken();
      this._token = t;
      this._kind = t && t.kind;
      this._value = t && t.value;
    };

    Parser.prototype._matches = function _matches(kind, value) {
      return !(kind && this._kind != kind || value && this._value !== value);
    };

    Parser.prototype._parseExpression = function _parseExpression() {
      if (!this._token) return this._ast.empty();
      var expr = this._parseUnary();
      return !expr ? null : this._parsePrecedence(expr, 0);
    };

    // _parsePrecedence and _parseBinary implement the precedence climbing
    // algorithm as described in:
    // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method

    Parser.prototype._parsePrecedence = function _parsePrecedence(left, precedence) {
      console.assert(left);
      while (this._token) {
        if (this._matches(_GROUPER, '(')) {
          var args = this._parseArguments();
          left = this._ast.invoke(left, null, args);
        } else if (this._matches(_GROUPER, '[')) {
          var indexExpr = this._parseIndex();
          left = this._ast.index(left, indexExpr);
        } else if (this._matches(_DOT)) {
          this._advance();
          var right = this._parseUnary();
          left = this._makeInvokeOrGetter(left, right);
        } else if (this._matches(_KEYWORD)) {
          break;
        } else if (this._matches(_OPERATOR) && this._token.precedence >= precedence) {
          left = this._value == '?' ? this._parseTernary(left) : this._parseBinary(left);
        } else {
          break;
        }
      }
      return left;
    };

    Parser.prototype._makeInvokeOrGetter = function _makeInvokeOrGetter(left, right) {
      if (right.type === 'ID') {
        return this._ast.getter(left, right.value);
      } else if (right.type === 'Invoke' && right.receiver.type === 'ID') {
        var method = right.receiver;
        return this._ast.invoke(left, method.value, right.arguments);
      } else {
        throw new Error('expected identifier: ' + right);
      }
    };

    Parser.prototype._parseBinary = function _parseBinary(left) {
      var op = this._token;
      if (['+', '-', '*', '/', '%', '^', '==', '!=', '>', '<', '>=', '<=', '||', '&&', '&', '===', '!==', '|'].indexOf(op.value) === -1) {
        throw new Error('unknown operator: ' + op.value);
      }
      this._advance();
      var right = this._parseUnary();
      while ((this._kind == 8 || this._kind == 3 || this._kind == 9) && this._token.precedence > op.precedence) {
        right = this._parsePrecedence(right, this._token.precedence);
      }
      return this._ast.binary(left, op.value, right);
    };

    Parser.prototype._parseUnary = function _parseUnary() {
      if (this._matches(_OPERATOR)) {
        var value = this._value;
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
        if (['+', '-', '!'].indexOf(value) === -1) throw new Error('unexpected token: ' + value);
        var expr = this._parsePrecedence(this._parsePrimary(), _POSTFIX_PRECEDENCE);
        return this._ast.unary(value, expr);
      }
      return this._parsePrimary();
    };

    Parser.prototype._parseTernary = function _parseTernary(condition) {
      this._advance(8, '?');
      var trueExpr = this._parseExpression();
      this._advance(5);
      var falseExpr = this._parseExpression();
      return this._ast.ternary(condition, trueExpr, falseExpr);
    };

    Parser.prototype._parsePrimary = function _parsePrimary() {
      switch (this._kind) {
        case 10:
          var keyword = this._value;
          if (keyword === 'this') {
            this._advance();
            // TODO(justin): return keyword node
            return this._ast.id(keyword);
          } else if (_KEYWORDS.indexOf(keyword) !== -1) {
            throw new Error('unexpected keyword: ' + keyword);
          }
          throw new Error('unrecognized keyword: ' + keyword);
        case 2:
          return this._parseInvokeOrIdentifier();
        case 1:
          return this._parseString();
        case 6:
          return this._parseInteger();
        case 7:
          return this._parseDecimal();
        case 9:
          if (this._value == '(') {
            return this._parseParen();
          } else if (this._value == '{') {
            return this._parseMap();
          } else if (this._value == '[') {
            return this._parseList();
          }
          return null;
        case 5:
          throw new Error('unexpected token ":"');
        default:
          return null;
      }
    };

    Parser.prototype._parseList = function _parseList() {
      var items = [];
      do {
        this._advance();
        if (this._matches(_GROUPER, ']')) break;
        items.push(this._parseExpression());
      } while (this._matches(4));
      this._advance(9, ']');
      return this._ast.list(items);
    };

    Parser.prototype._parseMap = function _parseMap() {
      var entries = {};
      do {
        this._advance();
        if (this._matches(_GROUPER, '}')) break;
        var key = this._value;
        this._advance(1);
        this._advance(5);
        entries[key] = this._parseExpression();
      } while (this._matches(4));
      this._advance(9, '}');
      return this._ast.map(entries);
    };

    Parser.prototype._parseInvokeOrIdentifier = function _parseInvokeOrIdentifier() {
      var value = this._value;
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
      var identifier = this._parseIdentifier();
      var args = this._parseArguments();
      return !args ? identifier : this._ast.invoke(identifier, null, args);
    };

    Parser.prototype._parseIdentifier = function _parseIdentifier() {
      if (!this._matches(_IDENTIFIER)) {
        throw new Error('expected identifier: ' + this._value);
      }
      var value = this._value;
      this._advance();
      return this._ast.id(value);
    };

    Parser.prototype._parseArguments = function _parseArguments() {
      if (this._matches(_GROUPER, '(')) {
        var args = [];
        do {
          this._advance();
          if (this._matches(_GROUPER, ')')) {
            break;
          }
          var expr = this._parseExpression();
          args.push(expr);
        } while (this._matches(_COMMA));
        this._advance(_GROUPER, ')');
        return args;
      }
      return null;
    };

    Parser.prototype._parseIndex = function _parseIndex() {
      if (this._matches(_GROUPER, '[')) {
        this._advance();
        var expr = this._parseExpression();
        this._advance(_GROUPER, ']');
        return expr;
      }
      return null;
    };

    Parser.prototype._parseParen = function _parseParen() {
      this._advance();
      var expr = this._parseExpression();
      this._advance(9, ')');
      return this._ast.paren(expr);
    };

    Parser.prototype._parseString = function _parseString() {
      var value = this._ast.literal(this._value);
      this._advance();
      return value;
    };

    Parser.prototype._parseInteger = function _parseInteger(prefix) {
      prefix = prefix || '';
      var value = this._ast.literal(parseInt('' + prefix + '' + this._value, 10));
      this._advance();
      return value;
    };

    Parser.prototype._parseDecimal = function _parseDecimal(prefix) {
      prefix = prefix || '';
      var value = this._ast.literal(parseFloat('' + prefix + '' + this._value));
      this._advance();
      return value;
    };

    return Parser;
  })();

  exports.Parser = Parser;
});
//not sure this is correct
define('polymer-expressions/eval', ['exports'], function (exports) {
  'use strict';

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var EvalAstFactory = (function () {
    function EvalAstFactory() {
      _classCallCheck(this, EvalAstFactory);
    }

    EvalAstFactory.prototype.empty = function empty() {
      // TODO(justinfagnani): return null instead?
      return {
        evaluate: function evaluate(scope) {
          return scope;
        },
        getIds: function getIds(idents) {
          return idents;
        }
      };
    };

    // TODO(justinfagnani): just use a JS literal?

    EvalAstFactory.prototype.literal = function literal(v) {
      return {
        type: 'Literal',
        value: v,
        evaluate: function evaluate(scope) {
          return this.value;
        },
        getIds: function getIds(idents) {
          return idents;
        }
      };
    };

    EvalAstFactory.prototype.id = function id(v) {
      return {
        type: 'ID',
        value: v,
        evaluate: function evaluate(scope) {
          if (this.value === 'this') return scope;
          return scope[this.value];
        },
        getIds: function getIds(idents) {
          idents.push(this.value);
          return idents;
        }
      };
    };

    EvalAstFactory.prototype.unary = function unary(op, expr) {
      var f = ({
        '+': function _(a) {
          return a;
        },
        '-': function _(a) {
          return -a;
        },
        '!': function _(a) {
          return !a;
        }
      })[op];
      return {
        type: 'Unary',
        operator: op,
        child: expr,
        evaluate: function evaluate(scope) {
          return f(this.child.evaluate(scope));
        },
        getIds: function getIds(idents) {
          return this.child.getIds(idents);
        }
      };
    };

    EvalAstFactory.prototype.binary = function binary(l, op, r) {
      var f = ({
        '+': function _(a, b) {
          return a + b;
        },
        '-': function _(a, b) {
          return a - b;
        },
        '*': function _(a, b) {
          return a * b;
        },
        '/': function _(a, b) {
          return a / b;
        },
        '%': function _(a, b) {
          return a % b;
        },
        '==': function _(a, b) {
          return a == b;
        },
        '!=': function _(a, b) {
          return a != b;
        },
        '===': function _(a, b) {
          return a === b;
        },
        '!==': function _(a, b) {
          return a !== b;
        },
        '>': function _(a, b) {
          return a > b;
        },
        '>=': function _(a, b) {
          return a >= b;
        },
        '<': function _(a, b) {
          return a < b;
        },
        '<=': function _(a, b) {
          return a <= b;
        },
        '||': function _(a, b) {
          return a || b;
        },
        '&&': function _(a, b) {
          return a && b;
        },
        '|': function _(a, f) {
          return f(a);
        }
      })[op];
      return {
        type: 'Binary',
        operator: op,
        left: l,
        right: r,
        evaluate: function evaluate(scope) {
          return f(this.left.evaluate(scope), this.right.evaluate(scope));
        },
        getIds: function getIds(idents) {
          this.left.getIds(idents);
          this.right.getIds(idents);
          return idents;
        }
      };
    };

    EvalAstFactory.prototype.getter = function getter(g, n) {
      return {
        type: 'Getter',
        receiver: g,
        name: n,
        evaluate: function evaluate(scope) {
          return this.receiver.evaluate(scope)[this.name];
        },
        getIds: function getIds(idents) {
          this.receiver.getIds(idents);
          return idents;
        }
      };
    };

    EvalAstFactory.prototype.invoke = function invoke(receiver, method, args) {
      return {
        type: 'Invoke',
        receiver: receiver,
        method: method,
        arguments: args,
        evaluate: function evaluate(scope) {
          var o = this.receiver.evaluate(scope);
          var argValues = this.arguments.map(function (a) {
            return a.evaluate(scope);
          });
          var f = this.method == null ? o : o[this.method];
          return f.apply(o, argValues);
        },
        getIds: function getIds(idents) {
          this.receiver.getIds(idents);
          this.arguments.forEach(function (a) {
            return a.getIds(idents);
          });
          return idents;
        }
      };
    };

    EvalAstFactory.prototype.parenthesized = function parenthesized(e) {
      return e;
    };

    EvalAstFactory.prototype.index = function index(e, a) {
      return {
        type: 'Index',
        receiver: e,
        argument: a,
        evaluate: function evaluate(scope) {
          return this.receiver.evaluate(scope)[this.argument.evaluate(scope)];
        },
        getIds: function getIds(idents) {
          this.receiver.getIds(idents);
          return idents;
        }
      };
    };

    EvalAstFactory.prototype.ternary = function ternary(c, t, f) {
      return {
        type: 'Ternary',
        condition: c,
        trueExpr: t,
        falseExpr: f,
        evaluate: function evaluate(scope) {
          var c = this.condition.evaluate(scope);
          if (c) {
            return this.trueExpr.evaluate(scope);
          } else {
            return this.falseExpr.evaluate(scope);
          }
        },
        getIds: function getIds(idents) {
          this.condition.getIds(idents);
          this.trueExpr.getIds(idents);
          this.falseExpr.getIds(idents);
          return idents;
        }
      };
    };

    EvalAstFactory.prototype.map = function map(entries) {
      return {
        type: 'Map',
        entries: entries,
        evaluate: function evaluate(scope) {
          var map = {};
          for (var key in entries) {
            map[key] = this.entries[key].evaluate(scope);
          }
          return map;
        },
        getIds: function getIds(idents) {
          for (var key in entries) {
            this.entries[key].getIds(idents);
          }
          return idents;
        }
      };
    };

    // TODO(justinfagnani): if the list is deeply literal

    EvalAstFactory.prototype.list = function list(l) {
      return {
        type: 'List',
        items: l,
        evaluate: function evaluate(scope) {
          return this.items.map(function (a) {
            return a.evaluate(scope);
          });
        },
        getIds: function getIds(idents) {
          this.items.forEach(function (i) {
            i.getIds(idents);
          });
          return idents;
        }
      };
    };

    return EvalAstFactory;
  })();

  exports.EvalAstFactory = EvalAstFactory;
});
