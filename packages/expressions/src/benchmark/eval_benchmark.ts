import Benchmark, {Event} from 'benchmark';
import {EvalAstFactory} from '../lib/eval.js';
import {Parser} from '../lib/parser.js';

const suite = new Benchmark.Suite();

const astFactory = new EvalAstFactory();
const identifierExpr = new Parser('foo', astFactory).parse()!;
const complexExpr = new Parser('(a + b([1, 2, 3]) * c)', astFactory).parse()!;

suite
  .add('eval identifier', function () {
    return identifierExpr.evaluate({foo: 'bar'});
  })
  .add('native identifier', function () {
    const f = function (o: {foo: string}) {
      return o.foo;
    };
    const result = f({foo: 'bar'});
    return result;
  })
  .add('eval complex', function () {
    const result = complexExpr.evaluate({
      a: 42,
      b: function (o: Array<number>) {
        return o.length;
      },
      c: 2,
    });
    return result;
  })
  .add('native complex', function () {
    var f = function (a: number, b: (a: Array<number>) => number, c: number) {
      return a + b([1, 2, 3]) * c;
    };
    var result = f(
      42,
      function (o) {
        return o.length;
      },
      2
    );
    return result;
  })
  .on('cycle', function (event: Event) {
    console.log(String(event.target));
  })
  .run({async: true});
