# Heximal Agent Instructions

Heximal is an HTML-first declarative reactive framework based on Lit and Web
Components. It extends HTML with reactive templates, declarative custom
elements, lexically-scoped variables backed by signals, an expression language,
and elements to author dynamic documents in markup.

This document serves as the guide for AI agents working in this repository.

---

## Key Workflows & Tooling

### Wireit Orchestration (CRITICAL)

The project uses **[Wireit](https://github.com/google/wireit)** to manage build,
test, and dev server script execution, dependency graphs, and caching.

- **Never run manual builds before running tests**: Wireit automatically
  establishes dependency chains. For instance, package-level and root `test`
  tasks depend on `build`. Running `npm test` will automatically compile any
  modified TypeScript files or stale dependencies before executing tests.
- **Automatic Cache Reuse**: Wireit computes fingerprint hashes of inputs
  (source files, configs, dependency outputs). When inputs have not changed,
  Wireit immediately reuses cached outputs and skips the command. If `npm test`
  reports `Ran 0 scripts and skipped N in 0.1s`, tests are passing and
  up-to-date.
- **Running Tests**:
  - **Full test suite**: `npm test`
  - **Single package test suite**: `npm test -w @heximal/<package-name>` (e.g.
    `npm test -w @heximal/expressions` or `npm test -w @heximal/components`)
- **Building**:
  - **All packages**: `npm run build`
  - **Single package**: `npm run build -w <package-name>`
- **Formatting**:
  - Run Prettier: `npm run format`
  - Sync ignore files: `npm run ignore-sync` (uses `ignore-sync` to keep
    `.prettierignore` in sync with `.gitignore` and `.prettierignore-sync`).
- **Browser Test Runner Environment Note**:
  - Packages testing in the browser (`components`, `element`, `templates`) use
    `@web/test-runner` with Playwright Chromium.
  - In sandboxed CLI environments (such as sandboxed agent execution on macOS),
    Chromium may fail with Mach port permissions (`KERN_SUCCESS
    bootstrap_check_in`). Run tests unsandboxed (with permission / bypass
    sandbox) if browser tests fail to launch Chromium.
  - `@heximal/expressions` runs in Node (`node:test`) and does not require a
    browser.

---

## Monorepo Architecture & Packages

The repository is organized under npm workspaces (`packages/*`):

### 1. `packages/heximal` (`heximal`)

- Top-level convenience/umbrella package.
- Re-exports everything from `@heximal/components`, `@heximal/element`,
  `@heximal/expressions`, and `@heximal/templates`.
- Entrypoint: `index.js` (compiled from `src/index.ts`).

### 2. `packages/expressions` (`@heximal/expressions`)

- Expression parser and evaluator for JavaScript-like expressions.
- Hand-written, recursive-descent, precedence-climbing parser
  (`src/lib/parser.ts`, `tokenizer.ts`).
- Pluggable AST factories (`DefaultAstFactory` in `ast_factory.ts`,
  `EvalAstFactory` in `eval.ts`).
- Supports property access, identifiers, function/method calls, arrow functions,
  binary/unary operators, nullish coalescing (`??`), assignment (`=`), and
  pipeline operators (`|` and `|>`).
- Built-in null-safety (null/undefined subexpressions do not throw on property
  access).
- Tested with Node's native test runner (`node:test`, `node:assert`).

### 3. `packages/templates` (`@heximal/templates`)

- Declarative HTML `<template>` engine built on top of `lit-html` and
  `@heximal/expressions`.
- Core function: `prepareTemplate(templateElement, handlers, renderers,
  superTemplate)` transforms `<template>` elements into `lit-html` render
  functions.
- Expressions are delimited by `{{ expression }}`.
- Supports standard `lit-html` bindings:
  - Attributes: `attr={{ val }}`
  - Properties: `.prop={{ val }}`
  - Events: `@event={{ handler }}`
  - Boolean attributes: `?boolean={{ condition }}`
- Control flow via `<template type="...">` handlers:
  - `<template type="if" if="{{ condition }}">`
  - `<template type="repeat" repeat="{{ items }}">` (exposes `item` in scope)
- Template composition & inheritance:
  - Named blocks: `<template name="block-name">`
  - Super calls: `<template name="super">`
  - Sub-template calls: `<template call="..." data="...">` (by name or by
    reference).
- Tested with `@web/test-runner` and Playwright Chromium.

### 4. `packages/element` (`@heximal/element`)

- Declarative custom elements defined directly in HTML with
  `<h-define-element>`.
- Custom element name declared with `name="..."` (must contain a hyphen).
- Properties defined via `properties="..."` attribute or child `<h-prop
  name="..." type="..." reflect attribute="...">` elements.
- Adopted styles via child `<style type="adopted-css">`.
- Template via child `<template>`.
- Inheritance via `extends="base-element-name"`, supporting block overrides and
  `<template name="super">`.
- Reactivity backed by signals (`signal-polyfill` / `@lit-labs/signals`).
- Tested with `@web/test-runner`.

### 5. `packages/components` (`@heximal/components`)

- Core built-in elements and document-level scoping mechanism.
- Elements:
  - State & Scope:
    - `<h-var name="..." value="...">`: Signal-backed reactive variable.
    - `<h-out expr="...">`: Renders the evaluated expression to DOM.
    - `<h-scope>`: Creates a nested lexical scope.
  - Utilities:
    - `<h-include src="...">`: Includes external HTML documents.
    - `<h-fetch url="...">`: Fetches network resources.
  - Formatting & Display:
    - `<h-num value="...">`: Formats numbers using `Intl.NumberFormat`.
- Auto-templates:
  - `<template h-auto>`: Immediately renders template in-place and runs inside a
    signal effect to re-render on dependency change.
  - Activated by calling `runAutoTemplates()`.
- Scope context provides access to `window`, `document`, `host`, and `$`
  (`querySelector` helper).
- Tested with `@web/test-runner`.

### 6. `packages/examples` (`@heximal/internal-examples`)

- Internal examples, demos, and playground for local testing and development.
- Run dev server: `npm start -w @heximal/internal-examples` (runs `wds` / Web
  Dev Server).

### 7. `packages/site` (`@heximal/site`)

- Heximal documentation and website built with Eleventy (`@11ty/eleventy`),
  Markdown-It plugins, and Open Props.
- Local dev server: `npm run start:dev -w @heximal/site`.
- Dockerfile configured for deployment to Google Cloud Run.

---

## Coding & TypeScript Standards

### ESM and Import Extensions

- **Pure ESM**: The monorepo uses `"type": "module"` across all packages.
- **NodeNext Module Resolution**: TypeScript uses `"module": "NodeNext"` and
  `"moduleResolution": "NodeNext"`.
- **Relative Imports Require `.js` Extension**: In all TypeScript source files
  (`src/**/*.ts`), relative imports **must explicitly include `.js`**:

  ```ts
  // Correct
  import {getScope} from './document.js';
  import {Parser} from '../lib/parser.js';

  // Incorrect (will fail tsc / module resolution)
  import {getScope} from './document';
  import {getScope} from './document.ts';
  ```

### Build & Output Layout

- Packages use `"rootDir": "./src"` and `"outDir": "./"`.
- TypeScript emits `index.js`, `index.d.ts`, `lib/`, and `test/` into the
  package root directory.
- Wireit configurations define `"output"` files (e.g. `index.{js,d.ts}`, `lib/`)
  and `"clean": "if-file-deleted"`.
- TypeScript references connect dependencies across packages (`"references":
  [{"path": "../templates"}]`).

### Code Style & Prettier

- Formatting configuration (`.prettierrc.json`):
  - `"singleQuote": true`
  - `"bracketSpacing": false`
- Run `npm run format` after making changes to keep styling consistent.

### Web Components & Signals

- Uses standard TC39 / TypeScript decorators (`accessor name = ''`,
  `@customElement`, `@property`).
- Elements register themselves in `HTMLElementTagNameMap` for TypeScript type
  safety:
  ```ts
  declare global {
    interface HTMLElementTagNameMap {
      'h-var': HeximalVar;
    }
  }
  ```
- Reactive state is backed by `Signal.State` from `signal-polyfill`.

### Testing Guidelines

- Source test files live in `src/test/` (which compiles to `test/`).
- For Node-only packages (`@heximal/expressions`), use `node:test` and
  `node:assert`.
- For DOM/Web Component packages, use `@esm-bundle/chai` (`assert`) with
  `@web/test-runner`.
- In component tests:
  - Mount elements inside a DOM container created in `setup()` and clean it up
    in `teardown()`.
  - Wait for element rendering using `await el.updateComplete`.
