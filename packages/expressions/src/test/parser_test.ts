import chai from 'chai';

import * as ast_factory from '../lib/ast_factory.js';
import * as parser from '../lib/parser.js';

const {assert} = chai;

const Parser = parser.Parser;
const astFactory = new ast_factory.DefaultAstFactory();

function expectParse(s: string, e: any) {
  const p = new Parser(s, astFactory).parse();
  assert.deepEqual(p, e);
}

suite('Parser', function () {
  test('can be constructed', function () {
    new Parser('', astFactory);
  });

  test('should parse an empty expression', function () {
    expectParse('', astFactory.empty());
  });

  test('should parse an identifier', function () {
    expectParse('abc', astFactory.id('abc'));
  });

  test('should parse a string literal', function () {
    expectParse('"abc"', astFactory.literal('abc'));
  });

  test('should parse a bool literal', function () {
    expectParse('true', astFactory.literal(true));
    expectParse('false', astFactory.literal(false));
  });

  test('should parse a null literal', function () {
    expectParse('null', astFactory.literal(null));
  });

  test('should parse an integer literal', function () {
    expectParse('123', astFactory.literal(123));
  });

  test('should parse a double literal', function () {
    expectParse('1.23', astFactory.literal(1.23));
  });

  test('should parse a positive double literal', function () {
    expectParse('+1.23', astFactory.literal(1.23));
  });

  test('should parse a negative double literal', function () {
    expectParse('-1.23', astFactory.literal(-1.23));
  });

  test('should parse unary operators', function () {
    expectParse(`!a`, astFactory.unary('!', astFactory.id('a')));
    expectParse(`-a`, astFactory.unary('-', astFactory.id('a')));
  });

  test('should parse binary operators', function () {
    const operators = [
      '+',
      '-',
      '*',
      '/',
      '%',
      '^',
      '==',
      '!=',
      '>',
      '<',
      '>=',
      '<=',
      '||',
      '&&',
      '&',
      '===',
      '!==',
      '|',
    ];
    for (const i in operators) {
      const op = operators[i];
      expectParse(
        `a ${op} b`,
        astFactory.binary(astFactory.id('a'), op, astFactory.id('b'))
      );
      expectParse(
        `1 ${op} 2`,
        astFactory.binary(astFactory.literal(1), op, astFactory.literal(2))
      );
      expectParse(
        `this ${op} null`,
        astFactory.binary(astFactory.id('this'), op, astFactory.literal(null))
      );
    }
  });

  // test('should thrown on unknown operators', () {
  //   expect(() => parse('a ?? b'), throwsParseException);
  //   expect(() => parse('a &&& b'), throwsParseException);
  //   expect(() => parse('a ==== b'), throwsParseException);
  // });

  test('should give multiply higher associativity than plus', function () {
    expectParse(
      'a + b * c',
      astFactory.binary(
        astFactory.id('a'),
        '+',
        astFactory.binary(astFactory.id('b'), '*', astFactory.id('c'))
      )
    );
    expectParse(
      'a * b + c',
      astFactory.binary(
        astFactory.binary(astFactory.id('a'), '*', astFactory.id('b')),
        '+',
        astFactory.id('c')
      )
    );
  });

  test('should parse a dot operator', function () {
    expectParse('a.b', astFactory.getter(astFactory.id('a'), 'b'));
  });

  test('should parse chained dot operators', function () {
    expectParse(
      'a.b.c',
      astFactory.getter(astFactory.getter(astFactory.id('a'), 'b'), 'c')
    );
  });

  test('should give dot high associativity', function () {
    expectParse(
      'a * b.c',
      astFactory.binary(
        astFactory.id('a'),
        '*',
        astFactory.getter(astFactory.id('b'), 'c')
      )
    );
  });

  test('should parse a function with no arguments', function () {
    expectParse('a()', astFactory.invoke(astFactory.id('a'), null, []));
  });

  test('should parse a single function argument', function () {
    expectParse(
      'a(b)',
      astFactory.invoke(astFactory.id('a'), null, [astFactory.id('b')])
    );
  });

  test('should parse a function call as a subexpression', function () {
    expectParse(
      'a() + 1',
      astFactory.binary(
        astFactory.invoke(astFactory.id('a'), null, []),
        '+',
        astFactory.literal(1)
      )
    );
  });

  test('should parse multiple function arguments', function () {
    expectParse(
      'a(b, c)',
      astFactory.invoke(astFactory.id('a'), null, [
        astFactory.id('b'),
        astFactory.id('c'),
      ])
    );
  });

  test('should parse nested function calls', function () {
    expectParse(
      'a(b(c))',
      astFactory.invoke(astFactory.id('a'), null, [
        astFactory.invoke(astFactory.id('b'), null, [astFactory.id('c')]),
      ])
    );
  });

  test('should parse an empty method call', function () {
    expectParse('a.b()', astFactory.invoke(astFactory.id('a'), 'b', []));
  });

  test('should parse a method call with a single argument', function () {
    expectParse(
      'a.b(c)',
      astFactory.invoke(astFactory.id('a'), 'b', [astFactory.id('c')])
    );
  });

  test('should parse a method call with multiple arguments', function () {
    expectParse(
      'a.b(c, d)',
      astFactory.invoke(astFactory.id('a'), 'b', [
        astFactory.id('c'),
        astFactory.id('d'),
      ])
    );
  });

  test('should parse chained method calls', function () {
    expectParse(
      'a.b().c()',
      astFactory.invoke(astFactory.invoke(astFactory.id('a'), 'b', []), 'c', [])
    );
  });

  test('should parse chained function calls', function () {
    expectParse(
      'a()()',
      astFactory.invoke(
        astFactory.invoke(astFactory.id('a'), null, []),
        null,
        []
      )
    );
  });

  test('should parse parenthesized expression', function () {
    expectParse('(a)', astFactory.paren(astFactory.id('a')));
    expectParse(
      '(( 3 * ((1 + 2)) ))',
      astFactory.paren(
        astFactory.paren(
          astFactory.binary(
            astFactory.literal(3),
            '*',
            astFactory.paren(
              astFactory.paren(
                astFactory.binary(
                  astFactory.literal(1),
                  '+',
                  astFactory.literal(2)
                )
              )
            )
          )
        )
      )
    );
  });

  test('should parse an index operator', function () {
    expectParse(
      'a[b]',
      astFactory.index(astFactory.id('a'), astFactory.id('b'))
    );
    expectParse(
      'a.b[c]',
      astFactory.index(
        astFactory.getter(astFactory.id('a'), 'b'),
        astFactory.id('c')
      )
    );
  });

  test('should parse chained index operators', function () {
    expectParse(
      'a[][]',
      astFactory.index(astFactory.index(astFactory.id('a'), null), null)
    );
  });

  test('should parse multiple index operators', function () {
    expectParse(
      'a[b] + c[d]',
      astFactory.binary(
        astFactory.index(astFactory.id('a'), astFactory.id('b')),
        '+',
        astFactory.index(astFactory.id('c'), astFactory.id('d'))
      )
    );
  });

  test('should parse ternary operators', function () {
    expectParse(
      'a ? b : c',
      astFactory.ternary(
        astFactory.id('a'),
        astFactory.id('b'),
        astFactory.id('c')
      )
    );
    expectParse(
      'a.a ? b.a : c.a',
      astFactory.ternary(
        astFactory.getter(astFactory.id('a'), 'a'),
        astFactory.getter(astFactory.id('b'), 'a'),
        astFactory.getter(astFactory.id('c'), 'a')
      )
    );
    // expect(() => parse('a + 1 ? b + 1 :: c.d + 3'), throwsParseException);
  });

  test('ternary operators have lowest associativity', function () {
    expectParse(
      'a == b ? c + d : e - f',
      astFactory.ternary(
        astFactory.binary(astFactory.id('a'), '==', astFactory.id('b')),
        astFactory.binary(astFactory.id('c'), '+', astFactory.id('d')),
        astFactory.binary(astFactory.id('e'), '-', astFactory.id('f'))
      )
    );

    expectParse(
      'a.x == b.y ? c + d : e - f',
      astFactory.ternary(
        astFactory.binary(
          astFactory.getter(astFactory.id('a'), 'x'),
          '==',
          astFactory.getter(astFactory.id('b'), 'y')
        ),
        astFactory.binary(astFactory.id('c'), '+', astFactory.id('d')),
        astFactory.binary(astFactory.id('e'), '-', astFactory.id('f'))
      )
    );
  });

  test('should parse a filter chain', function () {
    expectParse(
      'a | b | c',
      astFactory.binary(
        astFactory.binary(astFactory.id('a'), '|', astFactory.id('b')),
        '|',
        astFactory.id('c')
      )
    );
  });

  test('should parse map literals', function () {
    expectParse("{'a': 1}", astFactory.map({a: astFactory.literal(1)}));
    expectParse(
      "{'a': 1, 'b': 2 + 3}",
      astFactory.map({
        a: astFactory.literal(1),
        b: astFactory.binary(astFactory.literal(2), '+', astFactory.literal(3)),
      })
    );
    expectParse(
      "{'a': foo()}",
      astFactory.map({
        a: astFactory.invoke(astFactory.id('foo'), null, []),
      })
    );
    expectParse(
      "{'a': foo('a')}",
      astFactory.map({
        a: astFactory.invoke(astFactory.id('foo'), null, [
          astFactory.literal('a'),
        ]),
      })
    );
  });

  test('should parse map literals with method calls', function () {
    expectParse(
      "{'a': 1}.length",
      astFactory.getter(astFactory.map({a: astFactory.literal(1)}), 'length')
    );
  });

  test('should parse list literals', function () {
    expectParse(
      '[1, "a", b]',
      astFactory.list([
        astFactory.literal(1),
        astFactory.literal('a'),
        astFactory.id('b'),
      ])
    );
    expectParse(
      '[[1, 2], [3, 4]]',
      astFactory.list([
        astFactory.list([astFactory.literal(1), astFactory.literal(2)]),
        astFactory.list([astFactory.literal(3), astFactory.literal(4)]),
      ])
    );
  });
});
