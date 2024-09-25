import {assert} from '@esm-bundle/chai';

import '../../lib/num.js';

suite('h-num', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test('...', async () => {
    container.innerHTML = `
      <h-num>1234.5</h-num>
    `;
    const el = container.querySelector('h-num')!;
    await el.updateComplete;

    const span = el.shadowRoot!.children[1];
    assert.equal(span.textContent, '1,234.5');
  });
});
