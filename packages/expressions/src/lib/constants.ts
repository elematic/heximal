/*
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
 */

export const KEYWORDS = ['this'];
export const UNARY_OPERATORS = ['+', '-', '!'];
export const BINARY_OPERATORS = [
  '+',
  '-',
  '*',
  '/',
  '%',
  '^',
  '==',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  '||',
  '&&',
  '??',
  '&',
  '===',
  '!==',
  '|',
];

export const PRECEDENCE = {
  '!': 0,
  ':': 0,
  ',': 0,
  ')': 0,
  ']': 0,
  '}': 0,
  '?': 1,
  '??': 2,
  '||': 3,
  '&&': 4,
  '|': 5,
  '^': 6,
  '&': 7,

  // equality
  '!=': 8,
  '==': 8,
  '!==': 8,
  '===': 8,

  // relational
  '>=': 9,
  '>': 9,
  '<=': 9,
  '<': 9,

  // additive
  '+': 10,
  '-': 10,

  // multiplicative
  '%': 11,
  '/': 11,
  '*': 11,

  // postfix
  '(': 12,
  '[': 12,
  '.': 12,
  '{': 12, // not sure this is correct
};

export const POSTFIX_PRECEDENCE = 12;
