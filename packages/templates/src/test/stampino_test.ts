import {assert} from '@esm-bundle/chai';
import {render as litRender} from 'lit-html';
import {
  Renderer,
  evaluateTemplate,
  prepareTemplate,
  render,
} from '../stampino.js';

suite('stampino', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('No bindings', () => {
    const template = document.createElement('template');
    template.innerHTML = `<h1>Hello</h1>`;
    render(template, container, {});
    assert.equal(stripExpressionMarkers(container.innerHTML), `<h1>Hello</h1>`);
  });

  test('Text binding', () => {
    const template = document.createElement('template');
    template.innerHTML = `Hello {{ name }}`;
    render(template, container, {name: 'World'});
    assert.equal(stripExpressionMarkers(container.innerHTML), `Hello World`);
  });

  test('Multiple text bindings', () => {
    const template = document.createElement('template');
    template.innerHTML = `{{ x }} : {{ y }}`;
    render(template, container, {x: 'X', y: 'Y'});
    assert.equal(stripExpressionMarkers(container.innerHTML), `X : Y`);
  });

  test('Text binding in element', () => {
    const template = document.createElement('template');
    template.innerHTML = `<h1>Hello {{ name.toUpperCase() }}!</h1>`;
    render(template, container, {name: 'World'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<h1>Hello WORLD!</h1>`,
    );
  });

  test('Text binding after element', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p>A</p>{{ x }}`;
    render(template, container, {x: 'B'});
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p>A</p>B`);
  });

  test('Text binding after element x 2', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p>A</p>{{ x }}{{ y }}`;
    render(template, container, {x: 'B', y: 'C'});
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p>A</p>BC`);
  });

  test('Text bindings before and after element', () => {
    const template = document.createElement('template');
    template.innerHTML = `<div>{{ a }}<p>{{ b }}</p>{{ c }}</div>`;
    render(template, container, {a: 'A', b: 'B', c: 'C'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<div>A<p>B</p>C</div>`,
    );
  });

  test('Attribute binding', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p class="{{ x }}"></p>`;
    render(template, container, {x: 'foo'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p class="foo"></p>`,
    );
  });

  test('Attribute with binding-like separator', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p foo="\\{{ x \\}}" bar="{{ x }} \\{{ y \\}}"></p>`;
    render(template, container, {x: 'foo'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p foo="{{ x }}" bar="foo {{ y }}"></p>`,
    );
  });

  test('Multiple attribute bindings', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p class="A {{ b }} C {{ d }}"></p>`;
    render(template, container, {b: 'B', d: 'D'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p class="A B C D"></p>`,
    );
  });

  test('Multiple attribute bindings inside a repeat', () => {
    const template = document.createElement('template');
    template.innerHTML = `<template type="repeat" repeat="{{ [1, 2] }}"><p foo="{{ x }} : {{ y }}"></p></template>`;
    render(template, container, {x: 'X', y: 'Y'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p foo="X : Y"></p><p foo="X : Y"></p>`,
    );
  });

  test('Multiple attribute bindings inside an if', () => {
    const template = document.createElement('template');
    template.innerHTML = `<template type="if" if="{{ true }}"><p foo="{{ x }} : {{ y }}"></p></template>`;
    render(template, container, {x: 'X', y: 'Y'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p foo="X : Y"></p>`,
    );
  });

  test('Property binding', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p .class-name="{{ x }}">`;
    render(template, container, {x: 'foo'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p class="foo"></p>`,
    );
  });

  test('Boolean attribute binding', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p ?disabled="{{ x }}">`;
    render(template, container, {x: false});
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p></p>`);

    render(template, container, {x: true});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p disabled=""></p>`,
    );
  });

  test('Event binding', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p @click="{{ handleClick }}">`;
    let lastEvent: Event | undefined = undefined;
    render(template, container, {
      handleClick: (e: Event) => {
        lastEvent = e;
      },
    });
    const p = container.querySelector('p')!;
    p.click();
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p></p>`);
    assert.instanceOf(lastEvent, Event);
  });

  test('Event binding w/ dashed names', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p @foo--bar="{{ handleClick }}">`;
    let lastEvent: Event | undefined = undefined;
    render(template, container, {
      handleClick: (e: Event) => {
        lastEvent = e;
      },
    });
    const p = container.querySelector('p')!;
    p.dispatchEvent(new Event('foo-bar'));
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p></p>`);
    assert.instanceOf(lastEvent, Event);
  });

  test('Event binding w/ camelCase names', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p @foo-bar="{{ handleClick }}">`;
    let lastEvent: Event | undefined = undefined;
    render(template, container, {
      handleClick: (e: Event) => {
        lastEvent = e;
      },
    });
    const p = container.querySelector('p')!;
    p.dispatchEvent(new Event('fooBar'));
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p></p>`);
    assert.instanceOf(lastEvent, Event);
  });

  test('if template, true', () => {
    const template = document.createElement('template');
    template.innerHTML = `<template type="if" if="{{true}}">{{s}}</template>`;
    render(template, container, {s: 'Hello'});
    assert.equal(stripExpressionMarkers(container.innerHTML), `Hello`);
  });

  test('if template, false', () => {
    const template = document.createElement('template');
    template.innerHTML = `<template type="if" if="{{c}}">{{s}}</template>`;
    render(template, container, {c: false, s: 'Hello'});
    assert.equal(stripExpressionMarkers(container.innerHTML), ``);
  });

  test('repeat template', () => {
    const template = document.createElement('template');
    template.innerHTML = `<template type="repeat" repeat="{{ items }}"><p>{{ item }}{{ x }}</p></template>`;
    render(template, container, {items: [4, 5, 6], x: 'X'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p>4X</p><p>5X</p><p>6X</p>`,
    );
  });

  test('nullable model access', function () {
    const template = document.createElement('template');
    template.innerHTML = `{{nullable.missing.property || 'none'}}`;
    render(template, container, {nullable: null});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `none`,
      'with null model property',
    );
    render(template, container, {nullable: {missing: {property: 'something'}}});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `something`,
      'with nonnull model property',
    );
  });

  test('named blocks with fallback', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p>A</p><template name="B">{{ b }}</template><template name="C">C</template>`;

    const templateFn = prepareTemplate(template);
    litRender(templateFn({b: 'B'}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p>A</p>BC`);
  });

  test('named blocks with provided renderer', () => {
    const bTemplate = document.createElement('template');
    bTemplate.innerHTML = `<p>{{ b }}</p>`;
    const bTemplateFn = prepareTemplate(bTemplate);

    const template = document.createElement('template');
    template.innerHTML = `<p>A</p><template name="B">{{ b }}</template><template name="C">C</template>`;

    const templateFn = prepareTemplate(template, undefined, {
      B: (model) => {
        return bTemplateFn(model);
      },
    });
    litRender(templateFn({b: 'B'}), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p>A</p><p>B</p>C`,
    );
  });

  test('named template calls', () => {
    const bTemplate = document.createElement('template');
    bTemplate.innerHTML = `<p>{{ b }}</p>`;

    const template = document.createElement('template');
    template.innerHTML = `<p>A</p><template call="B" data="{{ {'b': 'X'} }}"></template><template call="C"></template>`;

    const templateFn = prepareTemplate(template, undefined, {
      B: (model, handlers, renderers) => {
        return evaluateTemplate(bTemplate, model, handlers, renderers);
      },
    });

    litRender(templateFn({b: 'B'}), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p>A</p><p>X</p>`,
    );
  });

  test('referenced template calls', () => {
    const bTemplate = document.createElement('template');
    bTemplate.innerHTML = `<p>{{ b }}</p>`;
    const bRenderer: Renderer = (model, handlers, renderers) =>
      evaluateTemplate(bTemplate, model, handlers, renderers);

    const template = document.createElement('template');
    template.innerHTML = `<p>A</p><template call="{{ bTemplate }}" data="{{ {'b': 'X'} }}"></template><template call="C"></template>`;

    const templateFn = prepareTemplate(
      template,
      undefined,
      undefined,
      undefined,
    );

    litRender(templateFn({bTemplate: bRenderer}), container);

    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p>A</p><p>X</p>`,
    );
  });

  test('implicit super template call', () => {
    const superTemplate = document.createElement('template');
    superTemplate.innerHTML = `<p>A</p><template name="B">B</template><template name="C">C</template>`;

    const subTemplate = document.createElement('template');
    subTemplate.innerHTML = `<template name="C">Z</template>`;

    const subTemplateFn = prepareTemplate(
      subTemplate,
      undefined,
      undefined,
      superTemplate,
    );
    litRender(subTemplateFn({}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p>A</p>BZ`);
  });

  test('explicit super template call', () => {
    const superTemplate = document.createElement('template');
    superTemplate.innerHTML = `<p>A</p><template name="B">B</template><template name="C">C</template>`;

    const subTemplate = document.createElement('template');
    subTemplate.innerHTML = `1<template name="super"><template name="C">Z</template></template>2`;

    const subTemplateFn = prepareTemplate(
      subTemplate,
      undefined,
      undefined,
      superTemplate,
    );
    litRender(subTemplateFn({}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `1<p>A</p>BZ2`);
  });

  test('block inside if', () => {
    const superTemplate = document.createElement('template');
    superTemplate.innerHTML = `<template type="if" if="{{ true }}"><template name="A"></template></template>`;

    const subTemplate = document.createElement('template');
    subTemplate.innerHTML = `<template name="A">{{ a }}</template>`;

    const subTemplateFn = prepareTemplate(
      subTemplate,
      undefined,
      undefined,
      superTemplate,
    );
    litRender(subTemplateFn({a: 'A'}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `A`);
  });

  test('nested blocks, override inner', () => {
    const superTemplate = document.createElement('template');
    superTemplate.innerHTML = `<template name="A">A<template name="B">B</template>C</template>`;

    const subTemplate = document.createElement('template');
    subTemplate.innerHTML = `<template name="B">{{ b }}</template>`;

    const subTemplateFn = prepareTemplate(
      subTemplate,
      undefined,
      undefined,
      superTemplate,
    );
    litRender(subTemplateFn({b: 'Z'}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `AZC`);
  });

  // TODO: We need a way to render the super _block_ not just the super
  // template. See how Jinja does this:
  // https://jinja.palletsprojects.com/en/2.11.x/templates/#super-blocks
  test('nested blocks, override outer', () => {
    const superTemplate = document.createElement('template');
    superTemplate.innerHTML = `<template name="A">A<template name="B">B</template>C</template>`;

    const subTemplate = document.createElement('template');
    subTemplate.innerHTML = `<template name="A">{{ a }}</template>`;

    const subTemplateFn = prepareTemplate(
      subTemplate,
      undefined,
      undefined,
      superTemplate,
    );
    litRender(subTemplateFn({a: 'Z'}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `Z`);
  });
});

const stripExpressionMarkers = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->|lit\$[0-9]+\$/g, '');
