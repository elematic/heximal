'use strict';

let assert = require('assert');
let tokenizer = require('../src/tokenizer');
let parser = require('../src/parser');
let ast_factory = require('../src/ast_factory');

let Parser = parser.Parser;
let astFactory = new ast_factory.AstFactory();

function expectParse(s, e) {
  let p = new Parser(s, astFactory).parse();
  // console.log('expected', e);
  // console.log('actual', p);
  assert.deepEqual(p, e);
}

suite('Parser', function() {

  test('can be constructed', function() {
    new Parser('');
  });

  test('should parse an empty expression', function() {
    expectParse('', astFactory.empty());
  });

  test('should parse an identifier', function() {
    expectParse('abc', astFactory.identifier('abc'));
  });

  test('should parse a string literal', function() {
    expectParse('"abc"', astFactory.literal('abc'));
  });

  test('should parse a bool literal', function() {
    expectParse('true', astFactory.literal(true));
    expectParse('false', astFactory.literal(false));
  });

  test('should parse a null literal', function() {
    expectParse('null', astFactory.literal(null));
  });

  test('should parse an integer literal', function() {
    expectParse('123', astFactory.literal(123));
  });

  test('should parse a double literal', function() {
    expectParse('1.23', astFactory.literal(1.23));
  });

  test('should parse a positive double literal', function() {
    expectParse('+1.23', astFactory.literal(1.23));
  });

  test('should parse a negative double literal', function() {
    expectParse('-1.23', astFactory.literal(-1.23));
  });

  test('should parse unary operators', function() {
    expectParse(`!a`, astFactory.unary('!', astFactory.identifier('a')));
    expectParse(`-a`, astFactory.unary('-', astFactory.identifier('a')));
  });

  test('should parse binary operators', function() {
    let operators = ['+', '-', '*', '/', '%', '^', '==', '!=', '>', '<',
        '>=', '<=', '||', '&&', '&', '===', '!==', '|'];
    for (let i in operators) {
      let op = operators[i];
      expectParse(`a ${op} b`, astFactory.binary(
          astFactory.identifier('a'), op, astFactory.identifier('b')));
      expectParse(`1 ${op} 2`,
          astFactory.binary(astFactory.literal(1), op, astFactory.literal(2)));
      expectParse(`this ${op} null`,
          astFactory.binary(astFactory.identifier('this'), op, astFactory.literal(null)));
    }
  });

  // test('should thrown on unknown operators', () {
  //   expect(() => parse('a ?? b'), throwsParseException);
  //   expect(() => parse('a &&& b'), throwsParseException);
  //   expect(() => parse('a ==== b'), throwsParseException);
  // });

  test('should give multiply higher associativity than plus', function() {
    expectParse('a + b * c',
        astFactory.binary(astFactory.identifier('a'),
        '+',
        astFactory.binary(
            astFactory.identifier('b'),
            '*',
            astFactory.identifier('c'))));
    expectParse('a * b + c',
        astFactory.binary(
            astFactory.binary(
                astFactory.identifier('a'),
                '*',
                astFactory.identifier('b')),
            '+',
            astFactory.identifier('c')));
  });

  test('should parse a dot operator', function() {
    expectParse('a.b', astFactory.getter(astFactory.identifier('a'), 'b'));
  });

  test('should parse chained dot operators', function() {
    expectParse('a.b.c', astFactory.getter(astFactory.getter(astFactory.identifier('a'), 'b'), 'c'));
  });

  test('should give dot high associativity', function() {
    expectParse('a * b.c', astFactory.binary(astFactory.identifier('a'), '*', astFactory.getter(astFactory.identifier('b'), 'c')));
  });

  test('should parse a function with no arguments', function() {
    expectParse('a()', astFactory.invoke(astFactory.identifier('a'), null, []));
  });

  test('should parse a single function argument', function() {
    expectParse('a(b)', astFactory.invoke(astFactory.identifier('a'), null, [astFactory.identifier('b')]));
  });

  test('should parse a function call as a subexpression', function() {
    expectParse('a() + 1',
        astFactory.binary(
            astFactory.invoke(astFactory.identifier('a'), null, []),
            '+',
            astFactory.literal(1)));
  });

  test('should parse multiple function arguments', function() {
    expectParse('a(b, c)',
        astFactory.invoke(astFactory.identifier('a'), null,
            [astFactory.identifier('b'), astFactory.identifier('c')]));
  });

  test('should parse nested function calls', function() {
    expectParse('a(b(c))', astFactory.invoke(astFactory.identifier('a'), null, [
        astFactory.invoke(astFactory.identifier('b'), null, [astFactory.identifier('c')])]));
  });

  test('should parse an empty method call', function() {
    expectParse('a.b()', astFactory.invoke(astFactory.identifier('a'), 'b', []));
  });

  test('should parse a method call with a single argument', function() {
    expectParse('a.b(c)', astFactory.invoke(astFactory.identifier('a'), 'b', [astFactory.identifier('c')]));
  });

  test('should parse a method call with multiple arguments', function() {
    expectParse('a.b(c, d)',
        astFactory.invoke(astFactory.identifier('a'), 'b', [astFactory.identifier('c'), astFactory.identifier('d')]));
  });

  test('should parse chained method calls', function() {
    expectParse('a.b().c()', astFactory.invoke(astFactory.invoke(astFactory.identifier('a'), 'b', []), 'c', []));
  });

  test('should parse chained function calls', function() {
    expectParse('a()()', astFactory.invoke(astFactory.invoke(astFactory.identifier('a'), null, []), null, []));
  });

  test('should parse parenthesized expression', function() {
    expectParse('(a)', astFactory.parenthesized(astFactory.identifier('a')));
    expectParse('(( 3 * ((1 + 2)) ))', astFactory.parenthesized(astFactory.parenthesized(
        astFactory.binary(astFactory.literal(3), '*', astFactory.parenthesized(astFactory.parenthesized(
            astFactory.binary(astFactory.literal(1), '+', astFactory.literal(2))))))));
  });

  test('should parse an index operator', function() {
    expectParse('a[b]', astFactory.index(astFactory.identifier('a'), astFactory.identifier('b')));
    expectParse('a.b[c]', astFactory.index(astFactory.getter(astFactory.identifier('a'), 'b'), astFactory.identifier('c')));
  });

  test('should parse chained index operators', function() {
    expectParse('a[][]', astFactory.index(astFactory.index(astFactory.identifier('a'), null), null));
  });

  test('should parse multiple index operators', function() {
    expectParse('a[b] + c[d]', astFactory.binary(
        astFactory.index(astFactory.identifier('a'), astFactory.identifier('b')),
        '+',
        astFactory.index(astFactory.identifier('c'), astFactory.identifier('d'))));
  });

  test('should parse ternary operators', function() {
    expectParse('a ? b : c', astFactory.ternary(astFactory.identifier('a'), astFactory.identifier('b'), astFactory.identifier('c')));
    expectParse('a.a ? b.a : c.a', astFactory.ternary(astFactory.getter(astFactory.identifier('a'), 'a'),
        astFactory.getter(astFactory.identifier('b'), 'a'), astFactory.getter(astFactory.identifier('c'), 'a')));
    // expect(() => parse('a + 1 ? b + 1 :: c.d + 3'), throwsParseException);
  });

  test('ternary operators have lowest associativity', function() {
    expectParse('a == b ? c + d : e - f', astFactory.ternary(
          astFactory.binary(astFactory.identifier('a'), '==', astFactory.identifier('b')),
          astFactory.binary(astFactory.identifier('c'), '+', astFactory.identifier('d')),
          astFactory.binary(astFactory.identifier('e'), '-', astFactory.identifier('f'))));

    expectParse('a.x == b.y ? c + d : e - f', astFactory.ternary(
          astFactory.binary(astFactory.getter(astFactory.identifier('a'), 'x'), '==', astFactory.getter(astFactory.identifier('b'), 'y')),
          astFactory.binary(astFactory.identifier('c'), '+', astFactory.identifier('d')),
          astFactory.binary(astFactory.identifier('e'), '-', astFactory.identifier('f'))));
  });

  test('should parse a filter chain', function() {
    expectParse('a | b | c', astFactory.binary(astFactory.binary(astFactory.identifier('a'), '|', astFactory.identifier('b')),
        '|', astFactory.identifier('c')));
  });

  // test('should parse "in" expression', () {
  //   expectParse('a in b', inExpr(astFactory.identifier('a'), astFactory.identifier('b')));
  //   expectParse('a in b.c',
  //       inExpr(astFactory.identifier('a'), getter(astFactory.identifier('b'), 'c')));
  //   expectParse('a in b + c',
  //       inExpr(astFactory.identifier('a'), binary(astFactory.identifier('b'), '+', astFactory.identifier('c'))));
  // });
  //
  // test('should reject comprehension with non-assignable left expression', () {
  //   expect(() => parse('a + 1 in b'), throwsParseException);
  // });
  //
  // test('should parse "as" expressions', () {
  //   expectParse('a as b', asExpr(astFactory.identifier('a'), astFactory.identifier('b')));
  // });
  //
  // skip_test('should reject keywords as identifiers', () {
  //   expect(() => parse('a.in'), throwsParseException);
  //   expect(() => parse('a.as'), throwsParseException);
  //   expect(() => parse('a.this'), throwsParseException);
  // });

  test('should parse map literals', function() {
    expectParse("{'a': 1}",
        astFactory.mapLiteral([astFactory.mapLiteralEntry(astFactory.literal('a'), astFactory.literal(1))]));
    expectParse("{'a': 1, 'b': 2 + 3}",
        astFactory.mapLiteral([
            astFactory.mapLiteralEntry(astFactory.literal('a'), astFactory.literal(1)),
            astFactory.mapLiteralEntry(astFactory.literal('b'),
                astFactory.binary(astFactory.literal(2), '+', astFactory.literal(3)))]));
    expectParse("{'a': foo()}",
        astFactory.mapLiteral([astFactory.mapLiteralEntry(
            astFactory.literal('a'), astFactory.invoke(astFactory.identifier('foo'), null, []))]));
    expectParse("{'a': foo('a')}",
        astFactory.mapLiteral([astFactory.mapLiteralEntry(
            astFactory.literal('a'), astFactory.invoke(astFactory.identifier('foo'), null, [astFactory.literal('a')]))]));
  });

  test('should parse map literals with method calls', function() {
    expectParse("{'a': 1}.length",
        astFactory.getter(astFactory.mapLiteral([astFactory.mapLiteralEntry(astFactory.literal('a'), astFactory.literal(1))]),
            'length'));
  });

  test('should parse list literals', function() {
    expectParse('[1, "a", b]',
        astFactory.listLiteral([astFactory.literal(1), astFactory.literal('a'), astFactory.identifier('b')]));
    expectParse('[[1, 2], [3, 4]]',
        astFactory.listLiteral([astFactory.listLiteral([astFactory.literal(1), astFactory.literal(2)]),
            astFactory.listLiteral([astFactory.literal(3), astFactory.literal(4)])]));
  });

});
