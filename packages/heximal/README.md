# Heximal

Heximal enhances HTML to be more dynamic, interactive, composable, and
programmable. It's like HTML from the _future_.

Heximal extends HTML with:

- 🔬 Variables, lexical scoping, and signals
- 🖨️ Powerful `<template>`s with data-binding and control flow
- 🍱 Declarative component definitions
- 🔣 A rich expression language
- 🤹 Elements for authoring dynamic documents: `<h-var>`, `<h-out>`
- 🧩 Elements for composition and I/O: `<h-include>`, `<h-fetch>`
- 🌎 Elements for formatting and localization: `<h-num>` (more to come...)

Heximal is a standards-based enhancement to HTML. Heximal documents are
standard HTML, with new features provided by custom elements and
`<template>`. Heximal documents run anywhere that modern HTML does.

## Goals

Heximal aims to make HTML documents much more powerful and dynamic, bringing the
dream of DHTML to the modern web platform in a declarative, HTML-first
fashion, with features available directly in markup.

Some of Heximal's goals:

- Be a great declarative file format for rich, interactive, data-driven
  documents and applications
- Be usable from anywhere that HTML is: static HTML, server frameworks,
  JavaScript frameworks, etc.
- Prove out new dynamic HTML features for future standardization
- Push forward standards needed to make Heximal easier to build and use
  (eg, HTML modules, exposing script-tag exports, importing from inline scripts,
  etc.)

> [!WARNING]
> Parts of Heximal are incomplete and under active development, and may change
> frequently.

## Features

### Variables

Heximal adds the ability to define lexically-scoped variables to HTML with the
`<h-var>` element:

```html
<h-var name="name" value="World"></h-var>
```

Variables can then be referenced in expressions.

### Outputs

The `<h-out>` element renders expressions to the document:

```html
<h1>Hello <h-out expr="name"></h-out></h1>
```

### Signals

Variables are backed by signals, so when they change, the document automatically
updates:

```js
const nameVariable = document.querySelector('h-var[name="name"]');
nameVariable.value = 'Heximal';
// Now the document will display <h1>Hello Heximal</h1>
```

### Scopes

Variables are lexically scoped. New scopes can be defined with `<h-scope>`:

```html
<h-var name="name" value="World"></h-var>
<h-scope>
  <h-var name="name" value="Heximal"></h-var>
  <p>
    <!-- name is 'Heximal' -->
    Inner name is: <h-out expr="name"></h-out>
  </p>
</h-scope>
<p>
  <!-- name is 'World' -->
  Outer name is: <h-out expr="name"></h-out>
</p>
```

### Expressions

Heximal includes a simple but relatively rich expression system for writing
expressions in HTML. Heximal expressions are mostly a subset of JavaScript, with
literals, operators, property access, and function calls.

Expressions are used in data-binding, templates control-flow, component
definitions, the `<h-out>` element and other places. The expression library can
be used standalone, and as a part of of custom components so they can consume
user-authored expressions.

See the [@heximal/expressions](../expressions/) package for more
information.

### Templates

Heximal Templates enhance the HTML `<template>` element with bindings,
[expressions](../expressions/), and control flow like `if` and `repeat`.

Templates can be used as a part of custom elements, standalone, or as auto
templates that automatically render to the document.

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

See the [@heximal/templates](../templates/) package for more
information.

#### Auto-templates

Auto templates let you use template binding syntax and control flow anywhere in
your page. They are `<template>` elements that are immediately rendered in-place
without being part of a component or called from another template. They are
declared with the `h-auto` attribute.

```html
<body>
  <template h-auto>
    <h1>Hello {{ name }}</h1>
  </template>
</body>
```

Binding syntax is a very convenient way to write expressions inline with HTML,
but if we tried to make the binding syntax work in plain HTML, the expression
_source_ could render before Heximal has a chance to process the bindings and
render their results.

See the [@heximal/components](../components/) package for more
information on auto-templates.

### Components

Heximal allows you to define new reusable or web components
declaratively in HTML with the `<h-define-element>` element.

```html
<h-define-element name="simple-greeter" properties="name">
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

These elements can then be used anywhere in the HTML document.

```html
<simple-greeter name="World"></simple-greeter>
```

Heximal elements (or any custom or built-in element!) can be used with Heximal's
template data-binding system, to be automatically updated as data changes:

```html
<template h-auto>
  <h-var name="name" value="World"></h-var>
  <simple-greeter name="{{ name }}"></simple-greeter>
</template>
```

See [@heximal/element](../element/) for more information.

### Built-in Heximal Elements

Heximal includes several other built-in elements to help construct dynamic
documents.

#### Utilities

- `<h-include>`: Include HTML files into your document
- `<h-fetch>`: Fetch a network resource

#### Display

- `<h-num>` Formats a number with the `Intl.NumberFormat` API.

## Packages

The Heximal monorepo is organized into several packages:

- [heximal](../heximal/): Top-level Heximal package
- [@heximal/expressions](../expressions/): Expression parser and evaluator
- [@heximal/templates](../templates/): Declarative HTML templates
- [@heximal/element](../element/): Declarative custom elements
- [@heximal/components](../components/): Built-in components
- [@heximal/examples](../examples/): Examples

## Installation

You probably shouldn't install Heximal yet, but if you want to try it:

```sh
npm i heximal
```

You can then import the main entrypoint script, however you import your
JavaScript, for example:

```html
<script type="module" src="/path/to/node_modules/heximal/index.js"></script>
```

#### For Stampino users

The packages that have been ported over from Stampino: `@heximal/expressions`
(formerly `jexpr`), `@heximal/templates` (formerly `stampino`), and
`@heximal/element` (formerly `stampino-element`) are more stable and can be
installed directly.

## Principles

- Document formats should be open. This is critically important in order to
  allow for ownership of your own data, prevent lock-in, and enable a rich
  ecosystem of tools that can produce and consume documents.
- The web is the ideal rendering and distribution platform for documents. The
  web is by far the most advanced open standard multimedia runtime, runs on the
  most platforms, and is the widest and most secure distribution channel for
  apps and documents. Building a new rendering engine or runtime for rich
  documents would be counter-productive.
- Staying close to plain web standards is the best way to augment web
  technologies for rich documents. Documents should be extensible with open
  standards and renderable without a build step.
- Documents should be self-contained in that they have explicit rather than
  implicit dependencies. Runtime and components should simply be imported
  modules.
- Interactive documents are applications, and need to be secured appropriately.
- Editing functionality is best separated from rendering. It takes less code and
  bytes to view a document than to edit it. There can be multiple editors for
  the same document format.

Heximal will be optimized for document interchange and runtime, not necessarily
for hand-written documents, so rich text formatting will be done with plain HTML
and CSS, not Markdown, for instance.

## Roadmap

- Computational notebooks and blocks
- More built-in elements
- CSS Variable system with nice defaults
- Security features

## Inspirations

Many existing tools out there share some parts of the Heximal goals and vision.
These tools are especially influential:

- Curvenote
- Google Collab
- Google Docs
- Notion
- Stampino (the progenitor of Heximal)
- Alpine.js
- HTMX
- Observable
- Block Protocol

## Stampino and Jexpr

[Jexpr](https://github.com/justinfagnani/jexpr),
[Stampino](https://github.com/justinfagnani/stampino), and [Stampino
Element](https://github.com/justinfagnani/stampino-element) are the original
names and implementations of three of the core Heximal packages. They have been
moved into the Heximal monorepo and renamed to Heximal Expressions, Heximal
Templates, and Heximal Element, respectively. The previous repositories will not
be actively maintained and will eventually be archived.

This move is being done in order to create a unified project and expand the
scope beyond just declarative templates and custom elements.
