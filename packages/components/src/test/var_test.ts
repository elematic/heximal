import {assert} from '@esm-bundle/chai';
import '../lib/var.js';
import '../lib/scope.js';
import {getScope, runAutoTemplates} from '../lib/document.js';

suite('h-var', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test('defaults to string type', async () => {
    container.innerHTML = `<h-scope><h-var name="foo" value="bar"></h-var></h-scope>`;
    const el = container.querySelector('h-var')!;
    await el.updateComplete;
    const scope = getScope(el)!;
    assert.strictEqual(el.value, 'bar');
    assert.strictEqual(scope.foo, 'bar');
  });

  test('converts type="number" regardless of attribute order', async () => {
    container.innerHTML = `
      <h-scope>
        <h-var name="a" type="number" value="0"></h-var>
        <h-var name="b" value="42.5" type="Number"></h-var>
      </h-scope>
    `;
    const [elA, elB] = container.querySelectorAll('h-var');
    await elA.updateComplete;
    await elB.updateComplete;
    const scope = getScope(elA)!;
    assert.strictEqual(elA.value, 0);
    assert.strictEqual(scope.a, 0);
    assert.strictEqual(elB.value, 42.5);
    assert.strictEqual(scope.b, 42.5);
  });

  test('converts type="boolean"', async () => {
    container.innerHTML = `
      <h-scope>
        <h-var name="t" type="boolean" value="true"></h-var>
        <h-var name="f" type="Boolean" value="false"></h-var>
      </h-scope>
    `;
    const [elT, elF] = container.querySelectorAll('h-var');
    await elT.updateComplete;
    await elF.updateComplete;
    const scope = getScope(elT)!;
    assert.strictEqual(scope.t, true);
    assert.strictEqual(scope.f, false);
  });

  test('converts type="json", "object", and "array"', async () => {
    container.innerHTML = `
      <h-scope>
        <h-var name="arr" type="array" value="[1, 2, 3]"></h-var>
        <h-var name="obj" type="object" value='{"x": 10}'></h-var>
      </h-scope>
    `;
    const [elArr, elObj] = container.querySelectorAll('h-var');
    await elArr.updateComplete;
    await elObj.updateComplete;
    const scope = getScope(elArr)!;
    assert.deepEqual(scope.arr, [1, 2, 3]);
    assert.deepEqual(scope.obj, {x: 10});
  });

  test('supports .value property binding in templates', async () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({mode: 'open'});
    container.appendChild(host);
    shadow.innerHTML = `
      <template h-auto>
        <h-var name="counter" .value="{{ 0 }}"></h-var>
        <span id="out">{{ counter }}</span>
        <button @click="{{ () => counter = counter + 1 }}">+</button>
      </template>
    `;
    runAutoTemplates(shadow);
    const span = shadow.querySelector('#out')!;
    const button = shadow.querySelector('button')!;
    assert.strictEqual(span.textContent, '0');
    button.click();
    await new Promise((r) => setTimeout(r, 0));
    assert.strictEqual(span.textContent, '1');
  });
});
