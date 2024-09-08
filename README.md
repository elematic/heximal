# Heximal

Heximal is a web-based interactive document and notebook system

> [!WARNING]
> Heximal is extremely early, experimental, incomplete. It is under active development.

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

Heximal will be optimized for document interchange and runtime, not necessarily
for hand-written documents, so rich text formatting will be done with plain HTML
and CSS, not Markdown, for instance.

## Packages

- [@heximal/expressions](./packages/expressions/): Expression parser and evaluator
- [@heximal/templates](./packages/templates/): Declarative HTML templates
- [@heximal/element](./packages/element/): Declarative custom elements
- [@heximal/components](./packages/components/): Built-in components
- [@heximal/examples](./packages/examples/): Examples

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
