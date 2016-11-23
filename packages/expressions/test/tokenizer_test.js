'use strict';

const assert = require('assert');
const tokenizer = require('../lib/tokenizer');
const constants = require('../lib/constants');

var Tokenizer = tokenizer.Tokenizer;
var STRING = constants.Kind.STRING;
var IDENTIFIER = constants.Kind.IDENTIFIER;
var DOT = constants.Kind.DOT;
var COMMA = constants.Kind.COMMA;
var COLON = constants.Kind.COLON;
var INTEGER = constants.Kind.INTEGER;
var DECIMAL = constants.Kind.DECIMAL;
var OPERATOR = constants.Kind.OPERATOR;
var GROUPER = constants.Kind.GROUPER;
var KEYWORD = constants.Kind.KEYWORD;
var POSTFIX_PRECEDENCE = constants.POSTFIX_PRECEDENCE;
var PRECEDENCE = constants.PRECEDENCE;

function tokenize(s) {
  let tokenizer = new Tokenizer(s);
  let tokens = [];
  let token;
  while ((token = tokenizer.nextToken()) != null) {
    tokens.push(token);
  }
  return tokens;
}

function expectTokens(s, expected) {
  var tokens = tokenize(s);
  assert.deepEqual(tokens, expected);
}

function t(kind, value, precedence) {
  return tokenizer.token(kind, value, precedence);
}

suite('tokenizer', function() {

  test('should tokenize an empty expression', function() {
    expectTokens('', []);
  });

  test('should tokenize an identifier', function() {
    expectTokens('abc', [t(IDENTIFIER, 'abc')]);
  });

  test('should tokenize two identifiers', function() {
    expectTokens('abc def', [t(IDENTIFIER, 'abc'), t(IDENTIFIER, 'def')]);
  });

  test('should tokenize a double quoted String', function() {
    expectTokens('"abc"', [t(STRING, 'abc')]);
  });

  test('should tokenize a single quoted String', function() {
    expectTokens('\'abc\'', [t(STRING, 'abc')]);
  });

  test('should tokenize a String with escaping', function() {
    expectTokens('"a\\c\\\\d\\\'\\""', [t(STRING, 'ac\\d\'"')]);
  });

  test('should tokenize a dot operator', function() {
    expectTokens('a.b', [
      t(IDENTIFIER, 'a'),
      t(DOT, '.', POSTFIX_PRECEDENCE),
      t(IDENTIFIER, 'b')
    ]);
    expectTokens('ab.cd', [
      t(IDENTIFIER, 'ab'),
      t(DOT, '.', POSTFIX_PRECEDENCE),
      t(IDENTIFIER, 'cd')
    ]);
    expectTokens('ab.cd()', [
      t(IDENTIFIER, 'ab'),
      t(DOT, '.', POSTFIX_PRECEDENCE),
      t(IDENTIFIER, 'cd'),
      t(GROUPER, '(', PRECEDENCE['(']),
      t(GROUPER, ')', PRECEDENCE[')'])
    ]);
    expectTokens('ab.cd(e)', [
      t(IDENTIFIER, 'ab'),
      t(DOT, '.', POSTFIX_PRECEDENCE),
      t(IDENTIFIER, 'cd'),
      t(GROUPER, '(', PRECEDENCE['(']),
      t(IDENTIFIER, 'e'),
      t(GROUPER, ')', PRECEDENCE[')'])
    ]);
  });

  test('should tokenize a unary plus operator', function() {
    expectTokens('+a', [t(OPERATOR, '+', PRECEDENCE['+']), t(IDENTIFIER, 'a')]);
  });

  test('should tokenize a one-character operator', function() {
    expectTokens('a + b', [
      t(IDENTIFIER, 'a'),
      t(OPERATOR, '+', PRECEDENCE['+']),
      t(IDENTIFIER, 'b')
    ]);
  });

  test('should tokenize a two-character operator', function() {
    expectTokens('a && b', [
      t(IDENTIFIER, 'a'),
      t(OPERATOR, '&&', PRECEDENCE['&&']),
      t(IDENTIFIER, 'b')
    ]);
  });

  test('should tokenize a three-character operator', function() {
    expectTokens('a !== b', [
      t(IDENTIFIER, 'a'),
      t(OPERATOR, '!==', PRECEDENCE['!==']),
      t(IDENTIFIER, 'b')
    ]);
  });


  test('should tokenize a ternary operator', function() {
    expectTokens('a ? b : c', [
      t(IDENTIFIER, 'a'),
      t(OPERATOR, '?', PRECEDENCE['?']),
      t(IDENTIFIER, 'b'),
      t(COLON, ':', PRECEDENCE[':']),
      t(IDENTIFIER, 'c')
    ]);
  });

  test('should tokenize keywords', function() {
    expectTokens('this', [t(KEYWORD, 'this')]);
  });

  test('should tokenize groups', function() {
    expectTokens('a(b)[]{}', [
      t(IDENTIFIER, 'a'),
      t(GROUPER, '(', PRECEDENCE['(']),
      t(IDENTIFIER, 'b'),
      t(GROUPER, ')', PRECEDENCE[')']),
      t(GROUPER, '[', PRECEDENCE['[']),
      t(GROUPER, ']', PRECEDENCE[']']),
      t(GROUPER, '{', PRECEDENCE['{']),
      t(GROUPER, '}', PRECEDENCE['}'])
    ]);
  });

  test('should tokenize argument lists', function() {
    expectTokens('(a, b)', [
      t(GROUPER, '(', PRECEDENCE['(']),
      t(IDENTIFIER, 'a'),
      t(COMMA, ',', PRECEDENCE[',']),
      t(IDENTIFIER, 'b'),
      t(GROUPER, ')', PRECEDENCE[')'])
    ]);
  });

  test('should tokenize maps', function() {
    expectTokens(`{'a': b}`, [
      t(GROUPER, '{', PRECEDENCE['{']),
      t(STRING, 'a'),
      t(COLON, ':', PRECEDENCE[':']),
      t(IDENTIFIER, 'b'),
      t(GROUPER, '}', PRECEDENCE['}'])
    ]);
  });

  test('should tokenize lists', function() {
    expectTokens(`[1, 'a', b]`, [
      t(GROUPER, '[', PRECEDENCE['[']),
      t(INTEGER, '1'),
      t(COMMA, ',', PRECEDENCE[',']),
      t(STRING, 'a'),
      t(COMMA, ',', PRECEDENCE[',']),
      t(IDENTIFIER, 'b'),
      t(GROUPER, ']', PRECEDENCE[']'])
    ]);
  });

  test('should tokenize integers', function() {
    expectTokens('123', [t(INTEGER, '123')]);
    expectTokens(
        '+123', [t(OPERATOR, '+', PRECEDENCE['+']), t(INTEGER, '123')]);
    expectTokens(
        '-123', [t(OPERATOR, '-', PRECEDENCE['-']), t(INTEGER, '123')]);
  });

  test('should tokenize decimals', function() {
    expectTokens('1.23', [t(DECIMAL, '1.23')]);
    expectTokens(
        '+1.23', [t(OPERATOR, '+', PRECEDENCE['+']), t(DECIMAL, '1.23')]);
    expectTokens(
        '-1.23', [t(OPERATOR, '-', PRECEDENCE['-']), t(DECIMAL, '1.23')]);
  });

  test('should tokenize booleans as identifiers', function() {
    expectTokens('true', [t(IDENTIFIER, 'true')]);
    expectTokens('false', [t(IDENTIFIER, 'false')]);
  });

  test('should tokenize name.substring(2)', function() {
    expectTokens('name.substring(2)', [
      t(IDENTIFIER, 'name'),
      t(DOT, '.', POSTFIX_PRECEDENCE),
      t(IDENTIFIER, 'substring'),
      t(GROUPER, '(', PRECEDENCE['(']),
      t(INTEGER, '2'),
      t(GROUPER, ')', PRECEDENCE[')']),
    ]);
  });
});
