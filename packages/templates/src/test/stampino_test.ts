import {assert} from '@esm-bundle/chai';
import {render as litRender} from 'lit-html';
import {prepareTemplate, render} from '../stampino.js';

suite('lit-html', () => {
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

  test('Text binding in element', () => {
    const template = document.createElement('template');
    template.innerHTML = `<h1>Hello {{ name.toUpperCase() }}</h1>`;
    render(template, container, {name: 'World'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<h1>Hello WORLD</h1>`
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

  test('Attribute binding', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p class="{{ x }}">`;
    render(template, container, {x: 'foo'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p class="foo"></p>`
    );
  });

  test('Multiple attribute bindings', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p class="A {{ b }} C {{ d }}">`;
    render(template, container, {b: 'B', d: 'D'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p class="A B C D"></p>`
    );
  });

  test('Property binding', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p .class-name="{{ x }}">`;
    render(template, container, {x: 'foo'});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p class="foo"></p>`
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
      `<p disabled=""></p>`
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
    template.innerHTML = `<template type="repeat" repeat="{{items}}"><p>{{item}}</p></template>`;
    render(template, container, {items: [4, 5, 6]});
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      `<p>4</p><p>5</p><p>6</p>`
    );
  });

  test('named blocks with fallback', () => {
    const template = document.createElement('template');
    template.innerHTML = `<p>A</p><template name="B">B</template><template name="C">C</template>`;
    template.id = 'sup';

    const templateFn = prepareTemplate(
      template,
      undefined,
      undefined,
      template
    );
    litRender(templateFn({}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p>A</p>BC`);
  });

  test('implicit super template call', () => {
    const superTemplate = document.createElement('template');
    superTemplate.innerHTML = `<p>A</p><template name="B">B</template><template name="C">C</template>`;
    superTemplate.id = 'sup';
    const subTemplate = document.createElement('template');
    subTemplate.innerHTML = `<template name="C">Z</template>`;
    subTemplate.id = 'sub';

    const subTemplateFn = prepareTemplate(
      subTemplate,
      undefined,
      undefined,
      superTemplate
    );
    litRender(subTemplateFn({}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `<p>A</p>BZ`);
  });

  test('explicit super template call', () => {
    const superTemplate = document.createElement('template');
    superTemplate.innerHTML = `<p>A</p><template name="B">B</template><template name="C">C</template>`;
    superTemplate.id = 'sup';
    const subTemplate = document.createElement('template');
    subTemplate.innerHTML = `1<template name="super"><template name="C">Z</template></template>2`;
    subTemplate.id = 'sub';

    const subTemplateFn = prepareTemplate(
      subTemplate,
      undefined,
      undefined,
      superTemplate
    );
    litRender(subTemplateFn({}), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), `1<p>A</p>BZ2`);
  });
});

export const stripExpressionComments = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->/g, '');

export const stripExpressionMarkers = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->|lit\$[0-9]+\$/g, '');
