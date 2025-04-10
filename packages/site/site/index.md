---
layout: layouts/base.njk
title: Home
eleventyNavigation:
  key: Home
  order: 1
---

<div class="banner">

# Heximal
## HTML from the *<code>&lt;future&gt;</code>*

</div>

## What is Heximal?

Heximal enhances HTML to be more dynamic, interactive, and composable. It's like
HTML from the _future_, designed to make building rich, data-driven documents
and applications easier than ever.

- 💥 **Reactive Documents**: Define and use signal-backed variables directly in
  HTML.
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
but a vast number of common interaction patterns require writing script.

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
- Sprinkles of interactivity: Handle events, update state, synchronize DOM,
  right in markup.
- Declarative I/O and AJAX: Define fetch calls in markup.
- Composition: Define components, import and include HTML.
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

#### Variables

Heximal adds the ability to define lexically-scoped variables to HTML with the
`<h-var>` element:

```html
<h-var name="name" value="World"></h-var>
```

Variables can then be referenced in expressions.

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

### Reactivity

Variables are backed by signals, so when they change, the document automatically
updates:

```js
const nameVariable = document.querySelector('h-var[name="name"]');
nameVariable.value = 'Heximal';
// Now the document will display <h1>Hello Heximal</h1>
```

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

Heximal allows you to define new reusable or web components declaratively in
HTML with the `<h-define-element>` element.

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
- *[TODO]* `<h-import>`: Import HTML modules.

#### Display

- `<h-num>`: Format numbers with `Intl.NumberFormat`.
- *[TODO]* `<h-datetime>`: Format dates and times with `Intl.DateTimeFormat`
- *[TODO]* `<h-relative-time>`: Format dates and times with `Intl.RelativeTimeFormat`

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
tags, not disallow tags, since Heximal introduces new  script-like tags like
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
- [Declarative CSS Module Scripts](https://github.com/WICG/webcomponents/issues/939)
- [Enabling secure script-like custom elements](https://github.com/WICG/webcomponents/issues/979)

## Inspirations

- [Polymer](https://polymer-library.polymer-project.org/2.0/docs/devguide/feature-overview)
- [Stampino](https://github.com/justinfagnani/stampino) (the progenitor of Heximal)
- [Tangle](https://worrydream.com/Tangle/)
- [Curvenote article](https://github.com/curvenote/article)
- [HTMX](https://htmx.org/)
- [Alpine.js](https://alpinejs.dev/)
- [Observable](https://github.com/observablehq/framework)
- [Block Protocol](https://blockprotocol.org/)
