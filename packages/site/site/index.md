---
layout: layouts/base.njk
eleventyNavigation:
  key: Home
  order: 1
---

<div class="banner">
  <h1>Heximal</h1>
  <h2>HTML from the <em><code>&lt;future&gt;</code></em></h2>
</div>

<div class="links">
  <a href="https://github.com/elematic/heximal/"><img src="/github-mark.svg"> View on GitHub</a>
</div>

## What is Heximal?

Heximal enhances HTML to be more dynamic, interactive, and composable. It's like
HTML from the _future_, designed to make building rich, data-driven documents
and applications easier than ever.

- 💥 **Reactive Documents**: Define, use, and update signal-backed variables
  directly in HTML.
- 🖨️ **Enhanced Templates**: Use data-binding and control flow with the
  `<template>` element.
- 🍱 **Declarative Components**: Define reusable components in pure HTML.
- 🔣 **Rich Expressions**: Access and transform data, call APIs, with rich inline
  expressions.
- 🏗️ **Utility Elements**: Format numbers, fetch data, include HTML, and more.

Heximal is standards-based and works seamlessly with modern HTML. It runs
anywhere HTML does, with no build step required.

## Why Heximal?

While HTML is already dynamic, much of that dynamism requires JavaScript and the
DOM APIs to unlock. HTML has been gaining some great declarative interaction
features like [invoker
commands](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API),
but a vast number of common interaction patterns require writing script. Heximal
makes HTML more _declaratively_ dynamic, similar to modern client-side web
frameworks.

Many projects have also attempted to make HTML more declaratively dynamic, but
they tend to work by adding special, relatively high-level, attributes. Heximal
is taking a different approach of defining new composable primitives: reactive
state, templates, data binding, expressions, and component definitions.

The goal is to enable a very flexible and powerful system that enables the same
kind of use cases, and much more, by combining those primitives in many
different ways.

Heximal tries to solve many common use cases and feature requests against HTML
elegantly with these primitives, such as:

- Macros: Define common chunks of HTML and reuses them through out the document.
- Data-driven documents: Put bindings directly in markup to interpolate data.
- Sprinkles of interactivity: On mostly static pages it's simple to add a little
- bit of interactivity, just where needed, without rearchitecting the page.
  right in markup.
- Declarative I/O, AJAX, and HTML includes: HTML can already include images,
  iframes, and CSS declaratively. Heximal adds declarative fetch and HTML
  includes.
- Composition: Define components and templates in HTML for reuse, instead of
  copy-and-pasting markup.
- Formatting and l18n: Locale-aware number, date, and time formatting.

Heximal's philosophy is to utilize the web platform as much as possible.
Heximal's extensions are coherent with and extend the platform APIs, making them
available from markup. Component are just web components; templates use the
`<template>` tag; events are native Events; etc.

By defining features this way, Heximal hopes to inform upcoming HTML and DOM
standards. Ideally, Heximal is made obsolete by future versions of the web
platform.

## Features at a Glance

### Declarative State: Variables, Outputs, and Scopes

Heximal starts with a way to define reactive state in markup. This state can
then be accessed from all the other features like outputs, and expressions in
templates, and components. Because the state is backed by
[Signals](https://github.com/tc39/proposal-signals), when the state updates the
use-sites update too.

#### Variables

Add variables to HTML with the `<h-var>` element:

```html
<h-var name="name" value="World"></h-var>
```

These variables can then be referenced in expressions.

#### Outputs

The `<h-out>` element renders expressions to the document:

```html
<h1>Hello <h-out expr="name"></h-out></h1>
```

#### Scopes

Variables are lexically scoped. New scopes can be defined with `<h-scope>`:

```html
<h-var name="name" value="World"></h-var>

<h-scope>
  <h-var name="name" value="Heximal"></h-var>
  <p>
    <!-- Here `name` is 'Heximal' -->
    Inner name is: <h-out expr="name"></h-out>
  </p>
</h-scope>

<p>
  <!-- Here `name` is 'World' -->
  Outer name is: <h-out expr="name"></h-out>
</p>
```

In addition to variables declared in the document, scopes have access to `window`, `document, and a couple of Heximal-specific properties:

- `host`: The element that an expression is attached to.
- `$`: A function that queries the current root node (a Document or ShadowRoot) with
  `querySelector()`.

### Reactivity

Variables are backed by signals, so when they change, the document automatically
updates:

{% raw %}

```html
<h-var name="name" value="World"></h-var>
<h1>Hello <h-out expr="name"></h-out></h1>

<template h-auto>
  <button @click="{{ () => name = 'Heximal' }}">Set Name</button>
</template>
```

{% endraw %}

In this example, when the button is clicked document will display `<h1>Hello
Heximal</h1>`. See the next section for information on templates and bindings.

### Templates

Heximal Templates enhance the HTML `<template>` element with bindings,
expressions, and control flow like `if` and `repeat`.

{% raw %}

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

{% endraw %}

Templates can be used as a part of custom elements, standalone, or as auto
templates that automatically render to the document.

#### Bindings

Heximal templates support data binding with expressions marked by the separators
{% raw %}`{{ ... }}`{% endraw %}.

- **Attributes** You can use one or multiple expressions in an attribute value:

  {% raw %}

  ```html
  <img src="{{ data.avatar_url }}" />
  ```

  {% endraw %}

- **Boolean Attributes** You can toggle an attribute based on a boolean value with a `?` prefix on the attribute name:

  {% raw %}

  ```html
  <input type="checkbox" ?checked="{{ data.isAwesome }}" />
  ```

  {% endraw %}

- **Properties** You can bind to property values by prefixing an attribute name
  with `.`:

  {% raw %}

  ```html
  <input .value="{{ data.name }}" />
  ```

  {% endraw %}

- **Event Listeners** You can add an event listener by prefixing an attribute
  name with `@`. For event listeners, you will usually want to use a function
  and assignment in your expression:

  {% raw %}

  ```html
  <input
    @change="{{ () => data.name = host.value }}"
    .value="{{ data.name }}"
  />
  ```

  {% endraw %}

#### Auto-templates

Auto templates let you use template binding syntax and control flow anywhere in
your page. They are `<template>` elements that are immediately rendered in-place
without being part of a component or called from another template.

Auto templates are declared with the `h-auto` attribute.

{% raw %}

```html
<body>
  <template h-auto>
    <h1>Hello {{ name }}</h1>
  </template>
</body>
```

{% endraw %}

### Components

HTML already has components - [web
components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) -
so Heximal doesn't need to add them. You can import existing components, say
from npm via a CDN like [jsdelivr.com](https://www.jsdelivr.com/). You can also
write your own web components in script using the web APIs directly, or with a
helper library like [Lit](https://lit.dev/) (which Heximal uses internally).

Once you have a component, you can use it in your document, and bind to it
within Heximal templates:

{% raw %}

```html
<cool-component .someProp="{{ data.foo }}"></cool-component>
```

{% endraw %}

What Heximal adds to this is the ability to define new reusable or web
components declaratively, right in HTML, with the `<h-define-element>` element.

{% raw %}

```html
<h-define-element name="simple-greeter">
  <h-prop name="name"></h-prop>

  <style type="adopted-css">
    :host {
      color: blue;
    }
  </style>

  <template>
    <h1>Hello {{ name }}!</h1>
  </template>
</h-define-element>
```

{% endraw %}

These elements can then be used anywhere in the HTML document.

```html
<simple-greeter name="World"></simple-greeter>
```

### Built-in Heximal Elements

#### Utilities

- `<h-include>`: Include external HTML files.
- `<h-fetch>`: Fetch and display data.
- _[TODO]_ `<h-import>`: Import HTML modules.

#### Display

- `<h-num>`: Format numbers with `Intl.NumberFormat`.
- _[TODO]_ `<h-datetime>`: Format dates and times with `Intl.DateTimeFormat`
- _[TODO]_ `<h-relative-time>`: Format dates and times with `Intl.RelativeTimeFormat`

## Project Status

Heximal is a work in progress. It is insecure, unstable, and will have frequent
breaking changes. Please use accordingly.

### 🤝 Seeking Collaborators!

The best way to help Heximal reach a stable release is to get involved. If you
like the Heximal vision, please drop by the [Heximal GitHub
repo](https://github.com/elematic/heximal/) and file issues or submit PRs.

### ⚠️ Security

Because of Heximal expressions use a custom evaluator, they allow writing code
in markup that is not controlled by Content Security Policy (CSP). This makes
using Heximal in any context with user-generated or user-controlled content
currently extremely unsafe. Sanitizers must be configured to only allow safe
tags, not disallow tags, since Heximal introduces new script-like tags like
`<h-out>`, `h-define-element>`, `<template h-auto>`, etc.

It is possible to make Heximal secure. Work is planned to address security
issues, such as expression-aware HTML sanitizers, safer expression evaluation,
disallowing "gadgets" by default, supporting nonces on script-like elements, and
new standards proposals. Please follow the
[Security](https://github.com/elematic/heximal/issues/1) issue for more
information and updates.

### 🗺️ Roadmap

Some of the planned improvements and additions to Heximal include:

- Documentation
- HTML imports (HTML modules)
- Placeholder support for `<h-out>`, etc. (for progressive enhancement / SSR)
- `<h-bind>` for attribute binding outside of templates
- Additional formatting elements
- Scoped template extensions
- Consistent expression denotation
- Security audit and sanitization
- Script integration: access scopes from scripts, scripts from expressions
- Blocks (components that can exchange state) for computational notebooks
- Simplified template API
- CSS variable system with attractive default styles
- Published bundles

## Get Started

Install Heximal via npm:

```bash
npm install heximal
```

Import it into your page:

```html
<script type="module" src="/path/to/node_modules/heximal/index.js"></script>
```

The [GitHub repo](https://github.com/elematic/heximal/) has somewhat more detailed information until full documentation is available.

## Relevant Standards Proposals

Heximal is in part an effort to prototype and inform several web standards
proposals, including:

- [HTML Modules](https://github.com/WICG/webcomponents/issues/645)
- [DOM Parts](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/DOM-Parts.md)
- [Template Instantiation](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
- [Declarative Custom Elements](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)
- [HTML includes](https://github.com/whatwg/html/issues/2791)
- [HTMLScriptElement.exports](https://github.com/whatwg/html/issues/7367)
- [Allow importing and exporting from inline module scripts](https://github.com/whatwg/html/issues/11202)
- [Declarative CSS Module Scripts](https://github.com/WICG/webcomponents/issues/939)
- [Enabling secure script-like custom elements](https://github.com/WICG/webcomponents/issues/979)
- [Tree-aware task scheduling](https://github.com/WICG/webcomponents/issues/1055)

## Inspirations

- [Polymer](https://polymer-library.polymer-project.org/2.0/docs/devguide/feature-overview)
- [Stampino](https://github.com/justinfagnani/stampino) (the progenitor of Heximal)
- [Tangle](https://worrydream.com/Tangle/)
- [Curvenote article](https://github.com/curvenote/article)
- [HTMX](https://htmx.org/)
- [Alpine.js](https://alpinejs.dev/)
- [Observable](https://github.com/observablehq/framework)
- [Block Protocol](https://blockprotocol.org/)
