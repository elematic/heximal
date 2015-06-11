define(['exports', 'polymer-expressions/tokenizer'], function (exports, _polymerExpressionsTokenizer) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  exports.parse = parse;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var Tokenizer = _polymerExpressionsTokenizer.Tokenizer;
  var Token = _polymerExpressionsTokenizer.Token;
  var STRING_TOKEN = _polymerExpressionsTokenizer.STRING_TOKEN;
  var IDENTIFIER_TOKEN = _polymerExpressionsTokenizer.IDENTIFIER_TOKEN;
  var DOT_TOKEN = _polymerExpressionsTokenizer.DOT_TOKEN;
  var COMMA_TOKEN = _polymerExpressionsTokenizer.COMMA_TOKEN;
  var COLON_TOKEN = _polymerExpressionsTokenizer.COLON_TOKEN;
  var INTEGER_TOKEN = _polymerExpressionsTokenizer.INTEGER_TOKEN;
  var DECIMAL_TOKEN = _polymerExpressionsTokenizer.DECIMAL_TOKEN;
  var OPERATOR_TOKEN = _polymerExpressionsTokenizer.OPERATOR_TOKEN;
  var GROUPER_TOKEN = _polymerExpressionsTokenizer.GROUPER_TOKEN;
  var KEYWORD_TOKEN = _polymerExpressionsTokenizer.KEYWORD_TOKEN;
  var POSTFIX_PRECEDENCE = _polymerExpressionsTokenizer.POSTFIX_PRECEDENCE;
  var PRECEDENCE = _polymerExpressionsTokenizer.PRECEDENCE;

  var _UNARY_OPERATORS = ['+', '-', '!'];
  var _BINARY_OPERATORS = ['+', '-', '*', '/', '%', '^', '==', '!=', '>', '<', '>=', '<=', '||', '&&', '&', '===', '!==', '|'];

  function parse(expr) {
    return new Parser(expr).parse();
  }

  var AstFactory = (function () {
    function AstFactory() {
      _classCallCheck(this, AstFactory);
    }

    _createClass(AstFactory, [{
      key: 'empty',
      value: function empty() {
        // TODO(justinfagnani): return null instead?
        return {};
      }
    }, {
      key: 'literal',

      // TODO(justinfagnani): just use a JS literal?
      value: function literal(v) {
        return {
          type: 'Literal',
          value: v
        };
      }
    }, {
      key: 'identifier',
      value: function identifier(v) {
        return {
          type: 'Identifier',
          value: v
        };
      }
    }, {
      key: 'unary',
      value: function unary(op, expr) {
        return {
          type: 'Unary',
          operator: op,
          child: expr
        };
      }
    }, {
      key: 'binary',
      value: function binary(l, op, r) {
        return {
          type: 'Binary',
          operator: op,
          left: l,
          right: r
        };
      }
    }, {
      key: 'getter',
      value: function getter(g, n) {
        return {
          type: 'Getter',
          receiver: g,
          name: n
        };
      }
    }, {
      key: 'invoke',
      value: function invoke(receiver, method, args) {
        if (args == null) {
          throw new Error('args');
        }
        return {
          type: 'Invoke',
          receiver: receiver,
          method: method,
          arguments: args
        };
      }
    }, {
      key: 'parenthesized',
      value: function parenthesized(e) {
        return {
          type: 'Parenthesized',
          child: e
        };
      }
    }, {
      key: 'index',
      value: function index(e, a) {
        return {
          type: 'Index',
          receiver: e,
          argument: a
        };
      }
    }, {
      key: 'ternary',
      value: function ternary(c, t, f) {
        return {
          type: 'Ternary',
          condition: c,
          trueExpr: t,
          falseExpr: f
        };
      }
    }, {
      key: 'mapLiteral',
      value: function mapLiteral(entries) {
        return {
          type: 'MapLiteral',
          entries: entries
        };
      }
    }, {
      key: 'mapLiteralEntry',

      // TODO(justinfagnani): replace with a 2-element Array?
      value: function mapLiteralEntry(key, value) {
        return {
          type: 'MapLiteralEntry',
          key: key,
          value: value
        };
      }
    }, {
      key: 'listLiteral',
      value: function listLiteral(l) {
        return {
          type: 'ListLiteral',
          items: l
        };
      }
    }]);

    return AstFactory;
  })();

  exports.AstFactory = AstFactory;

  var ArrayIterator = (function () {
    function ArrayIterator(arr) {
      _classCallCheck(this, ArrayIterator);

      this._arr = arr;
      this._index = -1;
      this._length = arr.length;
    }

    _createClass(ArrayIterator, [{
      key: 'moveNext',
      value: function moveNext() {
        if (this._index < this._length) this._index++;
        return this._index < this._length;
      }
    }, {
      key: 'current',
      get: function () {
        return this._index === -1 || this._index === this._length ? null : this._arr[this._index];
      }
    }]);

    return ArrayIterator;
  })();

  var Parser = (function () {
    // final AstFactory _astFactory;
    // final Tokenizer _tokenizer;
    // List<Token> _tokens;
    // Iterator _iterator;

    function Parser(input, astFactory) {
      _classCallCheck(this, Parser);

      this._tokenizer = new Tokenizer(input);
      this._astFactory = astFactory == null ? new AstFactory() : astFactory;
    }

    _createClass(Parser, [{
      key: 'parse',
      value: function parse() {
        this._tokens = this._tokenizer.tokenize();
        this._iterator = new ArrayIterator(this._tokens);
        this._advance();
        return this._parseExpression();
      }
    }, {
      key: '_advance',
      value: function _advance(kind, value) {
        if (kind != null && (this._token == null || this._token.kind !== kind) || value != null && (this._token == null || this._token.value !== value)) {
          throw new ParseException('Expected kind $kind ($value): $this._token');
        }
        this._iterator.moveNext();
        // this._token = this._iterator.current;
      }
    }, {
      key: '_parseExpression',
      value: function _parseExpression() {
        // console.log('_parseExpression', this._token);
        if (this._token == null) return this._astFactory.empty();
        var expr = this._parseUnary();
        // console.log('unary = ', expr);
        return expr == null ? null : this._parsePrecedence(expr, 0);
      }
    }, {
      key: '_parsePrecedence',

      // _parsePrecedence and _parseBinary implement the precedence climbing
      // algorithm as described in:
      // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
      value: function _parsePrecedence(left, precedence) {
        // console.log('_parsePrecedence', left, precedence);
        // console.log('  token', this._token);
        console.assert(left != null);
        while (this._token != null) {
          if (this._token.kind == GROUPER_TOKEN) {
            if (this._token.value == '(') {
              var args = this._parseArguments();
              console.assert(args != null);
              left = this._astFactory.invoke(left, null, args);
            } else if (this._token.value == '[') {
              var indexExpr = this._parseIndex();
              left = this._astFactory.index(left, indexExpr);
            } else {
              break;
            }
          } else if (this._token.kind == DOT_TOKEN) {
            this._advance();
            var right = this._parseUnary();
            left = this._makeInvokeOrGetter(left, right);
          } else if (this._token.kind == KEYWORD_TOKEN) {
            if (this._token.value == 'in') {
              left = this._parseInExpression(left);
            } else if (this._token.value == 'as') {
              left = this._parseAsExpression(left);
            } else {
              break;
            }
          } else if (this._token.kind == OPERATOR_TOKEN && this._token.precedence >= precedence) {
            left = this._token.value == '?' ? this._parseTernary(left) : this._parseBinary(left);
          } else {
            break;
          }
        }
        return left;
      }
    }, {
      key: '_makeInvokeOrGetter',

      // invoke or getter
      value: function _makeInvokeOrGetter(left, right) {
        if (right.type === 'Identifier') {
          return this._astFactory.getter(left, right.value);
        } else if (right.type === 'Invoke' && right.receiver.type === 'Identifier') {
          var method = right.receiver;
          return this._astFactory.invoke(left, method.value, right.arguments);
        } else {
          throw new ParseException('expected identifier: $right');
        }
      }
    }, {
      key: '_parseBinary',
      value: function _parseBinary(left) {
        var op = this._token;
        if (_BINARY_OPERATORS.indexOf(op.value) === -1) {
          throw new ParseException('unknown operator: ${op.value}');
        }
        this._advance();
        var right = this._parseUnary();
        while (this._token != null && (this._token.kind == OPERATOR_TOKEN || this._token.kind == DOT_TOKEN || this._token.kind == GROUPER_TOKEN) && this._token.precedence > op.precedence) {
          right = this._parsePrecedence(right, this._token.precedence);
        }
        return this._astFactory.binary(left, op.value, right);
      }
    }, {
      key: '_parseUnary',
      value: function _parseUnary() {
        // console.log('_parseUnary', this._token);
        if (this._token.kind === OPERATOR_TOKEN) {
          var value = this._token.value;
          if (value === '+' || value === '-') {
            this._advance();
            if (this._token.kind === INTEGER_TOKEN) {
              return this._parseInteger(value);
            } else if (this._token.kind === DECIMAL_TOKEN) {
              return this._parseDecimal(value);
            } else {
              var expr = this._parsePrecedence(this._parsePrimary(), POSTFIX_PRECEDENCE);
              return this._astFactory.unary(value, expr);
            }
          } else if (value === '!') {
            this._advance();
            var expr = this._parsePrecedence(this._parsePrimary(), POSTFIX_PRECEDENCE);
            return this._astFactory.unary(value, expr);
          } else {
            throw new ParseException('unexpected token: $value');
          }
        }
        return this._parsePrimary();
      }
    }, {
      key: '_parseTernary',
      value: function _parseTernary(condition) {
        this._advance(OPERATOR_TOKEN, '?');
        var trueExpr = this._parseExpression();
        this._advance(COLON_TOKEN);
        var falseExpr = this._parseExpression();
        return this._astFactory.ternary(condition, trueExpr, falseExpr);
      }
    }, {
      key: '_parsePrimary',
      value: function _parsePrimary() {
        // console.log('_parsePrimary', this._token);
        var kind = this._token.kind;
        switch (kind) {
          case KEYWORD_TOKEN:
            var keyword = this._token.value;
            if (keyword === 'this') {
              this._advance();
              // TODO(justin): return keyword node
              return this._astFactory.identifier('this');
            } else if (KEYWORDS.indexOf(keyword) !== -1) {
              throw new ParseException('unexpected keyword: $keyword');
            }
            throw new ParseException('unrecognized keyword: $keyword');
          case IDENTIFIER_TOKEN:
            return this._parseInvokeOrIdentifier();
          case STRING_TOKEN:
            return this._parseString();
          case INTEGER_TOKEN:
            return this._parseInteger();
          case DECIMAL_TOKEN:
            return this._parseDecimal();
          case GROUPER_TOKEN:
            if (this._token.value == '(') {
              return this._parseParenthesized();
            } else if (this._token.value == '{') {
              return this._parseMapLiteral();
            } else if (this._token.value == '[') {
              return this._parseListLiteral();
            }
            return null;
          case COLON_TOKEN:
            throw new ParseException('unexpected token ":"');
          default:
            return null;
        }
      }
    }, {
      key: '_parseListLiteral',
      value: function _parseListLiteral() {
        var items = [];
        do {
          this._advance();
          if (this._token.kind == GROUPER_TOKEN && this._token.value == ']') {
            break;
          }
          items.push(this._parseExpression());
        } while (this._token != null && this._token.value == ',');
        this._advance(GROUPER_TOKEN, ']');
        return this._astFactory.listLiteral(items);
      }
    }, {
      key: '_parseMapLiteral',
      value: function _parseMapLiteral() {
        var entries = [];
        do {
          this._advance();
          if (this._token.kind == GROUPER_TOKEN && this._token.value == '}') {
            break;
          }
          entries.push(this._parseMapLiteralEntry());
        } while (this._token != null && this._token.value == ',');
        this._advance(GROUPER_TOKEN, '}');
        return this._astFactory.mapLiteral(entries);
      }
    }, {
      key: '_parseMapLiteralEntry',
      value: function _parseMapLiteralEntry() {
        var key = this._parseString();
        this._advance(COLON_TOKEN, ':');
        var value = this._parseExpression();
        return this._astFactory.mapLiteralEntry(key, value);
      }
    }, {
      key: '_parseInvokeOrIdentifier',

      // _parseInExpression(left) {
      //   console.assert(this._token.value == 'in');
      //   if (!(left instanceof Identifier)) {
      //     throw new ParseException(
      //         "in... statements must start with an identifier");
      //   }
      //   this._advance();
      //   let right = this._parseExpression();
      //   return this._astFactory.inExpr(left, right);
      // }
      //
      // _parseAsExpression(left) {
      //   console.assert(this._token.value == 'as');
      //   this._advance();
      //   let right = _parseExpression();
      //   if (!(right instanceof Identifier)) {
      //     throw new ParseException(
      //         "'as' statements must end with an identifier");
      //   }
      //   return _astFactory.asExpr(left, right);
      // }

      value: function _parseInvokeOrIdentifier() {
        // console.log('_parseInvokeOrIdentifier');
        if (this._token.value === 'true') {
          this._advance();
          return this._astFactory.literal(true);
        }
        if (this._token.value === 'false') {
          this._advance();
          return this._astFactory.literal(false);
        }
        if (this._token.value == 'null') {
          this._advance();
          return this._astFactory.literal(null);
        }
        var identifier = this._parseIdentifier();
        var args = this._parseArguments();
        if (args == null) {
          return identifier;
        } else {
          return this._astFactory.invoke(identifier, null, args);
        }
      }
    }, {
      key: '_parseIdentifier',
      value: function _parseIdentifier() {
        // console.log('_parseIdentifier');
        if (this._token.kind !== IDENTIFIER_TOKEN) {
          throw new ParseException('expected identifier: $_token.value');
        }
        var value = this._token.value;
        this._advance();
        return this._astFactory.identifier(value);
      }
    }, {
      key: '_parseArguments',
      value: function _parseArguments() {
        if (this._token != null && this._token.kind == GROUPER_TOKEN && this._token.value == '(') {
          var args = [];
          do {
            this._advance();
            if (this._token.kind == GROUPER_TOKEN && this._token.value == ')') {
              break;
            }
            var expr = this._parseExpression();
            args.push(expr);
          } while (this._token != null && this._token.value == ',');
          this._advance(GROUPER_TOKEN, ')');
          return args;
        }
        return null;
      }
    }, {
      key: '_parseIndex',
      value: function _parseIndex() {
        if (this._token != null && this._token.kind == GROUPER_TOKEN && this._token.value == '[') {
          this._advance();
          var expr = this._parseExpression();
          this._advance(GROUPER_TOKEN, ']');
          return expr;
        }
        return null;
      }
    }, {
      key: '_parseParenthesized',
      value: function _parseParenthesized() {
        this._advance();
        var expr = this._parseExpression();
        this._advance(GROUPER_TOKEN, ')');
        return this._astFactory.parenthesized(expr);
      }
    }, {
      key: '_parseString',
      value: function _parseString() {
        var value = this._astFactory.literal(this._token.value);
        this._advance();
        return value;
      }
    }, {
      key: '_parseInteger',
      value: function _parseInteger(prefix) {
        prefix = prefix || '';
        var value = this._astFactory.literal(parseInt('' + prefix + '' + this._token.value, 10));
        this._advance();
        return value;
      }
    }, {
      key: '_parseDecimal',
      value: function _parseDecimal(prefix) {
        prefix = prefix || '';
        var value = this._astFactory.literal(parseFloat('' + prefix + '' + this._token.value));
        this._advance();
        return value;
      }
    }, {
      key: '_token',
      get: function () {
        return this._iterator.current;
      }
    }]);

    return Parser;
  })();

  exports.Parser = Parser;
});
// var tokenizer = require('./tokenizer');

// module.exports = {
//   Parser: Parser,
//   AstFactory: AstFactory,
// };