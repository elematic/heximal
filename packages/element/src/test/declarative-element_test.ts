import {assert} from '@esm-bundle/chai';
import {HeximalDeclarativeElement} from '../lib/declarative-element.js';
import {render, html} from 'lit/html.js';
import {customElement, property} from 'lit/decorators.js';

suite('HeximalDeclarativeElement', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  teardown(() => {
    container.remove();
  });

  test('basic', async () => {
    const template = document.createElement('template');
    template.innerHTML = `
      <h1>Hello {{ name }}!</h1>
    `;
    @customElement('test-element-1')
    class TestElement extends HeximalDeclarativeElement {
      static override template = template;

      @property()
      accessor name: string | undefined;
    }
    render(html`<test-element-1 name="World"></test-element-1>`, container);
    const el = container.firstElementChild as TestElement;
    assert.instanceOf(el, TestElement);
    await el.updateComplete;
    assert.equal(
      stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
      `<h1>Hello World!</h1>`,
    );
  });
});

const stripExpressionMarkers = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->|lit\$[0-9]+\$/g, '');
