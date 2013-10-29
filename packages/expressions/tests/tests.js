// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

suite('PolymerExpressions', function() {

  var testDiv, originalConsoleError, errors;

  function unbindAll(node) {
    node.unbindAll();
    for (var child = node.firstChild; child; child = child.nextSibling)
      unbindAll(child);
  }

  setup(function() {
    errors = [];
    originalConsoleError = console.error;
    console.error = function() {
      errors.push(Array.prototype.slice.call(arguments));
    };
    testDiv = document.body.appendChild(document.createElement('div'));
    Observer._errorThrownDuringCallback = false;
  });

  teardown(function() {
    errors = [];
    console.error = originalConsoleError;
    assert.isFalse(!!Observer._errorThrownDuringCallback);
    document.body.removeChild(testDiv);
    unbindAll(testDiv);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual(4, Observer._allObserversCount);

    delete PolymerExpressions.filters.hex;
    delete PolymerExpressions.filters.plusN;
    delete PolymerExpressions.filters.toFixed;
    delete PolymerExpressions.filters.upperCase;
    delete PolymerExpressions.filters.staticSort;
  });

  function dispatchEvent(type, target) {
    var event = document.createEvent('Event');
    event.initEvent(type, true, false);
    target.dispatchEvent(event);
    Platform.performMicrotaskCheckpoint();
  }

  function hasClass(node, className) {
    return node.className.split(' ').some(function(name) {
      return name === className;
    });
  }

  function assertHasClass(node, className) {
    return assert.isTrue(hasClass(node, className))
  }

  function assertLacksClass(node, className) {
    return assert.isFalse(hasClass(node, className))
  }

  function createTestHtml(s) {
    var div = document.createElement('div');
    div.innerHTML = s;
    testDiv.appendChild(div);

    HTMLTemplateElement.forAllTemplatesFrom_(div, function(template) {
      HTMLTemplateElement.decorate(template);
    });

    return div;
  }

  function recursivelySetTemplateModel(node, model) {
    HTMLTemplateElement.forAllTemplatesFrom_(node, function(template) {
      template.bindingDelegate = new PolymerExpressions;
      template.model = model;
    });
  }

  function hex() {
    return {
      toDOM: function(value) {
        return Number(value).toString(16);
      },
      toModel: function(value) {
        return parseInt(value, 16);
      }
    };
  }

  function toFixed(fractions) {
    return {
      toDOM: function(value) {
        return Number(value).toFixed(fractions);
      }
    };
  }

  function upperCase() {
    return {
      toDOM: function(value) {
        return String(value).toUpperCase();
      }
    };
  }

  function plusN(n) {
    return {
      toDOM: function(value) {
        return Number(value) + n;
      },
      toModel: function(value) {
        return Number(value) - n;
      }
    };
  }

  function staticSort() {
    return {
      toDOM: function(list) {
        var copy = list.slice(0);
        copy.sort();
        return copy;
      }
    };
  }

  test('ClassName Singular', function() {
    var div = createTestHtml(
        '<template bind><div class="{{ {foo: bar} | tokenList }}">' +
        '</div></template>');
    var model = {bar: 1};
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    var target = div.childNodes[1];
    assertHasClass(target, 'foo');

    model.bar = 0;
    Platform.performMicrotaskCheckpoint();
    assertLacksClass(target, 'foo');
  });

  test('ClassName Multiple', function() {
    var div = createTestHtml(
        '<template bind>' +
        '<div class="{{ {foo: bar, baz: bat > 1, boo: bot.bam} ' +
            '| tokenList }}">' +
        '</div></template>');
    var model = {bar: 1, bat: 1, bot: { bam: 1 }};
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    var target = div.childNodes[1];
    assert.strictEqual('foo boo', target.className);
    assertHasClass(target, 'foo');
    assertLacksClass(target, 'baz');
    assertHasClass(target, 'boo');

    model.bar = 0;
    model.bat = 2;
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('baz boo', target.className);
    assertLacksClass(target, 'foo');
    assertHasClass(target, 'baz');
    assertHasClass(target, 'boo');
  });

  test('tokenList', function() {
    var div = createTestHtml(
        '<template bind>' +
        '<div class="{{ object | tokenList }}">' +
        '</div></template>');

    var model = {
      object: {bar: 1, bat: 1, bot: {bam: 1}}
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    var target = div.childNodes[1];
    assert.strictEqual('bar bat bot', target.className);

    model.object = {bar: 1, bot: 1};
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('bar bot', target.className);
  });

  test('styleObject', function() {
    // IE removes invalid style attribute values so we use xstyle in this test.

    var div = createTestHtml(
        '<template bind>' +
        '<div xstyle="{{ object | styleObject }}">' +
        '</div></template>');

    var model = {
      object: {
        width: '100px',
        backgroundColor: 'blue',
        WebkitUserSelect: 'none'
      }
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    var target = div.childNodes[1];
    assert.strictEqual(target.getAttribute('xstyle'),
        'width: 100px; background-color: blue; -webkit-user-select: none');

    model.object = {
      left: '50px',
      whiteSpace: 'pre'
    };
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual(target.getAttribute('xstyle'),
        'left: 50px; white-space: pre');
  });

  test('styleObject2', function() {
    // IE removes invalid style attribute values so we use xstyle in this test.

    var div = createTestHtml(
        '<template bind>' +
        '<div xstyle="{{ {width: w, backgroundColor: bc} | styleObject }}">' +
        '</div></template>');

    var model = {
      w: '100px',
      bc: 'blue'
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    var target = div.childNodes[1];
    assert.strictEqual(target.getAttribute('xstyle'),
                       'width: 100px; background-color: blue');

    model.w = 0;
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual(target.getAttribute('xstyle'),
        'width: 0; background-color: blue');
  });

  test('Named Scope Bind', function() {
    var div = createTestHtml(
        '<template bind>' +
          '<template bind="{{ foo.bar as baz }}">' +
            '{{ id }}:{{ baz.bat }}' +
          '</template>' +
        '</template>');
    var model = { id: 'id', foo: { bar: { bat: 'boo' }}};
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('id:boo', div.childNodes[2].textContent);
  });

  test('Named Scope Repeat', function() {
    var div = createTestHtml(
        '<template bind>' +
          '<template repeat="{{ user in users }}">' +
            '{{ id }}:{{ user.name }}' +
          '</template>' +
        '</template>');
    var model = {
      id: 'id',
      users: [
        { name: 'Tim' },
        { name: 'Sally'}
      ]
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('id:Tim', div.childNodes[2].textContent);
    assert.strictEqual('id:Sally', div.childNodes[3].textContent);
  });

  test('Named Scope Deep Nesting', function() {
    var div = createTestHtml(
        '<template bind>' +
          '<template repeat="{{ user in users }}">' +
            '{{ id }}:{{ user.name }}' +
            '<template repeat="{{ employee in user.employees }}">' +
              '{{ id }}:{{ user.name }}:{{ employee.name }}' +
            '</template>' +
          '</template>' +
        '</template>');
    var model = {
      id: 'id',
      users: [
        { name: 'Tim', employees: [{ name: 'Bob'}, { name: 'Sam'}]},
        { name: 'Sally', employees: [{ name: 'Steve' }]}
      ]
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('id:Tim', div.childNodes[2].textContent);
    assert.strictEqual('id:Tim:Bob', div.childNodes[4].textContent);
    assert.strictEqual('id:Tim:Sam', div.childNodes[5].textContent);

    assert.strictEqual('id:Sally', div.childNodes[6].textContent);
    assert.strictEqual('id:Sally:Steve', div.childNodes[8].textContent);
  });

  test('Named Scope Unnamed resets', function() {
    var div = createTestHtml(
        '<template bind>' +
          '<template bind="{{ foo as bar }}">' +
            '{{ bar.id }}' +
            '<template bind="{{ bar.bat }}">' +
              '{{ boo }}:{{ bar.id }}' +
            '</template>' +
          '</template>' +
        '</template>');
    var model = {
      foo: {
        id: 2,
        bat: {
          boo: 'bot'
        }
      },
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('2', div.childNodes[2].textContent);
    assert.strictEqual('bot:', div.childNodes[4].textContent);
  });

  test('Expressions Arithmetic, + - / *', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ (a.b + c.d)/e - f * g.h }}' +
        '</template>');
    var model = {
      a: {
        b: 5
      },
      c: {
        d: 5
      },
      e: 2,
      f: 3,
      g: {
        h: 2
      }
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('-1', div.childNodes[1].textContent);

    model.a.b = 11;
    model.f = -2;
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('12', div.childNodes[1].textContent);
  });

  test('Expressions Unary - +', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ (-a.b) - (+c) }}' +
        '</template>');
    var model = {
      a: {
        b: 5
      },
      c: 3
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('-8', div.childNodes[1].textContent);

    model.a.b = -1;
    model.c = -4;
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('5', div.childNodes[1].textContent);
  });

  test('Expressions Logical !', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ !a.b }}:{{ !c }}:{{ !d }}' +
        '</template>');
    var model = {
      a: {
        b: 5
      },
      c: '',
      d: false
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('false:true:true', div.childNodes[1].textContent);

    model.a.b = 0;
    model.c = 'foo'
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('true:false:true', div.childNodes[1].textContent);
  });

  test('Expressions Arithmetic, Additive', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ (a.b + c.d) - (f + g.h) }}' +
        '</template>');
    var model = {
      a: {
        b: 5
      },
      c: {
        d: 5
      },
      e: 2,
      f: 3,
      g: {
        h: 2
      }
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('5', div.childNodes[1].textContent);

    model.a.b = 7;
    model.g.h = -5;
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('14', div.childNodes[1].textContent);
  });

  test('Expressions Arithmetic, Multiplicative', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ (a.b * c.d) / (f % g.h) }}' +
        '</template>');
    var model = {
      a: {
        b: 5
      },
      c: {
        d: 6
      },
      e: 2,
      f: 8,
      g: {
        h: 5
      }
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('10', div.childNodes[1].textContent);

    model.a.b = 10;
    model.f = 16;
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('60', div.childNodes[1].textContent);
  });

  test('Expressions Relational', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ a.b > c }}:{{ a.b < c }}:{{ c >= d }}:{{ d <= e }}' +
        '</template>');
    var model = {
      a: {
        b: 5
      },
      c: 3,
      d: 3,
      e: 2
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('true:false:true:false', div.childNodes[1].textContent);

    model.a.b = 1;
    model.d = -5;
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('false:true:true:true', div.childNodes[1].textContent);
  });

  test('Expressions Equality', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ a.b == c }}:{{ a.b != c }}:{{ c === d }}:{{ d !== e }}' +
        '</template>');
    var model = {
      a: {
        b: 5
      },
      c: '5',
      d: {}
    };
    model.e = model.d;

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('true:false:false:false', div.childNodes[1].textContent);

    model.a.b = 3;
    model.e = {};
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('false:true:false:true', div.childNodes[1].textContent);
  });

  test('Expressions Binary Logical', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ a.b && c }}:{{ a.b || c }}:{{ c && d }}:{{ d || e }}' +
        '</template>');
    var model = {
      a: {
        b: 0
      },
      c: 5,
      d: true,
      e: ''
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('0:5:true:true', div.childNodes[1].textContent);

    model.a.b = true;
    model.d = 0;
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('5:true:0:', div.childNodes[1].textContent);
  });

  test('Expressions Conditional', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ a.b ? c : d.e }}:{{ f ? g.h : i }}' +
        '</template>');
    var model = {
      a: {
        b: 1
      },
      c: 5,
      d: {
        e: 2
      },
      f: 0,
      g: {
        h: 'foo'
      },
      i: 'bar'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('5:bar', div.childNodes[1].textContent);

    model.c = 6;
    model.f = '';
    model.i = 'bat'
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('6:bat', div.childNodes[1].textContent);
  });

  test('Expressions Literals', function() {
    var div = createTestHtml(
        '<template bind>' +
            '{{ +1 }}:{{ "foo" }}:{{ true ? true : false }}:' +
            '{{ true ? null : false}}' +
        '</template>');
    var model = {};

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('1:foo:true:null', div.childNodes[1].textContent);
  });

  test('Expressions Array Literals', function() {
    var div = createTestHtml(
        '<template repeat="{{ [foo, bar] }}">' +
            '{{}}' +
        '</template>');

    var model = {
      foo: 'bar',
      bar: 'bat'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('bar', div.childNodes[1].textContent);
    assert.strictEqual('bat', div.childNodes[2].textContent);

    model.foo = 'boo';
    model.bar = 'blat';
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('boo', div.childNodes[1].textContent);
    assert.strictEqual('blat', div.childNodes[2].textContent);
  });

  test('Expressions Object Literals', function() {
    var div = createTestHtml(
        '<template bind="{{ { \'id\': 1, foo: bar } }}">' +
            '{{id}}:{{foo}}' +
        '</template>');

    var model = {
      bar: 'bat'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('1:bat', div.childNodes[1].textContent);

    model.bar = 'blat';
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('1:blat', div.childNodes[1].textContent);
  });

  test('Expressions Array Literals, Named Scope', function() {
    var div = createTestHtml(
        '<template repeat="{{ user in [foo, bar] }}">' +
            '{{ user }}' +
        '</template>');

    var model = {
      foo: 'bar',
      bar: 'bat'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('bar', div.childNodes[1].textContent);
    assert.strictEqual('bat', div.childNodes[2].textContent);

    model.foo = 'boo';
    model.bar = 'blat';
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('boo', div.childNodes[1].textContent);
    assert.strictEqual('blat', div.childNodes[2].textContent);
  });

  test('Expressions Object Literals, Named Scope', function() {
    var div = createTestHtml(
        '<template bind="{{ { \'id\': 1, foo: bar } as t }}">' +
            '{{t.id}}:{{t.foo}}' +
        '</template>');

    var model = {
      bar: 'bat'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('1:bat', div.childNodes[1].textContent);

    model.bar = 'blat';
    Platform.performMicrotaskCheckpoint();
    assert.strictEqual('1:blat', div.childNodes[1].textContent);
  });

  test('filter without arguments', function() {
    PolymerExpressions.filters.upperCase = upperCase;

    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '{{ bar | upperCase }}' +
            '{{ bar | upperCase() }}' +
        '</template>');

    var model = {
      bar: 'bat'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('BATBAT', div.childNodes[1].textContent);

    model.bar = 'blat';
    Platform.performMicrotaskCheckpoint();
    assert.equal('BLATBLAT', div.childNodes[1].textContent);
  });

  test('filter with arguments', function() {
    PolymerExpressions.filters.toFixed = toFixed;

    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '{{ bar | toFixed(4) }}' +
        '</template>');

    var model = {
      bar: 1.23456789
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('1.2346', div.childNodes[1].textContent);

    model.bar = 9.87654321;
    Platform.performMicrotaskCheckpoint();
    assert.equal('9.8765', div.childNodes[1].textContent);
  });

  test('chained filters', function() {
    PolymerExpressions.filters.hex = hex;
    PolymerExpressions.filters.toFixed = toFixed;
    PolymerExpressions.filters.upperCase = upperCase;

    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '{{ bar | toFixed(0) | hex | upperCase }}' +
        '</template>');

    var model = {
      bar: 12.34
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('C', div.childNodes[1].textContent);

    model.bar = 14.56;
    Platform.performMicrotaskCheckpoint();
    assert.equal('F', div.childNodes[1].textContent);
  });

  test('two-way filter', function() {
    PolymerExpressions.filters.hex = hex;

    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '<input value="{{ bar | hex }}">' +
        '</template>');

    var model = {
      bar: 32
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('20', div.childNodes[1].value);

    div.childNodes[1].value = 'ff';
    dispatchEvent('input', div.childNodes[1]);

    Platform.performMicrotaskCheckpoint();
    assert.equal(255, model.bar);

    model.bar = 15;
    Platform.performMicrotaskCheckpoint();
    assert.equal('f', div.childNodes[1].value);
  });

  test('two-way filter too many paths', function() {
    PolymerExpressions.filters.hex = hex;

    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '<input value="{{ bar + num | hex }}">' +
        '</template>');

    var model = {
      bar: 32,
      num: 10
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('2a', div.childNodes[1].value);

    div.childNodes[1].value = 'ff';
    dispatchEvent('input', div.childNodes[1]);

    Platform.performMicrotaskCheckpoint();
    assert.equal(32, model.bar);
    assert.equal(10, model.num);

    model.bar = 15;
    Platform.performMicrotaskCheckpoint();
    assert.equal('19', div.childNodes[1].value);

    model.num = 5;
    Platform.performMicrotaskCheckpoint();
    assert.equal('14', div.childNodes[1].value);
  });

  test('two-way filter chained', function() {
    PolymerExpressions.filters.hex = hex;
    PolymerExpressions.filters.plusN = plusN;

    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '<input value="{{ bar | plusN(10) | hex }}">' +
        '</template>');

    var model = {
      bar: 22
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('20', div.childNodes[1].value);

    div.childNodes[1].value = 'ff';
    dispatchEvent('input', div.childNodes[1]);

    Platform.performMicrotaskCheckpoint();
    assert.equal(245, model.bar);

    model.bar = 5;
    Platform.performMicrotaskCheckpoint();
    assert.equal('f', div.childNodes[1].value);
  });

  test('filter unexpected EOF', function() {
    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '{{ bar | }}' +
        '</template>');

    var model = {
      bar: 'bat'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('', div.childNodes[1].textContent);

    model.bar = 'blat';
    Platform.performMicrotaskCheckpoint();
    assert.equal('', div.childNodes[1].textContent);

    assert.equal(errors[0][0], 'Invalid expression syntax: bar |');
  });

  test('filter not at EOF', function() {
    var div = createTestHtml(
        '<template bind="{{ }}">' +
            '{{ bar | upperCase + 42 }}' +
        '</template>');

    var model = {
      bar: 'bat'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('', div.childNodes[1].textContent);

    model.bar = 'blat';
    Platform.performMicrotaskCheckpoint();
    assert.equal('', div.childNodes[1].textContent);

    assert.equal(errors[0][0],
                 'Invalid expression syntax: bar | upperCase + 42');
  });

  test('Member lookup with constant expressions', function() {
    var div = createTestHtml(
        '<template bind>' +
          '{{ array[0] }} {{ object["a"] }}' +
        '</template>');
    var model = {
      array: ['a', 'b'],
      object: {
        a: 'A'
      }
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('a A', div.childNodes[1].textContent);

    model.array = ['c', 'd'];
    Platform.performMicrotaskCheckpoint();
    assert.equal('c A', div.childNodes[1].textContent);

    model.object = {a: 'E'};
    Platform.performMicrotaskCheckpoint();
    assert.equal('c E', div.childNodes[1].textContent);
  });

  test('Member lookup', function() {
    var div = createTestHtml(
        '<template bind>' +
          '{{ array[index] }} {{ object[key] }}' +
        '</template>');
    var model = {
      array: ['a', 'b'],
      index: 0,
      object: {
        a: 'A',
        b: 'B'
      },
      key: 'a'
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('a A', div.childNodes[1].textContent);

    model.index = 1;
    Platform.performMicrotaskCheckpoint();
    assert.equal('b A', div.childNodes[1].textContent);

    model.key = 'b';
    Platform.performMicrotaskCheckpoint();
    assert.equal('b B', div.childNodes[1].textContent);

    model.array = ['c', 'd'];
    Platform.performMicrotaskCheckpoint();
    assert.equal('d B', div.childNodes[1].textContent);

    model.object = {
      a: 'C',
      b: 'D'
    };
    Platform.performMicrotaskCheckpoint();
    assert.equal('d D', div.childNodes[1].textContent);
  });

  test('Member lookup nested', function() {
    var div = createTestHtml(
        '<template bind>' +
          '{{ object[array[index]] }}' +
        '</template>');
    var model = {
      array: ['a', 'b'],
      index: 0,
      object: {
        a: 'A',
        b: 'B'
      }
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();
    assert.equal('A', div.childNodes[1].textContent);

    model.index = 1;
    Platform.performMicrotaskCheckpoint();
    assert.equal('B', div.childNodes[1].textContent);
  });

  test('in expression with index scope', function() {
    var div = createTestHtml(
        '<template repeat="{{ value, i in array }}">' +
          '{{ i }}. {{ value }}' +
        '</template>');

    var model = {
      array: ['a', 'b', 'c']
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0. a', div.childNodes[1].textContent);
    assert.strictEqual('1. b', div.childNodes[2].textContent);
    assert.strictEqual('2. c', div.childNodes[3].textContent);

    model.array.splice(1, 1, 'd', 'e');
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0. a', div.childNodes[1].textContent);
    assert.strictEqual('1. d', div.childNodes[2].textContent);
    assert.strictEqual('2. e', div.childNodes[3].textContent);
    assert.strictEqual('3. c', div.childNodes[4].textContent);

    model.array.reverse();
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0. c', div.childNodes[1].textContent);
    assert.strictEqual('1. e', div.childNodes[2].textContent);
    assert.strictEqual('2. d', div.childNodes[3].textContent);
    assert.strictEqual('3. a', div.childNodes[4].textContent);

    model.array.sort();
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0. a', div.childNodes[1].textContent);
    assert.strictEqual('1. c', div.childNodes[2].textContent);
    assert.strictEqual('2. d', div.childNodes[3].textContent);
    assert.strictEqual('3. e', div.childNodes[4].textContent);

    model.array.shift();
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0. c', div.childNodes[1].textContent);
    assert.strictEqual('1. d', div.childNodes[2].textContent);
    assert.strictEqual('2. e', div.childNodes[3].textContent);

    model.array.unshift('f');
    model.array.push('g');
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0. f', div.childNodes[1].textContent);
    assert.strictEqual('1. c', div.childNodes[2].textContent);
    assert.strictEqual('2. d', div.childNodes[3].textContent);
    assert.strictEqual('3. e', div.childNodes[4].textContent);
    assert.strictEqual('4. g', div.childNodes[5].textContent);
  });

  test('in expression with nested index scopes', function() {
    var div = createTestHtml(
        '<template repeat="{{ foo, i in foos }}">' +
          '<template repeat="{{ value, j in foo }}">' +
            '{{ i }}:{{ j }}. {{ value }}' +
          '</template>' +
        '</template>');

    var model = {
      foos: [
        [ 'a', 'b'],
        [ 'c', 'd']
      ]
    };

    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0:0. a', div.childNodes[2].textContent);
    assert.strictEqual('0:1. b', div.childNodes[3].textContent);
    assert.strictEqual('1:0. c', div.childNodes[5].textContent);
    assert.strictEqual('1:1. d', div.childNodes[6].textContent);

    model.foos.reverse();
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0:0. c', div.childNodes[2].textContent);
    assert.strictEqual('0:1. d', div.childNodes[3].textContent);
    assert.strictEqual('1:0. a', div.childNodes[5].textContent);
    assert.strictEqual('1:1. b', div.childNodes[6].textContent);

    model.foos[0].reverse();
    model.foos[1].reverse();
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('0:0. d', div.childNodes[2].textContent);
    assert.strictEqual('0:1. c', div.childNodes[3].textContent);
    assert.strictEqual('1:0. b', div.childNodes[5].textContent);
    assert.strictEqual('1:1. a', div.childNodes[6].textContent);
  });

  test('Named Scope Bind with filter', function() {
    PolymerExpressions.filters.hex = hex;

    var div = createTestHtml(
        '<template bind>' +
          '<template bind="{{ value | hex as hexValue }}">' +
            '{{ hexValue }}' +
          '</template>' +
        '</template>');

    var model = {
      value: 32
    };
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    var target = div.childNodes[2];
    assert.strictEqual('20', div.childNodes[2].textContent);

    model.value = 255;
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('ff', div.childNodes[2].textContent);
  });

  test('Named Scope Repeat with filter', function() {
    PolymerExpressions.filters.staticSort = staticSort;

    var div = createTestHtml(
        '<template bind>' +
          '<template repeat="{{ value in [ 3, 2, 1 ] | staticSort }}">' +
            '{{ value }}' +
          '</template>' +
        '</template>');
    var model = {};
    recursivelySetTemplateModel(div, model);
    Platform.performMicrotaskCheckpoint();

    assert.strictEqual('1', div.childNodes[2].textContent);
    assert.strictEqual('2', div.childNodes[3].textContent);
    assert.strictEqual('3', div.childNodes[4].textContent);
  });
});
