# stampino-element

`<stampino-element>` is a web component for creating _declarative web components_. That is, defining web components entirely in HTML.

`<stampino-element>` uses [Stampino](https://www.npmjs.com/package/stampino) (which in turn uses lit-html) for template rendering. Templates can have expressions and control flow like `<template type="if">` and `<template type="repeat">`.

The custom element name is specified in the `name` attribute, and a space-separated list of properties in `properties`.

### Example

```html
<stampino-element name="simple-greeter" properties="name">
  <template>
    <h1>Hello {{ name }}!</h1>
  </template>
</stampino-element>

<simple-greeter name="World"></simple-greeter>
```
