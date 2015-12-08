'use strict';

define(['exports'], function (exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.token = token;
  exports.parse = parse;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  var _GROUPERS = '()[]{}';
  var _OPERATORS = '+-*/!&%<=>?^|';
  var _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];
  var _THREE_CHAR_OPS = ['===', '!=='];
  var _KEYWORDS = ['this'];
  var _UNARY_OPERATORS = ['+', '-', '!'];
  var _BINARY_OPERATORS = ['+', '-', '*', '/', '%', '^', '==', '!=', '>', '<', '>=', '<=', '||', '&&', '&', '===', '!==', '|'];
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
    '!=': 7,
    '==': 7,
    '!==': 7,
    '===': 7,
    '>=': 8,
    '>': 8,
    '<=': 8,
    '<': 8,
    '+': 9,
    '-': 9,
    '%': 10,
    '/': 10,
    '*': 10,
    '(': 11,
    '[': 11,
    '.': 11,
    '{': 11
  };
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
  var PRECEDENCE = exports.PRECEDENCE = _PRECEDENCE;
  var POSTFIX_PRECEDENCE = exports.POSTFIX_PRECEDENCE = _POSTFIX_PRECEDENCE;
  var STRING = exports.STRING = _STRING;
  var IDENTIFIER = exports.IDENTIFIER = _IDENTIFIER;
  var DOT = exports.DOT = _DOT;
  var COMMA = exports.COMMA = _COMMA;
  var COLON = exports.COLON = _COLON;
  var INTEGER = exports.INTEGER = _INTEGER;
  var DECIMAL = exports.DECIMAL = _DECIMAL;
  var OPERATOR = exports.OPERATOR = _OPERATOR;
  var GROUPER = exports.GROUPER = _GROUPER;
  var KEYWORD = exports.KEYWORD = _KEYWORD;

  function token(kind, value, precedence) {
    return {
      kind: kind,
      value: value,
      precedence: precedence || 0
    };
  }

  var Tokenizer = exports.Tokenizer = (function () {

    function _isWhitespace(next) {
      return (/^\s$/.test(next)
      );
    }

    // TODO(justinfagnani): allow code points > 127
    function _isIdentOrKeywordStart(next) {
      return (/^[a-zA-Z_$]$/.test(next)
      );
    }

    // TODO(justinfagnani): allow code points > 127
    function _isIdentifier(next) {
      return (/^[a-zA-Z0-9_$]$/.test(next)
      );
    }

    function _isKeyword(str) {
      return _KEYWORDS.indexOf(str) !== -1;
    }

    function _isQuote(next) {
      return (/^[\"\']$/.test(next)
      );
    }

    function _isNumber(next) {
      return (/^[0-9]$/.test(next)
      );
    }

    function _isOperator(next) {
      return _OPERATORS.indexOf(next) !== -1;
    }

    function _isGrouper(next) {
      return _GROUPERS.indexOf(next) !== -1;
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

    var Tokenizer = (function () {
      function Tokenizer(input) {
        _classCallCheck(this, Tokenizer);

        this._input = input;
        this._index = -1;
        this._tokenStart = 0;
        this._next = null;
      }

      _createClass(Tokenizer, [{
        key: '_advance',
        value: function _advance(resetTokenStart) {
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
      }, {
        key: '_getValue',
        value: function _getValue(lookahead) {
          var v = this._input.substring(this._tokenStart, this._index + (lookahead || 0));
          if (!lookahead) this._clearValue();
          return v;
        }
      }, {
        key: '_clearValue',
        value: function _clearValue() {
          this._tokenStart = this._index;
        }
      }, {
        key: 'nextToken',
        value: function nextToken() {
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
        }
      }, {
        key: '_tokenizeString',
        value: function _tokenizeString() {
          var _us = "unterminated string";
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
          var t = token(_STRING, _escapeString(this._getValue()));
          this._advance();
          return t;
        }
      }, {
        key: '_tokenizeIdentOrKeyword',
        value: function _tokenizeIdentOrKeyword() {
          while (_isIdentifier(this._next)) {
            this._advance();
          }
          var value = this._getValue();
          var kind = _isKeyword(value) ? _KEYWORD : _IDENTIFIER;
          return token(kind, value);
        }
      }, {
        key: '_tokenizeNumber',
        value: function _tokenizeNumber() {
          while (_isNumber(this._next)) {
            this._advance();
          }
          if (this._next === '.') return this._tokenizeDot();
          return token(_INTEGER, this._getValue());
        }
      }, {
        key: '_tokenizeDot',
        value: function _tokenizeDot() {
          this._advance();
          if (_isNumber(this._next)) return this._tokenizeFraction();
          this._clearValue();
          return token(_DOT, '.', _POSTFIX_PRECEDENCE);
        }
      }, {
        key: '_tokenizeComma',
        value: function _tokenizeComma() {
          this._advance(true);
          return token(_COMMA, ',');
        }
      }, {
        key: '_tokenizeColon',
        value: function _tokenizeColon() {
          this._advance(true);
          return token(_COLON, ':');
        }
      }, {
        key: '_tokenizeFraction',
        value: function _tokenizeFraction() {
          while (_isNumber(this._next)) {
            this._advance();
          }
          return token(_DECIMAL, this._getValue());
        }
      }, {
        key: '_tokenizeOperator',
        value: function _tokenizeOperator() {
          this._advance();
          var op = this._getValue(2);

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
      }, {
        key: '_tokenizeGrouper',
        value: function _tokenizeGrouper() {
          var value = this._next;
          var t = token(_GROUPER, value, _PRECEDENCE[value]);
          this._advance(true);
          return t;
        }
      }]);

      return Tokenizer;
    })();

    return Tokenizer;
  })();

  function parse(expr, astFactory) {
    return new Parser(expr, astFactory).parse();
  }

  var Parser = exports.Parser = (function () {
    function Parser(input, astFactory) {
      _classCallCheck(this, Parser);

      this._tokenizer = new Tokenizer(input);
      this._ast = astFactory;
      this._token = null;
      this._kind = null;
      this._value = null;
    }

    _createClass(Parser, [{
      key: 'parse',
      value: function parse() {
        this._advance();
        return this._parseExpression();
      }
    }, {
      key: '_advance',
      value: function _advance(kind, value) {
        if (!this._matches(kind, value)) {
          throw new Error('Expected kind ' + kind + ' (' + value + '), was ' + this._token);
        }
        var t = this._tokenizer.nextToken();
        this._token = t;
        this._kind = t && t.kind;
        this._value = t && t.value;
      }
    }, {
      key: '_matches',
      value: function _matches(kind, value) {
        return !(kind && this._kind != kind || value && this._value !== value);
      }
    }, {
      key: '_parseExpression',
      value: function _parseExpression() {
        if (!this._token) return this._ast.empty();
        var expr = this._parseUnary();
        return !expr ? null : this._parsePrecedence(expr, 0);
      }

      // _parsePrecedence and _parseBinary implement the precedence climbing
      // algorithm as described in:
      // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method

    }, {
      key: '_parsePrecedence',
      value: function _parsePrecedence(left, precedence) {
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
      }
    }, {
      key: '_makeInvokeOrGetter',
      value: function _makeInvokeOrGetter(left, right) {
        if (right.type === 'ID') {
          return this._ast.getter(left, right.value);
        } else if (right.type === 'Invoke' && right.receiver.type === 'ID') {
          var method = right.receiver;
          return this._ast.invoke(left, method.value, right.arguments);
        } else {
          throw new Error('expected identifier: ' + right);
        }
      }
    }, {
      key: '_parseBinary',
      value: function _parseBinary(left) {
        var op = this._token;
        if (_BINARY_OPERATORS.indexOf(op.value) === -1) {
          throw new Error('unknown operator: ' + op.value);
        }
        this._advance();
        var right = this._parseUnary();
        while ((this._kind == _OPERATOR || this._kind == _DOT || this._kind == _GROUPER) && this._token.precedence > op.precedence) {
          right = this._parsePrecedence(right, this._token.precedence);
        }
        return this._ast.binary(left, op.value, right);
      }
    }, {
      key: '_parseUnary',
      value: function _parseUnary() {
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
          if (_UNARY_OPERATORS.indexOf(value) === -1) throw new Error('unexpected token: ' + value);
          var expr = this._parsePrecedence(this._parsePrimary(), _POSTFIX_PRECEDENCE);
          return this._ast.unary(value, expr);
        }
        return this._parsePrimary();
      }
    }, {
      key: '_parseTernary',
      value: function _parseTernary(condition) {
        this._advance(_OPERATOR, '?');
        var trueExpr = this._parseExpression();
        this._advance(_COLON);
        var falseExpr = this._parseExpression();
        return this._ast.ternary(condition, trueExpr, falseExpr);
      }
    }, {
      key: '_parsePrimary',
      value: function _parsePrimary() {
        switch (this._kind) {
          case _KEYWORD:
            var keyword = this._value;
            if (keyword === 'this') {
              this._advance();
              // TODO(justin): return keyword node
              return this._ast.id(keyword);
            } else if (_KEYWORDS.indexOf(keyword) !== -1) {
              throw new Error('unexpected keyword: ' + keyword);
            }
            throw new Error('unrecognized keyword: ' + keyword);
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
    }, {
      key: '_parseList',
      value: function _parseList() {
        var items = [];
        do {
          this._advance();
          if (this._matches(_GROUPER, ']')) break;
          items.push(this._parseExpression());
        } while (this._matches(_COMMA));
        this._advance(_GROUPER, ']');
        return this._ast.list(items);
      }
    }, {
      key: '_parseMap',
      value: function _parseMap() {
        var entries = {};
        do {
          this._advance();
          if (this._matches(_GROUPER, '}')) break;
          var key = this._value;
          this._advance(_STRING);
          this._advance(_COLON);
          entries[key] = this._parseExpression();
        } while (this._matches(_COMMA));
        this._advance(_GROUPER, '}');
        return this._ast.map(entries);
      }
    }, {
      key: '_parseInvokeOrIdentifier',
      value: function _parseInvokeOrIdentifier() {
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
      }
    }, {
      key: '_parseIdentifier',
      value: function _parseIdentifier() {
        if (!this._matches(_IDENTIFIER)) {
          throw new Error('expected identifier: ' + this._value);
        }
        var value = this._value;
        this._advance();
        return this._ast.id(value);
      }
    }, {
      key: '_parseArguments',
      value: function _parseArguments() {
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
      }
    }, {
      key: '_parseIndex',
      value: function _parseIndex() {
        if (this._matches(_GROUPER, '[')) {
          this._advance();
          var expr = this._parseExpression();
          this._advance(_GROUPER, ']');
          return expr;
        }
        return null;
      }
    }, {
      key: '_parseParen',
      value: function _parseParen() {
        this._advance();
        var expr = this._parseExpression();
        this._advance(_GROUPER, ')');
        return this._ast.paren(expr);
      }
    }, {
      key: '_parseString',
      value: function _parseString() {
        var value = this._ast.literal(this._value);
        this._advance();
        return value;
      }
    }, {
      key: '_parseInteger',
      value: function _parseInteger(prefix) {
        prefix = prefix || '';
        var value = this._ast.literal(parseInt('' + prefix + this._value, 10));
        this._advance();
        return value;
      }
    }, {
      key: '_parseDecimal',
      value: function _parseDecimal(prefix) {
        prefix = prefix || '';
        var value = this._ast.literal(parseFloat('' + prefix + this._value));
        this._advance();
        return value;
      }
    }]);

    return Parser;
  })();
});
'use strict';

define(['exports'], function (exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  var _BINARY_OPERATORS = {
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
  };
  var _UNARY_OPERATORS = {
    '+': function _(a) {
      return a;
    },
    '-': function _(a) {
      return -a;
    },
    '!': function _(a) {
      return !a;
    }
  };

  var EvalAstFactory = exports.EvalAstFactory = (function () {
    function EvalAstFactory() {
      _classCallCheck(this, EvalAstFactory);
    }

    _createClass(EvalAstFactory, [{
      key: 'empty',
      value: function empty() {
        // TODO(justinfagnani): return null instead?
        return {
          evaluate: function evaluate(scope) {
            return scope;
          },
          getIds: function getIds(idents) {
            return idents;
          }
        };
      }

      // TODO(justinfagnani): just use a JS literal?

    }, {
      key: 'literal',
      value: function literal(v) {
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
      }
    }, {
      key: 'id',
      value: function id(v) {
        return {
          type: 'ID',
          value: v,
          evaluate: function evaluate(scope) {
            // TODO(justinfagnani): this prevernts access to properties named 'this'
            if (this.value === 'this') return scope;
            return scope[this.value];
          },
          getIds: function getIds(idents) {
            idents.push(this.value);
            return idents;
          }
        };
      }
    }, {
      key: 'unary',
      value: function unary(op, expr) {
        var f = _UNARY_OPERATORS[op];
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
      }
    }, {
      key: 'binary',
      value: function binary(l, op, r) {
        var f = _BINARY_OPERATORS[op];
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
      }
    }, {
      key: 'getter',
      value: function getter(g, n) {
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
      }
    }, {
      key: 'invoke',
      value: function invoke(receiver, method, args) {
        if (method != null && typeof method !== 'string') {
          throw new Error('method not a string');
        }
        return {
          type: 'Invoke',
          receiver: receiver,
          method: method,
          arguments: args,
          evaluate: function evaluate(scope) {
            var receiver = this.receiver.evaluate(scope);
            var _this = this.method ? receiver : scope['this'] || scope;
            var f = this.method ? receiver[method] : receiver;
            var argValues = this.arguments.map(function (a) {
              return a.evaluate(scope);
            });
            return f.apply(receiver, argValues);
          },
          getIds: function getIds(idents) {
            this.receiver.getIds(idents);
            this.arguments.forEach(function (a) {
              return a.getIds(idents);
            });
            return idents;
          }
        };
      }
    }, {
      key: 'parenthesized',
      value: function parenthesized(e) {
        return e;
      }
    }, {
      key: 'index',
      value: function index(e, a) {
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
      }
    }, {
      key: 'ternary',
      value: function ternary(c, t, f) {
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
      }
    }, {
      key: 'map',
      value: function map(entries) {
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
      }

      // TODO(justinfagnani): if the list is deeply literal

    }, {
      key: 'list',
      value: function list(l) {
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
      }
    }]);

    return EvalAstFactory;
  })();
});