'use strict';

const Benchmark = require('benchmark');
const evaluate = require('../lib/eval.js');
const parser = require('../lib/parser');

const suite = new Benchmark.Suite();

const Parser = parser.Parser;
const astFactory = new evaluate.EvalAstFactory();
const identifierExpr = new Parser('foo', astFactory).parse();
const complexExpr = new Parser('(a + b([1, 2, 3]) * c)', astFactory).parse();

suite
    .add(
        'eval identifier',
        function() {
          var result = identifierExpr.evaluate({foo: 'bar'});
          return result;
        })
    .add(
        'native identifier',
        function() {
          var f = function(o) {
            return o.foo;
          };
          var result = f({foo: 'bar'});
          return result;
        })
    .add(
        'eval complex',
        function() {
          var result = complexExpr.evaluate({
            a: 42,
            b: function(o) {
              return o.length;
            },
            c: 2,
          });
          return result;
        })
    .add(
        'native complex',
        function() {
          var f = function(a, b, c) {
            return (a + b([1, 2, 3]) * c);
          };
          var result = f(42, function(o) {
            return o.length;
          }, 2);
          return result;
        })
    .on('cycle',
        function(event) {
          console.log(String(event.target));
        })
    .run({'async': true});
