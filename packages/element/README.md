# Heximal Element

Heximal Element is a library for creating _declarative custom elements_ - elements that are defined entirely in HTML.

Heximal Element provides a `<h-define-element>` element that defines new custom elements with reactivity, rich templates, scoped styles, and more.

Part of the [Heximal](https://www.npmjs.com/package/heximal) project.

### Example

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

<simple-greeter name="World"></simple-greeter>
```

### Element names

The custom element name is declared with the required attribute `name`. The name must include a dash (`-`) as per custom elements in the HTML specification.

### Properties

Properties are specified with either the `properties` attribute or child `<h-prop>` elements.

The `properties` attribute takes a space-separated list of property names, all properties listed get an associated attribute of the same name, using the String type converter, with no reflection.

If you need to set property options like `type`, `reflect`, `attribute`

| Attribute     | Meaning                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `name`        | The name of the property. Case-sensitive                                                               |
| `type`        | The "type hint" for the property. Valid values are "String", "Number", "Boolean", "Object", or "Array" |
| `reflect`     | A boolean attribute. If present the property reflects to an attribute.                                 |
| `attribute`   | The attribute name associated with the property                                                        |
| `noattribute` | If present the property is not read from an attribute                                                  |

Example:

```html
<h-define-element name="simple-greeter">
  <h-prop name="name" reflect type="String"></h-prop>
  <!-- ... -->
</h-define-element>
```

### Styling

Styles are added with a `<style type="adopted-css">` child element.

The type is `"adopted-css"` so that the styles do not apply to the document. The CSS text of the style element is added as an adopted stylesheet to the element's shadow root.

_Note: Currently only a single `<style>` tag is supported. And while subclasses can override its base class's styles, there's no way to both add to and include the base class styles._

### Template expressions

Template expressions are implicitly resolved against the element instance - there is no need to prefix property names with `this`.

### Inheritance

A Heximal element can extend another Heximal element by referencing the base class with the `extends` attribute. The base class must come before the subclass in the HTML document.

The base class can define named template "blocks" that can be overridden by the subclass:

```html
<h-define-element name="x-base">
  <template>
    <h1>Hello World</h1>
    <template name="block-1">Fallback content</template>
  </template>
</h-define-element>

<h-define-element name="x-foo" extends="x-base">
  <template>
    <template name="block-1">Override content</template>
  </template>
</h-define-element>
```

This type of sub-template has an implciit call to render the super template. If a subclass needs to add content around the superclass template, it can include an explicit call to the super template:

```html
<h-define-element name="x-base">
  <template>
    <h1>Hello World</h1>
    <template name="block-1">Fallback content</template>
  </template>
</h-define-element>

<h-define-element name="x-foo" extends="x-base">
  <template>
    <div class="wrapper">
      Subclass content
      <template name="super">
        <template name="block-1">Override content</template>
      </template>
    </div>
  </template>
</h-define-element>
```
