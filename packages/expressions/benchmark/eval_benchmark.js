'use strict';

var evaluate = require('../src/eval.js');
let parser = require('../src/parser');

var Benchmark = require('benchmark');
let Parser = parser.Parser;

var suite = new Benchmark.Suite;

let astFactory = new evaluate.EvalAstFactory();

suite
  .add('eval identifier', function() {
    var expr = new Parser('foo', astFactory).parse();
    var result = expr.evaluate({foo: 'bar'});
    return result;
  })
  .add('native identifier', function() {
    var f = function(o) { return o.foo; };
    var result = f({foo: 'bar'});
    return result;
  })
  .add('eval complex', function() {
    var expr = new Parser('(a + b([1, 2, 3]) * c)', astFactory).parse();
    var result = expr.evaluate({
      a: 42,
      b: function(o) { return o.length; },
      c: 2,
    });
    return result;
  })
  .add('native complex', function() {
    var f = function(a, b, c) { return (a + b([1, 2, 3]) * c); };
    var result = f(42, function(o) { return o.length; }, 2);
    return result;
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .run({ 'async': true });

  // (function f() {
  //   var expr = new Parser('(a + b([1, 2, 3]) * c)', astFactory).parse();
  //   var result = expr.evaluate({
  //     a: 42,
  //     b: function(o) { return o.length; },
  //     c: 2,
  //   });
  //   return result;
  // })();
