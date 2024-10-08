# Heximal Templates

Heximal Templates is a fast and flexible HTML template system, where you write
dynamic templates using real HTML `<template>` tags:

```html
<template id="my-template">
  <h1>Hello {{ name }}</h1>
</template>
```

Part of the [Heximal](https://www.npmjs.com/package/heximal) project.

## Overview

Heximal Templates use HTML
[`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
tags to define templates,
[lit-html](https://lit.dev/docs/libraries/standalone-templates/) for the
underlying template rendering, and [Heximal
Expressions](https://www.npmjs.com/package/jexpr) for binding expressions.

Heximal Templates is based on the idea that a template defines a function from
data to DOM, so it transforms `<template>` elements into lit-html render
functions. Control flow, template composition, and extensibility are built on
top of function composition.

This approach leads to a low-cost for features like conditionals and repeating,
which are just `<template>`s themselves:

```html
<template id="my-template">
  <h2>Messages</h2>

  <template type="if" if="{{ important }}">
    <p class="important">These messages are important</p>
  </template>

  <template type="repeat" repeat="{{ messages }}">
    <p>{{ item.text }}</p>
  </template>
</template>
```

`<template type="if">` and `<template type="repeat">` are not hard-coded into
the core of Heximal Templates. Instead they are just default _template handlers_
that are matched against the `"type"` attribute. Users can implement their own
template handlers just like `if` and `repeat`.

### A low-level template toolkit

Heximal Templates does not currently automatically enable templates within HTML.
JavaScript is required to find and make `<template>` elements available as
renderable lit-html templates, and requries lit-html `render()` calls to render
them. Heximal Templates also does not automatically wire up super templates, or
sub tempalte calls.

The low-level nature of Heximal Templates is intended to allow frameworks and
components to define how and what data, control flow handlers, and super- and
sub-templates are available.

### Use cases

Heximal Templates is very useful for custom elements that want to allow custom
rendering or user-extensibility.

Consider the example of an `<npm-packages>` element that fetches a list of npm
packages and renders it, letting users override a default shadow-DOM template.
The element may accept a template as a child and render it with Heximal
Templates and the package data:

```html
<script type="module" src="/npm-packages.js"></script>
<npm-packages query="router">
  <template>
    <h1>{{ package.name }}</h1>
    <h2>{{ package.description }}</h2>
    <p>Version: {{ package.version }}</p>
  </template>
</npm-packages>
```

When Heximal Templates processes a template, it creates a lit-html template
function.

To render this template:

```html
<template id="my-template">
  <h1>Hello {{ name }}</h1>
</template>
```

Pass it to `prepareTemplate()` and use lit-html to render the returned function:

```ts
import {prepareTemplate} from '@heximal/templates';
import {render} from 'lit';

const templateElement = document.querySelector('#my-template');

// Returns a lit-html template function that accepts data and
// returns a renderable TemplateResult
const myTemplate = prepareTemplate(templateElement);

render(myTemplate({name: 'World'}), document.body);
```

`prepareTemplate()` takes options for _template handlers_ (to handle `<template
type=`>), _renderers_ (to handle `<template name=>`), and a super template.

_Note: this API is known to have some flaws and will definitely change!_

## Features

### Binding Expressions

Expressions are delimted by double braces - `{{ }}`. They can appear in
attribute values and as text/children of elements.

Expressions are interpreted by [`jexpr`](https://www.npmjs.com/package/jexpr),
which provides a fast and expressive expression evaluator and supports a subset
of JavaScript expressions.

Expressions can include variables, property access, arithmetic, function and
method calls, lists, maps and filters.

```html
<template>
  <p>What's the answer to life, the universe and everything?</p>
  <p>{{ 6 * 7 }}</p>
</template>
```

See the [jexpr README](https://www.npmjs.com/package/jexpr) for more expression
features.

### Property, event, and boolean attribute bindings

Heximal Templates uses lit-html's syntax for binding to properties, events, and
boolean attributes.

| Binding Type      | Prefix | Example                 |
| ----------------- | ------ | ----------------------- |
| Attribute         | none   | `class=${c}`            |
| Property          | `.`    | `.foo=${bar}`           |
| Event             | `@`    | `@click=${handleClick}` |
| Boolean Attribute | `?`    | `?disabled=${disabled}` |

### Control flow

Template control flow is based on nested `<template>` elements with a `type`
attribute. Heximal Templates comes with two built-in template handlers, `if` and
`repeat`

#### if templates

For conditional rendering, use `type="if"` and an `if` attribute.

```html
<template id="my-template">
  <template type="if" if="{{ condition }}">
    Render when <code>condition</code> is true.
  </template>
</template>
```

#### repeat templates

For repeated templates use `type="repeat"` and a `repeat` attribute. The repeat
handler automatically adds an `item` loop variable to the template's scope.

```html
<template id="my-template">
  <ul>
    <template type="repeat" repeat="{{ items }}">
      <li>{{ item }}</li>
    </template>
  </ul>
</template>
```

### Template calls

A template can call another template, either by name or by referece.

The call is written as a `<template>` with `call` and optionally `data`
attributes:

```html
<template call="..." data="..."></template>
```

#### Calling by name

If the `call` attribute is a plain string, the sub template is looked up in the
renderers configuration.

```html
<template id="main">
  This the main template
  <template call="A" data="{{ {'foo': 'abc'} }}"></template>
</template>

<template id="a">
  <p>foo is {{ foo }}</p>
</template>
```

JavaScript is required to wire this together:

```ts
const main = document.querySelector('#main');
const templateA = document.querySelector('#a');

const mainTemplate = prepareTemplate(main, undefined, {
  // A sub-template is a Renderer:
  A: (model, handlers, renderers) => {
    evaluateTemplate(templateA, model, handlers, renderers);
  },
});
```

#### Calling by reference

If the `call` attribute is an expression, then the sub-template is looked up
from the calling template's model by the `call` reference:

```html
<template id="main">
  This the main template
  <template call="{{ a.b }}" data="{{ {'foo': 'abc'} }}"></template>
</template>

<template id="a">
  <p>foo is {{ foo }}</p>
</template>
```

JavaScript:

```ts
const main = document.querySelector('#main');
const templateA = document.querySelector('#a');

const mainTemplate = prepareTemplate(main, undefined, undefined);

const aRenderer = (model, handlers, renderers) =>
  evaluateTemplate(templateA, model, handlers, renderers);

render(mainTemplate({a: {b: aRenderer}}), container);
```

### Named blocks

A template with a `name` attribute is a "named block". A named block is similar
to a template call with fallback content that can be overriden by renderers.

Named blocks are usually used with inheritance, where the sub-template can
override the named blocks of the base template. They can also be used outside of
inheritance by configuring the main template with renderers for the blocks that
should be overridden.

Besides fallback content, a difference between named blocks is template calls is
that named blocks do not have a data attribute. They inherit the scope of the
callsite.

### Inheritance

Heximal Templates supports template inheritance similar to how the popular
[Jinja](https://jinja.palletsprojects.com/) library does.

Because Heximal Templates does not automatically find templates in the DOM, even
for simple rendering, specifying inheritance is done entirely out-of-band. Set
up code must find the template and it's super template, then pass both to
`prepareTemplate()`.

```html
<template id="base-template">
  This the base template, that defines a "block"
  <template name="A"> This is a block with fallback content. </template>
</template>

<template id="my-template">
  <template name="A">
    This is a sub-template providing new content for a block.
  </template>
</template>
```

```javascript
import {render} from 'lit-html';
import {prepareTemplate} from '@heximal/templates';

const baseEl = document.querySelector('#base-template');
const templateEl = document.querySelector('#my-template');

const myTemplate = prepareTemplate(
  templateEl,
  undefined, // use default handlers
  undefined, // use default (empty) renderers
  baseEl,
); // super template

// Note: the above API isn't great. It'll change

// Use lit-html to render:
render(myTemplate(data), container);
```

Templates can explicitly include a call to the super template with `<template
name="super">`. This lets the sub-template render content before and after the
super template:

```html
<template id="my-template">
  This is before the super-template
  <template name="super">
    <template name="A">
      This is a sub-template providing new content for a block.
    </template>
  </template>
  This is after the super-template
</template>
```

### Extensibility

Most template systems have built-in control-flow constructs like 'if' and
'repeat'. Heximal Templates includes these too, but they are implemented as
extensions called template handlers, just like user-provided handlers.

Handlers are functions that implement this signature:

```typescript
function handler<Model>(
  template: HTMLTemplateElement,
  model: Model,
  handlers: Handlers,
  renderers: renderers,
): TemplateResult | Directive | string | number | (string | number)[];
```

They can return any lit-html rendereable object, including strings, numbers,
arrays, TemplateResults, or directives.

Handlers are passed to `prepareTemplate()`:

```javascript
import {prepareTemplate, evaluateTemplate} from '@heximal/templates';

const myTemplate = prepareTemplate(element, {
  // Renders a template twice
  echo: (template, model, handlers, renderers) => {
    return [
      evaluateTemplate(template, model, handlers, renderers),
      evaluateTemplate(template, model, handlers, renderers),
    ];
  },
});
```

Handlers are referenced inside templates via the `type` attribute:

```html
<template>
  <h1>Do I hear an echo?</h1>
  <template type="echo"> Yes, I hear an echo! </template>
</template>
```

You can think of this very much like `<template type=` is syntax for a function
call. Here's the entire implementation of the 'if' handler:

```javascript
handlers: {
  'if': (template, model, handlers, renderers) => {
    const ifAttribute = template.getAttribute('if');
    if (ifAttribute !== null && getSingleValue(ifAttribute, model)) {
      return evaluateTemplate(template, model, handlers, renderers);
    }
  return undefined;
  },
},
```

Note: `getSingleValue()` evaluates an expression against a model. It's provided
by the Heximal Templates library.

## Acknowledgements

Heximal Templates was renamed and moved from
[Stampino](https://github.com/justinfagnani/stampino).
