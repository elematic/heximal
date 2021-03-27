# stampino

Stampino is a fast and extremely powerful HTML template system, where you write templates in real HTML `<template>` tags:

```html
<template id="my-template">
  <h1>Hello {{ name }}</h1>
</template>
```

## Overview

Stampino use HTML [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) tags to define templates, [lit-html](https://lit-html.polymer-project.org/) for the inderlying template rendering, and [jexpr](https://www.npmjs.com/package/jexpr) for binding expressions.

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

`<template type="if">` and `<template type="repeat">` are not hard-coded into the core of Stampino. Instead they are registered _template handlers_ that are matched against the `"type"` attribute. Users can implement their own template handlers just like `if` and `repeat`.

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

When Stampino processes a template, it creates a lit-html template function:

```html
<template id="my-template">
  <h1>Hello {{ name }}</h1>
</template>
```

```ts
import * as stampino from 'stampino';
import {render} from 'lit';

const templateElement = document.querySelector('#my-template');

// Returns a lit-html template function that accepts data and
// returns a renderable TemplateResult
const myTemplate = stampino.prepareTemplate(templateElement);

render(myTemplate({name: 'World'}), document.body);
```

## Features

### Control flow

Stampino control flow is based on nested `<template>` elements:

```html
<template id="my-template">
</template>
```

### Simple

The core of Stampino (on top of lit-html and jexpr) is less than 200 lines of code.

Stampino keeps things simple by relying on standard HTML `<template>` tags, using `lit-html` and `jexpr`, only supporting one-way data-binding, and letting the developers be responsible for when to re-render.

Stampino doesn't concern itself with custom elements, DOM and style encapsulation, or any of the other amazing features of web components, because that's what web components are for! It's great for implementing the shadow DOM rendering for custom elements.

By using HTML `<template>` tags, Stampino templates can be defined right inline with your HTML. Browsers will not render template contents, run script, or apply CSS.

```html
<template id="my-template">
  This is a template.
</template>
```

Stampino doesn't find and render templates automatically, because it's so easy to do with standard DOM APIs:

```javascript
import * as stampino from 'stampino';

const template = document.querySelector('#my-template');
const container = document.querySelector('#container');
const model = getModel();

// initial render
stampino.render(template, container, model);
// change data
model = getUpdatedModel(model);
// re-render, with fast incremental DOM update
stampino.render(template, container, model);
```

### Fast

Stampino uses lit-html to update DOM in place when re-rendered with new data. lit-html only updates the parts of the DOM that need updating, much like virtual-dom approaches, but without extra trees of virtual DOM nodes in memory.

Stampino creates a lit-html template function from a `<template>` tag by walking its content and creating a lit-html "template part" for each expression.

### Powerful

#### Inheritance and Composition

stampino conceptually views a template as a function of the form:

```javascript
  renderFunction(model); // simplified, a little
```

`renderFunction` is then called from within an incremental-dom patch operation to update a particular container node. `renderFunction` can call, and be called by, other render functions. Using this basic concept stampino builds template inheritance and "blocks" or named holes that can be filled by sub-templates, similar to sub routines.

```html
<template id="base-template">
  This the base template, that defines a "block"
  <template name="A">
    This is a block with default content.
  </template>
</template>

<template id="my-template">
  <template name="A">
    This is a sub-template providing new content for a block.
  </template>
</template>
```

```javascript
let base = document.querySelector('#base-template');
let template = document.querySelector('#my-template');

stampino.render(template, container, model, {
  extends: base,
});
```

Templates can explicitly include their super template like this:

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

#### Binding Expressions

`jexpr` provides a fast and expressive expression evaluator, which is a subset of JavaScript expressions. Like incremental-dom, `jexpr` has been engineered to reduce memory allocations and garbage collection.

Expressions can include variables, property access, arithmetic, function and method calls, lists, maps and filters.

```html
<template>
  <p>What's the answer to life, the universe and everything?</p>
  <p>{{ 6 * 7 }}</p>
</template>
```

### Extensible

Most template systems have built-in control-flow constructs like 'if' and 'repeat'. `stampino` includes these too, but they are implemented as plugins called handlers, just like user-provided handlers.

Handlers implement the stampino render function signature:

```javascript
function(template, model, renderers, handlers)
```

They can call incremental-dom functions to render nodes, but usually they will perform some logic and call back into stampino's default `renderNode` with new data and/or a new template node to render.

Handlers are passed to the public render function:

```javascript
render(template, container, model, {
  handlers: {
    // renders a template twice
    'echo': function(template, model, renderers, handlers) {
      renderNode(template.content, model, renderers, handlers);
      renderNode(template.content, model, renderers, handlers);
    },
  }
});
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

You can think of this very much like a function call for templates, and because handlers are just stampino render functions, they are simple to write. Here's the entire implementation of the 'if' handler:

```javascript
handlers: {
  'if': function(template, model, renderers, handlers) {
    let ifAttribute = template.getAttribute('if');
    if (ifAttribute && getValue(ifAttribute, model)) {
      renderNode(template.content, model, renderers, handlers);
    }
  },
},
```

Note: `getValue()` evaluates an expression against a model. It's provided by the stampino library.
