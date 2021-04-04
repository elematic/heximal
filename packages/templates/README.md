# stampino

Stampino is a fast and extremely powerful HTML template system, where you write templates in real HTML `<template>` tags:

```html
<template id="my-template">
  <h1>Hello {{ name }}</h1>
</template>
```

## Overview

Stampino use HTML [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) tags to define templates, [lit-html](https://lit-html.polymer-project.org/) for the underlying template rendering, and [jexpr](https://www.npmjs.com/package/jexpr) for binding expressions.

Stampino is based on the idea that a template defines a function from data to DOM, so it transforms `<template>` elements into lit-html render functions. Control flow, emplate composition, and extensibility are built on top of function composition.

This approach leads to a low-cost for features like conditionals and repeating, which are just `<template>`s themselves:

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

`<template type="if">` and `<template type="repeat">` are not hard-coded into the core of Stampino. Instead they are just default _template handlers_ that are matched against the `"type"` attribute. Users can implement their own template handlers just like `if` and `repeat`.

### Use cases

Stampino is very useful for custom elements that want to allow custom rendering or user-extensibility.

Consider an example of an `<npm-packages>` element that fetchs a list of npm packages and renders it, but want to let users override the default rendering. The element can accept a template as a child and render it with Stampino and the package data:

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

When Stampino processes a template, it creates a lit-html template function.

To render this template:
```html
<template id="my-template">
  <h1>Hello {{ name }}</h1>
</template>
```

Pass it to `prepareTemplate()` and use lit-html to render the returned function:
```ts
import * as stampino from 'stampino';
import {render} from 'lit';

const templateElement = document.querySelector('#my-template');

// Returns a lit-html template function that accepts data and
// returns a renderable TemplateResult
const myTemplate = stampino.prepareTemplate(templateElement);

render(myTemplate({name: 'World'}), document.body);
```

`prepareTemplate()` takes options for _template handlers_ (to handle `<template type=`>), _renderers_ (to handle `<template name=>`), and a super template.

_Note: this API is known to have some flaws and will definitely change!_

## Features

### Binding Expressions

Expressions are delimted by double braces - `{{ }}`. They can appear in attribute values and as text/children of elements.

Expressions are interpreted by [`jexpr`](https://www.npmjs.com/package/jexpr), which provides a fast and expressive expression evaluator and supports a subset of JavaScript expressions.

Expressions can include variables, property access, arithmetic, function and method calls, lists, maps and filters.

```html
<template>
  <p>What's the answer to life, the universe and everything?</p>
  <p>{{ 6 * 7 }}</p>
</template>
```

See the [jexpr README](https://www.npmjs.com/package/jexpr) for more expression features.

### Control flow

Stampino control flow is based on nested `<template>` elements with a `type` attribute. Stampino comes with two built-in template handlers, `if` and `repeat`

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

For repeated templates use `type="repeat"` and a `repeat` attribute. The repeat handler automatically adds an `item` loop variable to the template's scope.

```html
<template id="my-template">
  <ul>
    <template type="repeat" repeat="{{ items }}">
      <li>{{ item }}</li>
    </template>
  </ul>
</template>
```

### Inheritance

Stampino support template inheritance similar to how the popular Jinja library does.

Because Stampino does not automatically find templates in the DOM, even for simple rendering, specifying inheritance is done entirely out-of-band. Set up code must find the template and it's super template, then pass both to `prepareTemplate()`.

```html
<template id="base-template">
  This the base template, that defines a "block"
  <template name="A">
    This is a block with fallback content.
  </template>
</template>

<template id="my-template">
  <template name="A">
    This is a sub-template providing new content for a block.
  </template>
</template>
```

```javascript
import {render} from 'lit-html';
import {prepareTemplate} from 'stampino';

const baseEl = document.querySelector('#base-template');
const templateEl = document.querySelector('#my-template');

const myTemplate = prepareTemplate(
  tempalteEl,
  undefined, // use default handlers
  undefined, // use default (empty) renderers
  baseEl); // super template

// Note: teh above API isn't great. It'll change

// Use lit-html to render:
render(myTemplate(data), container);
```

Templates can explicitly include a call to the super template with `<template name="super">`. This lets the sub-template render content before and after the super template:

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

Most template systems have built-in control-flow constructs like 'if' and 'repeat'. Stampino includes these too, but they are implemented as extensions called template handlers, just like user-provided handlers.

Handlers are functions that implement this signature:

```javascript
function(template, model, handlers, renderers)
```

They can return any lit-html rendereable object, including strings, numbers, arrays, TemplateResults, or directives.

Handlers are passed to `prepareTemplate()`:

```javascript
import {prepareTemplate, evaluateTemplate} from 'stampino';

const myTemplate = prepareTemplate(
  element,
  {
    // Renders a template twice
    'echo': (template, model, handlers, renderers) => {
      return [
        evaluateTemplate(template, model, handlers, renderers),
        evaluateTemplate(template, model, handlers, renderers)];
    },
  }
);
```

Handlers are referenced inside templates via the `type` attribute:

```html
<template>
  <h1>Do I head an echo?</h1>
  <template type="echo">
    Yes, I hear an echo!
  </template>
</template>
```

You can think of this very much like `<templates type=` is syntax for a function call. Here's the entire implementation of the 'if' handler:

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

Note: `getSingleValue()` evaluates an expression against a model. It's provided by the Stampino library.

## Status

Stampino is a side-project and development typically happens in bursts. Things are changing quickly, so be careful. If you find a problem or are intested in contributing please reach out in the issues.
