'use strict';

const Benchmark = require('benchmark');
const evaluate = require('../lib/eval.js');
const parser = require('../lib/parser');
const AstFactory = require('../lib/ast_factory').DefaultAstFactory;

const suite = new Benchmark.Suite();
const astFactory = new AstFactory();

suite
    .add(
        'parse identifier',
        function() {
          return parser.parse('foo', astFactory);
        })
    .add(
        'parse complex',
        function() {
          return parser.parse('(a + b([1, 2, 3]) * c)', astFactory);
        })
    .on('cycle',
        function(event) {
          console.log(String(event.target));
        })
    .run({'async': true});
