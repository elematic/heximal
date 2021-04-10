# stampino-element

`<stampino-element>` is a web component for creating _declarative web components_. That is, defining web components entirely in HTML.

`<stampino-element>` uses [Stampino](https://www.npmjs.com/package/stampino) (which in turn uses [lit-html](https://lit-html.polymer-project.org/)) for template rendering, and [LitElement](https://lit-element.polymer-project.org/) for reactive properties.

 Templates can have expressions and control flow like `<template type="if">` and `<template type="repeat">`.

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

### Element names

The custom element name is declared with the required attribute `name`. The name must include a dash (`-`) as per custom elements in the HTML specification.

### Properties

Properties are specified with either the `properties` attribute or child `<st-prop>` elements.

The `properties` attribute takes a space-separated list of property names, all properties listed get an associated attribute of the same name, using the String type converter, with no reflection.

If you need to set property options like `type`, `reflect`, `attribute`

| Attribute | Meaning |
| ----------|---------|
| `name` | The name of the property. Case-sensitive |
| `type` | The "type hint" for the property. Valid values are "String", "Number", "Boolean", "Object", or "Array" |
| `reflect` | A boolean attribute. If present the property reflects to an attribute. |
| `attribute` | The attribute name associated with the property |
| `noattribute` | If present the property is not read from an attribute |

Example:
```html
<stampino-element name="simple-greeter">
  <st-prop name="name" reflect type="String"></st-prop>
  <!-- ... -->
</stampino-element>
```

### Styling

Styles are added with a `<style type="adopted-css">` child element. 

The type is `"adopted-css"` so that the styles do not apply to the document. The CSS text of the style element is added as an adopted stylesheet to the element's shadow root.

_Note: Currently only a single `<style>` tag is supported. And while subclasses can override its base class's styles, there's no way to both add to and include the base class styles._

### Template expressions

Template expressions are implicitly resolved against the element instance - there is no need to prefix property names with `this`.

### Inheritance

A Stampino element can extend another Stampino element by referencing the base class with the `extends` attribute. The base class must come before the subclass in the HTML document.

The base class can define named template "blocks" that can be overridden by the subclass:

```html
<stampino-element name="x-base">
  <template>
    <h1>Hello World</h1>
    <template name="block-1">Fallback content</template>
  </template>
</stampino-element>

<stampino-element name="x-foo" extends="x-base">
  <template>
    <template name="block-1">Override content</template>
  </template>
</stampino-element>
```

This type of sub-template has an implciit call to render the super template. If a subclass needs to add content around the superclass template, it can include an explicit call to the super template:

```html
<stampino-element name="x-base">
  <template>
    <h1>Hello World</h1>
    <template name="block-1">Fallback content</template>
  </template>
</stampino-element>

<stampino-element name="x-foo" extends="x-base">
  <template>
    <div class="wrapper">
      Subclass content
      <template name="super">
        <template name="block-1">Override content</template>
      </template>
    </div>
  </template>
</stampino-element>
```
