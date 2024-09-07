# Heximal Expressions

## Overview

Heximal Expressions is an expression syntax, parser, and evaluator for
JavaScript-like expressions.

Heximal Expressions is designed for libraries that evaluate user-written
expressions, such as HTML templating engines. Heximal Expressions has a relatively rich
syntax, supporting identifiers, operators, property access, method and function
calls, and literals (including arrays and objects), function literals,
assignments, and pipes.

Example:

```js
(person.title + ' ' + person.getFullName()) | uppercase;
```

## Usage

### Installation

```bash
npm i @heximal/expressions
```

### Usage

```ts
import {parse, EvalAstFactory} from '@heximal/expressions';

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

The Heximal Expressions parser is a hand-written, recursive descent,
precedence-climbing parser. It's simple, fast and small.

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

Heximal Expressions supports number, boolean, string, and map literals. Strings
can use either single or double quotes.

- `null` and `undefined`
- Numbers: `1`, `1.0`
- Booleans: `true`, `false`
- Strings: `'abc'`, `"xyz"`
- Objects: `{ 'a': 1, 'b': 2 }`
- Arrays: `[1, 2, 3]`

### Function and method calls

If a property is a function in the scope, a method on the model, or a method on
an object, it can be invoked with standard function syntax. Functions and
Methods can take arguments. Arguments can be literals or variables.

Examples:

- Top-level function: `myFunction()`
- Top-level function with arguments: `myFunction(a, b, 42)`
- Model method: `aMethod()`
- Method on nested-property: `a.b.anotherMethod()`

### Operators

Heximal Expressions supports the following binary and unary operators:

- Assignment: `=`
- Arithmetic operators: `+`, `-`, `*`, `/`, `%`, unary `+` and `-`
- Comparison operators: `==`, `!=`, `===`, `!==`, `<=`, `<`, `>`, `>=`
- Boolean operators: `&&`, `||`, unary `!`
- Nullish coalescing: `??`
- Pipeline operators: `|` (legacy) and `|>` (modern)

Expressions do not support bitwise operators such as `&`, `|`, `<<` and `>>`, or
increment/decrement operators (`++` and `--`)

#### Assignment

The left-hand-side expression of the assignment operator (`=`) must be one of an
ID, getter or setter, otherwise an exception is thrown.

### Maps

Maps are sets of key/value pairs. The key can either be a quoted string, or an
identifier:

Examples:

- `{'a': 1, 'b': 2}`
- `{a: 1, b: 2}`

### Array and Object indexing

Arrays and objects can be accessed via the index operator: []

Examples:

- `items[2]`
- `people['john']`

### Function expressions

Functions can be written with the arrow function syntax.

Examples:

- `() => 3`
- `(a, b) => a + b`

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

Heximal Expressions was moved and renamed from
[Jexpr](https://github.com/justinfagnani/jexpr), which itself was forked from
[`polymer-expressions`](https://github.com/googlearchive/polymer-expressions),
which is a JavaScript port of a [Dart
library](https://github.com/dart-archive/polymer-expressions) by the same name.

Both `polymer-expressions` implementations are no longer officially maintained
by Google. Jexpr was moved to make it part of the Heximal project and monorepo.
