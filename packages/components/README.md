# Heximal Components

The core built-in components for [Heximal](https://www.npmjs.com/package/heximal)

## Components

### Variables
- `<h-var>`: Declares a variable
- `<h-out>`: Displays the value of an expression
- `<h-scope>`: Creates a nested scope for h-var variables

### Utilities

- `<h-include>`: Include HTML files into your document
- `<h-fetch>`: Fetch a network resource

### Display

- `<h-num>` Formats a number with the `Intl.NumberFormat` API.

## Auto Templates

Auto templates are immediately rendered in-place without being part of a
component or called from another template. They are declared with the `h-auto`
attribute.

Auto templates are neccessary to be able to use bindings in the main document
without rendering the text of the bidning expression. The expressions are
stripped before rendering, and replaced with their values.

Auto-templates are also run as a signal effect, so that they update whenever any
signals that they depend on change. `<h-var>` and the fields of built-in
components are backed-by signals so that changes to them can be tracked.

```html
<template h-auto>
  <h1>Hello, {{ name }}</h1>
</template>
```
