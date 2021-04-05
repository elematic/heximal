# Jexpr

## Overview

Jexpr is an expression syntax, parser, and evaluator for JS-like expressions.

Jexpr is designed for libraries that evaluate user-written expressions, such as
HTML templating engines. Jexpr has a relatively rich syntax, supporting
identifiers, operators, property access, method and function calls, and
literals (including arrays and objects), and pipes.

Example:

```js
(person.title + ' ' + person.getFullName()) | uppercase;
```

## Usage

### Installation

```bash
npm i jexpr
```

### Usage

```ts
import {parse, EvalAstFactory} from 'jexpr';

// An EvalAstFactory produces an AST that can be evaluated
const astFactory = new EvalAstFactory();

// parse() returns the AST
const expr = parse('(a + b([1, 2, 3]) * c)', astFactory);

// evaluate() with a scope object
const result = expr.evaluate({
  a: 42,
  b: (o: Array<number>) => o.length,
  c: 2,
});

console.log(result); // 48
```

## Features

### Fast, small parser

Jexpr is a hand-written, recursive descent, precedence-climbing parser. It's
simple, fast and small.

### Pluggable AST factories

`parse()` takes an AST factory so that different strategies can be used to
produce ASTs. The default factory creates an AST as defined in `lib/ast.js`.
`lib/eval.js` exports an `EvalAstFactory` that produces evaluatable ASTs.

### Null-Safety

Expressions are generally null-safe. If a subexpression yields `null` or
`undefined`, subsequent property access will return null, rather than throwing
an exception. Property access, method invocation and operators are null-safe.
Passing null to a function that doesn't handle null will not be null safe.

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

Jexpr supports number, boolean, string, and map literals. Strings
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

Jexpr supports the following binary and unary operators:

- Arithmetic operators: `+`, `-`, `*`, `/`, `%`, unary `+` and `-`
- Comparison operators: `==`, `!=`, `===`, `!==`, `<=`, `<`, `>`, `>=`
- Boolean operators: `&&`, `||`, unary `!`
- Nullish coalescing: `??`

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

## Acknowedgements

Jexpr is forked from `polymer-expressions` which is no longer officially
maintained by the Polymer team. The JavaScript version of that library was
ported from the
[Dart library](https://github.com/dart-archive/polymer-expressions) of the same name, originally used in Polymer.dart.
