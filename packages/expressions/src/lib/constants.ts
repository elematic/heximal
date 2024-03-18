/*
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
 */

export const KEYWORDS = ['this'];
export const UNARY_OPERATORS = ['+', '-', '!'];
export const BINARY_OPERATORS = [
  '=',
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
  '|>',
];

export const PRECEDENCE = {
  '!': 0,
  ':': 0,
  ',': 0,
  ')': 0,
  ']': 0,
  '}': 0,

  '|>': 1,
  '?': 2,
  '??': 3,
  '||': 4,
  '&&': 5,
  '|': 6,
  '^': 7,
  '&': 8,

  // equality
  '!=': 9,
  '==': 9,
  '!==': 9,
  '===': 9,

  // relational
  '>=': 10,
  '>': 10,
  '<=': 10,
  '<': 10,

  // additive
  '+': 11,
  '-': 11,

  // multiplicative
  '%': 12,
  '/': 12,
  '*': 12,

  // postfix
  '(': 13,
  '[': 13,
  '.': 13,
  '{': 13, // not sure this is correct
};

export const POSTFIX_PRECEDENCE = 13;
