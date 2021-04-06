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
});

const stripExpressionMarkers = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->|lit\$[0-9]+\$/g, '');
