# Heximal

An HTML-first interactive document and notebook system.

> [!WARNING]
> Heximal is extremely experimental and incomplete. It is under active
> development.

## Goals

Heximal aims to be an HTML-based file format for rich, interactive, data-driven
documents and computational notebooks.

Heximal extends (or will extend) HTML with:

- 🔣 Expressions
- 🖨️ Declarative HTML templates
- 🍱 Declarative custom elements
- 🤹 Declarative dynamic documents: variables, scopes, bindings, I/O (🔮)
- 🗄️ A library of visual and interactive components (🔮)
- 🎨 Built-in CSS variables and styles for document themes (🔮)
- 🔐 Security tools for sanitizing, viewing, and distributing documents (🔮)

_🔮 = Future work_

Heximal's ultimate goal is to be able to describe a wide range of documents that
you might create in tools like Google Docs, Notion, Observable, or Jupyter
Notebook.

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

## Example

While blocks aren't defined yet, Heximal does have initial implementations of
many of the primitives necessary for dynamic documents including expressions,
templates, components, and variables.

```html
<body>
  <!-- Declare variables with <h-var>. Variables are backed by Signals -->
  <h-var name="name" value="World"></h-var>

  <!-- Render expressions in plain HTML with <h-out> -->
  <h-out expr="name"></h-out>

  <!-- Templates have special syntax for bindings. Auto-templates render
      and update automatically! -->
  <template h-auto>
    <!-- Bindings are denoted with {{}} and can contain arbitray expressions -->
    <p>{{ name.toUpperCase() }}</p>

    <!-- Hexmical can bind to attributes, properties, and events too -->
    <input .value="{{ name }}" @input="{{ (e) => name = e.target.value }}" />
  </template>

  <!-- Components are defined with <h-define-element> -->
  <h-define-element name="simple-greeter" properties="name">
    <!-- Styles are scoped with shadow DOM -->
    <style type="adopted-css">
      :host {
        color: blue;
      }
    </style>

    <!-- Templates have all the same binding features. -->
    <template>
      <h1>Hello {{ name }}!</h1>
    </template>
  </h-define-element>

  <!-- Once you define an element, you can use it in your HTML.
       It'll update when state changes too! -->
  <simple-greeter name="{{ name }}"></simple-greeter>

  <!-- There's also a way to include external content -->
  <h-include src="./foo.html"></h-include>

  <!-- And other utilities will come for helping for forms, fetching, etc. -->
</body>
```

## Features

### Templates

Heximal Templates enhance the HTML `<template>` element with bindings,
[expressions](./packages/expressions/), and control flow like `if` and `repeat`.

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

See [@heximal/templates](./packages/templates/) for more information on
templates, and [@heximal/expressions](./packages/expressions/) for more
information on expressions.

### Custom Elements

Heximal allows you to define new custom elements declaratively in HTML.

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

See [@heximal/element](./packages/element/) for more information.

### Built-in Components

Heximal includes several built-in components to help construct dynamic
documents:

- `<h-var>`: Declares a signal-backed variable
- `<h-out>`: Displays the value of an expression
- `<h-scope>`: Creates a nested scope for `<h-var>` variables
- `<h-include>`: Include HTML files into your document
- `<h-fetch>`: Fetch a network resource

## Packages

- [heximal](./packages/heximal/): Top-level Heximal package
- [@heximal/expressions](./packages/expressions/): Expression parser and evaluator
- [@heximal/templates](./packages/templates/): Declarative HTML templates
- [@heximal/element](./packages/element/): Declarative custom elements
- [@heximal/components](./packages/components/): Built-in components
- [@heximal/examples](./packages/examples/): Examples

### Installation

You probably shouldn't install Heximal yet, but if you want to try it:

```sh
npm i heximal
```

## Design Ideas

### Notebooks and Blocks

Computational notebooks blur the lines between documents, spreadsheets, and
applications. They are usually structured as a linear sequence of blocks of
various types, where the blocks are able to share data. Notebooks are
scriptable, and the scripts both execute and are displayed as content within the
document.

Examples of blocks inlcude rich text, tables, scripts, graphs and charts, etc.

The design for blocks in Heximal is not yet started. They will be custom
elements, but there will be a protocol for blocks adding and reading data from
other blocks, and responding to changes.

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
- Block Prototcol

## Stampino and Jexpr

[Jexpr](https://github.com/justinfagnani/jexpr),
[Stampino](https://github.com/justinfagnani/stampino), and [Stampino
Element](https://github.com/justinfagnani/stampino-element) are the original
names and implementations of three of the core Hexiaml packages. They have been
moved into the Heximal monorepo and renamed to Heximal Expressions, Heximal
Templates, and Heximal Element, respectively. The previous repositories will not
be actively maintained and will eventually be archived.

This move is being done in order to create a unified project and expand the
scope beyond just declarative templates and custom elements.
