# PolymerExpressions

[![Build status](http://www.polymer-project.org/build/polymer-expressions/status.png 'Build status')](http://build.chromium.org/p/client.polymer/waterfall)

## Overview

Polymer expressions are an expressive syntax that can be used in Polymer HTML
templates.

Polymer expressions allow you to write complex binding expressions, with
property access, function invocation, list/map indexing, and two-way filtering
like:

```html
{{ person.title + " " + person.getFullName() | uppercase }}
```

## Usage

### Installation

_TODO: Add npm instructions_

### Usage

Import `polymer-expressions.html` and add the `PolymerExpressions` behavior:

```html
<link rel="import" href="../polymer-expressions/polymer-expressions.html" />
<script>
  Polymer({
    is: 'my-element',

    behaviors: [PolymerExpressions],
  });
</script>
```

## Features

### Models and Scopes

**_TBD_**

### Assignable and Non-Assignable Expressions

**_NOTE: Subject to Change_**

Some expressions can be used in two-way binding contexts. For this to work,
the expression must be "assignable". Only a subset of expressions are
assignable.

Assignable expressions cannot contain function calls, operators, and
any index operator must have a literal argument. Assignable expressions can
contain filter operators as long as all the filters are two-way transformers.

Some restrictions may be relaxed further as allowed.

Assignable Expressions:

- `foo`
- `foo.bar`
- `items[0].description`
- `people['john'].name`
- `product.cost | convertCurrency('ZWD')` where `convertCurrency` evaluates to
  a Transformer object.

Non-Assignable Expressions:

- `a + 1`
- `!c`
- `foo()`
- `person.lastName | uppercase` where `uppercase` is a filter function.

### Null-Safety

Expressions are generally null-safe. If a subexpression yields `null` or
`undefined`, subsequent property access will return null, rather than throwing
an exception. Property access, method invocation and operators are null-safe. Passing null to a function that doesn't handle null will not be null safe.

## Syntax

### Property access

Properties on the model and in the scope are looked up via simple property
names, like `foo`. Property names are looked up first in the top-level
variables, next in the model, then recursively in parent scopes. Properties on
objects can be access with dot notation like `foo.bar`.

The keyword `this` always refers to the model if there is one, otherwise `this`
is `null`. If you have model properties and top-level variables with the same
name, you can use `this` to refer to the model property.

### Literals

Polymer Expressions support number, boolean, string, and map literals. Strings
can use either single or double quotes.

- Numbers: `1`, `1.0`
- Booleans: `true`, `false`
- Strings: `'abc'`, `"xyz"`
- Objects: `{ 'a': 1, 'b': 2 }`
- Arrays: `[1, 2, 3]`

### Functions and methods

If a property is a function in the scope, a method on the model, or a method on
an object, it can be invoked with standard function syntax. Functions and
Methods can take arguments. Arguments can be literals or variables.

Examples:

- Top-level function: `myFunction()`
- Top-level function with arguments: `myFunction(a, b, 42)`
- Model method: `aMethod()`
- Method on nested-property: `a.b.anotherMethod()`

### Operators

Polymer Expressions supports the following binary and unary operators:

- Arithmetic operators: `+`, `-`, `*`, `/`, `%`, unary `+` and `-`
- Comparison operators: `==`, `!=`, `===`, `!==`, `<=`, `<`, `>`, `>=`
- Boolean operators: `&&`, `||`, unary `!`

Expressions do not support bitwise operators such as `&`, `|`, `<<` and `>>`, or
increment/decrement operators (`++` and `--`)

### Array and Object indexing

Arrays and objects can be accessed via the index operator: []

Examples:

- `items[2]`
- `people['john']`

### Filters and transformers

A filter is a function that transforms a value into another, used via the pipe
syntax: `value | filter` Any function that takes exactly one argument can be
used as a filter.

Example:

If `person.name` is `"John"`, and a top-level function named `uppercase` has
been registered, then `person.name | uppercase` will have the value `"JOHN"`.

The pipe syntax is used rather than a regular function call so that we can
support two-way bindings through transformers. A transformer is a filter that
has an inverse function. Two-way transformers are not supported yet.
