# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
## [Unreleased]
### Added
### Changed
### Deprecated
### Removed
### Fixed
-->

## [Unreleased]

### Added

- Added _template calls_. A sub-template can be called with the
  `<template call="...">` syntax.

### Changed
### Deprecated
### Removed
### Fixed

- Fixed a bug with multiple text bindings in a single text node (fixes [#32](https://github.com/justinfagnani/stampino/issues/32))
- Added better unescaping of escaped binding markers
- Fixed a bug with attribute bindings inside of repeat templates (fixes [#27](https://github.com/justinfagnani/stampino/issues/27))

### Security

## 0.7.0

### Changed

- Publish ES2022
- Added package exports
- Excluded non-prodcuion sources from npm files
- Updated to lit-html 3.0 (fixes [#32](https://github.com/justinfagnani/stampino/issues/32), [#41](https://github.com/justinfagnani/stampino/issues/41))
- Fix renderer precedence to prefer passed-in renderers over named blocks in templates

## 0.0.0 - 0.6.2

_A changelog was not kept for these releases_
