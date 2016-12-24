declare module "polymer-expressions/ast" {
    export type Expression = Literal | Empty | ID | Unary | Binary | Getter | Invoke | Paren | Index | Ternary | Map | List;
    export type LiteralValue = string | number | boolean | null;
    export interface Literal {
        type: 'Literal';
        value: LiteralValue;
    }
    export interface Empty {
        type: 'Empty';
    }
    export interface ID {
        type: 'ID';
        value: string;
    }
    export interface Unary {
        type: 'Unary';
        operator: string;
        child: Expression;
    }
    export interface Binary {
        type: 'Binary';
        operator: string;
        left: Expression;
        right: Expression;
    }
    export interface Getter {
        type: 'Getter';
        receiver: Expression;
        name: string;
    }
    export interface Invoke {
        type: 'Invoke';
        receiver: Expression;
        method: string | null;
        arguments: Array<Expression> | null;
    }
    export interface Paren {
        type: 'Paren';
        child: Expression;
    }
    export interface Index {
        type: 'Index';
        receiver: Expression;
        argument: Expression;
    }
    export interface Ternary {
        type: 'Ternary';
        condition: Expression;
        trueExpr: Expression;
        falseExpr: Expression;
    }
    export interface Map {
        type: 'Map';
        entries: {
            [key: string]: Expression | null;
        } | null;
    }
    export interface List {
        type: 'List';
        items: Array<Expression> | null;
    }
}
declare module "polymer-expressions/ast_factory" {
    import * as ast from "polymer-expressions/ast";
    export interface AstFactory<E extends ast.Expression> {
        empty(): E;
        literal(value: ast.LiteralValue): E;
        id(name: string): E;
        unary(operator: string, expression: E): E;
        binary(left: E, op: string, right: E): E;
        getter(receiver: E, name: string): E;
        invoke(receiver: E, method: string | null, args: Array<E> | null): E;
        paren(child: E): E;
        index(receiver: E, argument: E): E;
        ternary(condition: E, trueExpr: E, falseExpr: E): E;
        map(entries: {
            [key: string]: E;
        } | null): E;
        list(items: Array<E> | null): E;
    }
    export class DefaultAstFactory implements AstFactory<ast.Expression> {
        empty(): ast.Empty;
        literal(value: ast.LiteralValue): ast.Literal;
        id(value: string): ast.ID;
        unary(operator: string, child: ast.Expression): ast.Unary;
        binary(left: ast.Expression, operator: string, right: ast.Expression): ast.Binary;
        getter(receiver: ast.Expression, name: string): ast.Getter;
        invoke(receiver: ast.Expression, method: string | null, args: Array<ast.Expression | null> | null): ast.Invoke;
        paren(child: ast.Expression): ast.Paren;
        index(receiver: ast.Expression, argument: ast.Expression): ast.Index;
        ternary(condition: ast.Expression, trueExpr: ast.Expression, falseExpr: ast.Expression): ast.Ternary;
        map(entries: {
            [key: string]: ast.Expression;
        } | null): ast.Map;
        list(items: Array<ast.Expression> | null): ast.List;
    }
}
declare module "polymer-expressions/constants" {
    export const KEYWORDS: string[];
    export const UNARY_OPERATORS: string[];
    export const BINARY_OPERATORS: string[];
    export const PRECEDENCE: {
        '!': number;
        ':': number;
        ',': number;
        ')': number;
        ']': number;
        '}': number;
        '?': number;
        '||': number;
        '&&': number;
        '|': number;
        '^': number;
        '&': number;
        '!=': number;
        '==': number;
        '!==': number;
        '===': number;
        '>=': number;
        '>': number;
        '<=': number;
        '<': number;
        '+': number;
        '-': number;
        '%': number;
        '/': number;
        '*': number;
        '(': number;
        '[': number;
        '.': number;
        '{': number;
    };
    export const POSTFIX_PRECEDENCE = 11;
}
declare module "polymer-expressions/tokenizer" {
    export interface Token {
        kind: Kind;
        value: string;
        precedence: number;
    }
    export enum Kind {
        STRING = 1,
        IDENTIFIER = 2,
        DOT = 3,
        COMMA = 4,
        COLON = 5,
        INTEGER = 6,
        DECIMAL = 7,
        OPERATOR = 8,
        GROUPER = 9,
        KEYWORD = 10,
    }
    export function token(kind: Kind, value: string, precedence?: number): {
        kind: Kind;
        value: string;
        precedence: number;
    };
    export class Tokenizer {
        private _input;
        private _index;
        private _tokenStart;
        private _next;
        constructor(input: string);
        nextToken(): {
            kind: Kind;
            value: string;
            precedence: number;
        };
        private _advance(resetTokenStart?);
        private _getValue(lookahead?);
        private _clearValue();
        private _tokenizeString();
        private _tokenizeIdentOrKeyword();
        private _tokenizeNumber();
        private _tokenizeDot();
        private _tokenizeComma();
        private _tokenizeColon();
        private _tokenizeFraction();
        private _tokenizeOperator();
        private _tokenizeGrouper();
    }
}
declare module "polymer-expressions/parser" {
    import { Expression } from "polymer-expressions/ast";
    import { AstFactory } from "polymer-expressions/ast_factory";
    import { Kind } from "polymer-expressions/tokenizer";
    export function parse(expr: string, astFactory: AstFactory<Expression>): Expression | null;
    export class Parser<N extends Expression> {
        private _kind;
        private _tokenizer;
        private _ast;
        private _token;
        private _value;
        constructor(input: string, astFactory: AstFactory<N>);
        parse(): N | null;
        private _advance(kind?, value?);
        _matches(kind?: Kind, value?: string): boolean;
        private _parseExpression();
        private _parsePrecedence(left, precedence);
        private _makeInvokeOrGetter(left, right);
        private _parseBinary(left, op);
        private _parseUnary();
        private _parseTernary(condition);
        private _parsePrimary();
        private _parseList();
        private _parseMap();
        private _parseInvokeOrIdentifier();
        private _parseIdentifier();
        private _parseArguments();
        private _parseIndex();
        private _parseParen();
        private _parseString();
        private _parseInteger(prefix?);
        private _parseDecimal(prefix?);
    }
}
declare module "polymer-expressions/eval" {
    import * as ast from "polymer-expressions/ast";
    import { AstFactory } from "polymer-expressions/ast_factory";
    export interface Scope {
        [key: string]: any;
    }
    export interface Evaluatable {
        evaluate(this: this, scope: Scope): any;
        getIds(this: this, idents: string[]): string[];
    }
    export type Expression = Literal | Empty | ID | Unary | Binary | Getter | Invoke | Index | Ternary | Map | List;
    export interface Literal extends Evaluatable {
        type: 'Literal';
        value: ast.LiteralValue;
    }
    export interface Empty extends Evaluatable {
        type: 'Empty';
    }
    export interface ID extends Evaluatable {
        type: 'ID';
        value: string;
    }
    export interface Unary extends Evaluatable {
        type: 'Unary';
        operator: string;
        child: Expression;
    }
    export interface Binary extends Evaluatable {
        type: 'Binary';
        operator: string;
        left: Expression;
        right: Expression;
    }
    export interface Getter extends Evaluatable {
        type: 'Getter';
        receiver: Expression;
        name: string;
    }
    export interface Invoke extends Evaluatable {
        type: 'Invoke';
        receiver: Expression;
        method: string | null;
        arguments: Array<Expression> | null;
    }
    export interface Index extends Evaluatable {
        type: 'Index';
        receiver: Expression;
        argument: Expression;
    }
    export interface Ternary extends Evaluatable {
        type: 'Ternary';
        condition: Expression;
        trueExpr: Expression;
        falseExpr: Expression;
    }
    export interface Map extends Evaluatable {
        type: 'Map';
        entries: {
            [key: string]: Expression | null;
        } | null;
    }
    export interface List extends Evaluatable {
        type: 'List';
        items: Array<Expression> | null;
    }
    export class EvalAstFactory implements AstFactory<Expression> {
        empty(): Empty;
        literal(v: string): Literal;
        id(v: string): ID;
        unary(op: string, expr: Expression): Unary;
        binary(l: Expression, op: string, r: Expression): Binary;
        getter(g: Expression, n: string): Getter;
        invoke(receiver: Expression, method: string, args: Expression[]): Invoke;
        paren(e: Expression): Expression;
        index(e: Expression, a: Expression): Index;
        ternary(c: Expression, t: Expression, f: Expression): Ternary;
        map(entries: {
            [key: string]: Expression;
        } | null): Map;
        list(l: Array<Expression> | null): List;
    }
}
declare module "polymer-expressions" {
    export * from "polymer-expressions/parser";
    export * from "polymer-expressions/ast_factory";
    export * from "polymer-expressions/eval";
}
