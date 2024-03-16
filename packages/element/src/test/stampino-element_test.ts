import {assert} from '@esm-bundle/chai';
import {StampinoBaseElement} from '../stampino-base-element.js';
import '../stampino-element.js';
import {StampinoElement} from '../stampino-element.js';

suite('stampino-element', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  teardown(() => {
    container.remove();
  });

  test('basic', async () => {
    container.innerHTML = `
      <stampino-element name="test-1" properties="name">
          <style type="adopted-css">
            :host {
              color: blue;
            }
          </style>
          <template>
          <h1>Hello {{ name }}!</h1>
        </template>
      </stampino-element>
    `;
    container.insertAdjacentHTML('beforeend', `<test-1 name="World"></test-1>`);
    const el = container.querySelector('test-1') as StampinoBaseElement;
    assert.instanceOf(el, StampinoBaseElement);
    await el.updateComplete;
    assert.equal(
      stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
      `<h1>Hello World!</h1>`
    );

    const h1 = el.shadowRoot?.firstElementChild!;
    const computedStyles = getComputedStyle(h1);
    assert.equal(computedStyles.color, 'rgb(0, 0, 255)');
  });

  test('reconnecting', async () => {
    container.innerHTML = `
      <stampino-element name="test-2" properties="name">
        <template>
          <h1>Hello {{ name }}!</h1>
        </template>
      </stampino-element>
    `;
    const definitionEl = container.querySelector(
      'stampino-element'
    ) as StampinoElement;

    // Remove and reattach the element to check that it doesn't redo definition
    // time work:
    definitionEl.remove();
    container.append(definitionEl);

    // Make sure an element still works
    container.insertAdjacentHTML('beforeend', `<test-1 name="World"></test-1>`);
    const el = container.querySelector('test-1') as StampinoBaseElement;
    assert.instanceOf(el, StampinoBaseElement);
    await el.updateComplete;
    assert.equal(
      stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
      `<h1>Hello World!</h1>`
    );
  });

  suite('properties', () => {
    test('single property', async () => {
      container.innerHTML = `
        <stampino-element name="test-prop-1" properties="name">
          <template><h1>Hello {{ name }}!</h1></template>
        </stampino-element>
        <test-prop-1></test-prop-1>
      `;
      interface TestProp1Element extends StampinoBaseElement {
        name?: string;
      }
      const el = container.querySelector('test-prop-1') as TestProp1Element;
      assert.equal(el.name, undefined);
      el.name = 'World';
      await el.updateComplete;
      assert.equal(
        stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
        `<h1>Hello World!</h1>`
      );
    });

    test('multiple properties', async () => {
      container.innerHTML = `
        <stampino-element name="test-prop-2" properties="a b">
          <template><p>{{ a }}</p><p>{{ b }}</p></template>
        </stampino-element>
        <test-prop-2></test-prop-2>
      `;
      interface TestProp1Element extends StampinoBaseElement {
        a?: string;
        b?: string;
      }
      const el = container.querySelector('test-prop-2') as TestProp1Element;
      assert.equal(el.a, undefined);
      assert.equal(el.b, undefined);
      el.b = 'BBB';
      await el.updateComplete;
      assert.equal(
        stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
        `<p></p><p>BBB</p>`
      );
    });

    test('property child declaration - type', async () => {
      container.innerHTML = `
        <stampino-element name="test-prop-3">
          <st-prop name="a" type="Number"></st-prop>
          <template><p>{{ a }}</p></template>
        </stampino-element>
        <test-prop-3 a="123"></test-prop-3>
      `;
      interface TestProp1Element extends StampinoBaseElement {
        a?: number;
      }
      const el = container.querySelector('test-prop-3') as TestProp1Element;
      assert.equal(el.a, 123);
      await el.updateComplete;
      assert.equal(
        stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
        `<p>123</p>`
      );
    });

    test('property child declaration - noattribute', async () => {
      container.innerHTML = `
        <stampino-element name="test-prop-4">
          <st-prop name="a" noattribute></st-prop>
          <template><p>{{ a }}</p></template>
        </stampino-element>
        <test-prop-4 a="AAA"></test-prop-4>
      `;
      interface TestProp1Element extends StampinoBaseElement {
        a?: string;
      }
      const el = container.querySelector('test-prop-4') as TestProp1Element;
      assert.equal(el.a, undefined);
      await el.updateComplete;
      assert.equal(
        stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
        `<p></p>`
      );
    });

    test('property child declaration - reflect', async () => {
      container.innerHTML = `
        <stampino-element name="test-prop-5">
          <st-prop name="a" reflect></st-prop>
          <template><p>{{ a }}</p></template>
        </stampino-element>
        <test-prop-5></test-prop-5>
      `;
      interface TestProp1Element extends StampinoBaseElement {
        a?: string;
      }
      const el = container.querySelector('test-prop-5') as TestProp1Element;
      assert.equal(el.a, undefined);
      el.a = 'AAA';
      await el.updateComplete;
      assert.equal(
        stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
        `<p>AAA</p>`
      );
      assert.equal(el.getAttribute('a'), 'AAA');
    });
  });

  suite('inheritance', () => {
    test('trivial subclass', async () => {
      container.innerHTML = `
        <stampino-element name="test-3-a" properties="name">
            <style type="adopted-css">
              :host {
                color: blue;
              }
            </style>
            <template>
            <h1>Hello {{ name }}!</h1>
          </template>
        </stampino-element>
  
        <!-- Trivial subclass -->
        <stampino-element name="test-3-b" extends="test-3-a">
        </stampino-element>

        <test-3-b name="World"></test-3-b>
      `;
      const el = container.querySelector('test-3-b') as StampinoBaseElement;
      assert.instanceOf(el, StampinoBaseElement);
      await el.updateComplete;
      assert.equal(
        stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
        `<h1>Hello World!</h1>`
      );

      const h1 = el.shadowRoot?.firstElementChild!;
      const computedStyles = getComputedStyle(h1);
      assert.equal(computedStyles.color, 'rgb(0, 0, 255)');
    });

    test('subclass with implicit super template', async () => {
      container.innerHTML = `
        <stampino-element name="test-4-a" properties="a b">
            <style type="adopted-css">
              :host {
                color: blue;
              }
            </style>
            <template>
            <h1>{{ a }}</h1>
            <template name="b"><h2>{{ b }}</h2></template>
          </template>
        </stampino-element>
  
        <stampino-element name="test-4-b" extends="test-4-a">
          <template>
            <template name="b"><h3>{{ b }}</h3></template>
          </template>
        </stampino-element>

        <test-4-b a="AAA" b ="BBB"></test-4-b>
      `;
      const el = container.querySelector('test-4-b') as StampinoBaseElement;
      assert.instanceOf(el, StampinoBaseElement);
      await el.updateComplete;
      assert.match(
        stripExpressionMarkers(el.shadowRoot!.innerHTML),
        /^\s*<h1>AAA<\/h1>\s*<h3>BBB<\/h3>\s*/,
      );
    });
  });
});

const stripExpressionMarkers = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->|lit\$[0-9]+\$/g, '');
