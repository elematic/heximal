# stampino

stampino is a fast and extremely powerful DOM template system based on incremental-dom and polymer-expressions.

## Overview

*stampino* use HTML5 `<template>` tags to define templates, `incremental-dom` to efficiently render them, and `polymer-expressions` for powerful binding expressions.

stampino is based on the idea that a template defines a function from data to DOM. From there it builds powerful features like template composition and extensibility on top of function composition.

This approach leads to a low-cost for features like conditionals and repeating, while at the same time not hardcoding them into the core. Users can define their own template handlers just like if and repeat.

### Simple

The core of stampino is less than 200 lines of code.

stampino keeps things simple by relying on standard HTML `<template>` tags, using `incremental-dom` and `polymer-expressions`, only supporting one-way data-binding, and letting the developers be responsible for when to re-render. stampino doesn't concern itself with custom elements, DOM and style encapsulation, or any of the other amazing features of Web Components, because that's what Web Components are for! It's great for implementing the shadow DOM rendering for custom elements.

By using HTML `<template>` tags, stampino templates can be defined right inline with your HTML. Browsers will not render template contents, run script, or apply CSS.

```html
<template id="my-template">
  This is a template.
</template>
```

stampino doesn't find and render templates automatically, because it's so easy to do with standard DOM APIs:

```javascript
import * as stampino from 'stampino';

let template = document.querySelector('#my-template');
let container = document.querySelector('#container');
let model = getModel();

// initial render
stampino.render(template, container, model);
// change data
model = getUpdatedModel(model);
// re-render, with fast incremental DOM update
stampino.render(template, container, model);
```

### Fast

stampino uses increment-dom to update DOM in place when re-rendered with new data. incremental-dom only updates the parts of the DOM that need updating, much like virtual-dom approaches, but without extra trees of virtual DOM nodes in memory.

stampino "interprets" a `<template>` tag by walking its content and calling incremental-dom APIs to mutate the DOM. This is both fast and flexible. If the template is modified, new calls to `render` will pick up the changes.

In the future, it will be very easy to transform a template into a list of incremental-dom instructions for even faster rendering, or pre-compile a template directly into code that calls incremental-dom for fastest rendering.

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

`polymer-expressions` provides a fast and expressive expression evaluator, which is a subset of JavaScript expressions. Like incremental-dom, `polymer-expressions` has been engineered to reduce memory allocations and garbage collection.

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
