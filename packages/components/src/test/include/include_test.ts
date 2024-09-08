import {assert} from '@esm-bundle/chai';

import '../../lib/include.js';

suite('h-include', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test('includes some HTML', async () => {
    container.innerHTML = `
      <h-include src="./test/include/test-1.html"></h-include>
    `;
    const include = container.querySelector('h-include')!;
    await new Promise((res) => {
      include.addEventListener('load', res);
    });
    // assert.equal(include.shadowRoot!.children[0].tagName, 'STYLE');
    assert.equal(include.shadowRoot!.children[0].outerHTML, '<h1>TEST</h1>');
  });

  test('includes some HTML in light DOM', async () => {
    container.innerHTML = `
      <h-include no-shadow src="./test/include/test-1.html"></h-include>
    `;
    const include = container.querySelector('h-include')!;
    await new Promise((res) => {
      include.addEventListener('load', res);
    });
    assert.equal(include.innerHTML.trim(), '<h1>TEST</h1>');
  });

  test('preserves light DOM when including to shadow DOM', async () => {
    container.innerHTML = `
      <h-include src="./test/include/test-1.html">TEST</h-include>
    `;
    const include = container.querySelector('h-include')!;
    await new Promise((res) => {
      include.addEventListener('load', res);
    });
    assert.equal(include.innerHTML, 'TEST');
  });

  test('waits for styles to load', async () => {
    container.innerHTML = `
      <h-include src="./test/include/test-styles.html">TEST</h-include>
    `;
    const include = container.querySelector('h-include')!;
    await new Promise((res) => {
      include.addEventListener('load', () => {
        assert.isNotNull(include.shadowRoot!.querySelector('link')!.sheet);
        res(undefined);
      });
    });
  });

  // TODO: tests for mode & changing src attribute
});
