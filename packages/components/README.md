# Heximal Components

The core built-in components for
[Heximal](https://www.npmjs.com/package/heximal) and APIs for accessing scopes.

## Components

### State
- `<h-var>`: Declares a signal-backed variable
- `<h-out>`: Displays the value of an expression
- `<h-scope>`: Creates a nested scope for h-var variables

### Utilities

- `<h-include>`: Include external HTML files into your document
- `<h-fetch>`: Fetch a network resource

### Display

- `<h-num>` Formats a number with the `Intl.NumberFormat` API.

## Auto Templates

Auto templates are immediately rendered in-place without being part of a
component or called from another template. They are declared with the `h-auto`
attribute.

Auto templates are necessary to be able to use bindings in the main document
without rendering the text of the binding expression. The expressions are
stripped before rendering, and replaced with their values.

Auto-templates are also run as a signal effect, so that they update whenever any
signals that they depend on change. `<h-var>` and the fields of built-in
components are backed-by signals so that changes to them can be tracked.

```html
<template h-auto>
  <h1>Hello, {{ name }}</h1>
</template>
```

Auto-templates are not enabled by default, since expressions are a potential
source of XSS vulnerabilities. To enable auto-templates, call the
`runAutoTemplates()` function:

```ts
import {runAutoTemplates} from '@heximal/components';

runAutoTemplates();
```

## Scopes

This package defines the scoping mechanism used by `<h-var>`, `<h-scope>`,
`<h-out>`, etc.

In addition to variables declared in the document, scopes have the following
properties available:

- `window`: The standard `window` object
- `document`: The standard `document` object
- `host`: The element that an expression is attached to.
- `$`: A function that queries the root node (Document or ShadowRoot) with
  `querySelector()`.
