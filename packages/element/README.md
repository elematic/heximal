# stampino-element

`<stampino-element>` is a web component for creating _declarative web components_. That is, defining web components entirely in HTML.

`<stampino-element>` uses [Stampino](https://www.npmjs.com/package/stampino) (which in turn uses lit-html) for template rendering. Templates can have expressions and control flow like `<template type="if">` and `<template type="repeat">`.

The custom element name is specified in the `name` attribute, and a space-separated list of properties/attributes in `properties`.

Scoped styles can be added with a `<style type="adopted-css">` tag.

### Example

```html
<stampino-element name="simple-greeter" properties="name">
  <style type="adopted-css">
    :host {
      color: blue;
    }
  </style>
  <template>
    <h1>Hello {{ name }}!</h1>
  </template>
</stampino-element>

<simple-greeter name="World"></simple-greeter>
```
