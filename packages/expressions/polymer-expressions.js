define("polymer-expressions/ast", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("polymer-expressions/ast_factory", ["require", "exports"], function (require, exports) {
    "use strict";
    class DefaultAstFactory {
        empty() {
            return { type: 'Empty' };
        }
        // TODO(justinfagnani): just use a JS literal?
        literal(value) {
            return {
                type: 'Literal',
                value,
            };
        }
        id(value) {
            return {
                type: 'ID',
                value,
            };
        }
        unary(operator, child) {
            return {
                type: 'Unary',
                operator,
                child,
            };
        }
        binary(left, operator, right) {
            return {
                type: 'Binary',
                operator,
                left,
                right,
            };
        }
        getter(receiver, name) {
            return {
                type: 'Getter',
                receiver,
                name,
            };
        }
        invoke(receiver, method, args) {
            // TODO(justinfagnani): do this assertion in the parser
            if (args == null) {
                throw new Error('args');
            }
            return {
                type: 'Invoke',
                receiver,
                method,
                arguments: args,
            };
        }
        paren(child) {
            return {
                type: 'Paren',
                child,
            };
        }
        index(receiver, argument) {
            return {
                type: 'Index',
                receiver,
                argument,
            };
        }
        ternary(condition, trueExpr, falseExpr) {
            return {
                type: 'Ternary',
                condition,
                trueExpr,
                falseExpr,
            };
        }
        map(entries) {
            return {
                type: 'Map',
                entries,
            };
        }
        list(items) {
            return {
                type: 'List',
                items,
            };
        }
    }
    exports.DefaultAstFactory = DefaultAstFactory;
});
define("polymer-expressions/constants", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.KEYWORDS = ['this'];
    exports.UNARY_OPERATORS = ['+', '-', '!'];
    exports.BINARY_OPERATORS = [
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
        '&',
        '===',
        '!==',
        '|'
    ];
    exports.PRECEDENCE = {
        '!': 0,
        ':': 0,
        ',': 0,
        ')': 0,
        ']': 0,
        '}': 0,
        '?': 1,
        '||': 2,
        '&&': 3,
        '|': 4,
        '^': 5,
        '&': 6,
        // equality
        '!=': 7,
        '==': 7,
        '!==': 7,
        '===': 7,
        // relational
        '>=': 8,
        '>': 8,
        '<=': 8,
        '<': 8,
        // additive
        '+': 9,
        '-': 9,
        // multiplicative
        '%': 10,
        '/': 10,
        '*': 10,
        // postfix
        '(': 11,
        '[': 11,
        '.': 11,
        '{': 11,
    };
    exports.POSTFIX_PRECEDENCE = 11;
});
define("polymer-expressions/tokenizer", ["require", "exports", "polymer-expressions/constants"], function (require, exports, constants_1) {
    "use strict";
    const _TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '||', '&&'];
    const _THREE_CHAR_OPS = ['===', '!=='];
    (function (Kind) {
        Kind[Kind["STRING"] = 1] = "STRING";
        Kind[Kind["IDENTIFIER"] = 2] = "IDENTIFIER";
        Kind[Kind["DOT"] = 3] = "DOT";
        Kind[Kind["COMMA"] = 4] = "COMMA";
        Kind[Kind["COLON"] = 5] = "COLON";
        Kind[Kind["INTEGER"] = 6] = "INTEGER";
        Kind[Kind["DECIMAL"] = 7] = "DECIMAL";
        Kind[Kind["OPERATOR"] = 8] = "OPERATOR";
        Kind[Kind["GROUPER"] = 9] = "GROUPER";
        Kind[Kind["KEYWORD"] = 10] = "KEYWORD";
    })(exports.Kind || (exports.Kind = {}));
    var Kind = exports.Kind;
    function token(kind, value, precedence) {
        return {
            kind: kind,
            value: value,
            precedence: precedence || 0,
        };
    }
    exports.token = token;
    function _isWhitespace(ch) {
        return ch === 9 /* \t */ ||
            ch === 10 /* \n */ ||
            ch === 13 /* \r */ ||
            ch === 32 /* space */;
    }
    // TODO(justinfagnani): allow code points > 127
    function _isIdentOrKeywordStart(ch) {
        return _isIdentifier(ch) || ch === 95 /* _ */ || ch === 36 /* $ */;
    }
    // TODO(justinfagnani): allow code points > 127
    function _isIdentifier(ch) {
        ch &= ~32;
        return 65 /* A */ <= ch && ch <= 90 /* Z */;
    }
    function _isKeyword(str) {
        return constants_1.KEYWORDS.indexOf(str) !== -1;
    }
    function _isQuote(ch) {
        return ch === 34 /* " */ || ch === 39 /* ' */;
    }
    function _isNumber(ch) {
        return 48 /* 0 */ <= ch && ch <= 57 /* 9 */;
    }
    function _isOperator(ch) {
        return ch === 43 /* + */ ||
            ch === 45 /* - */ ||
            ch === 42 /* * */ ||
            ch === 47 /* / */ ||
            ch === 33 /* ! */ ||
            ch === 38 /* & */ ||
            ch === 37 /* % */ ||
            ch === 60 /* < */ ||
            ch === 61 /* = */ ||
            ch === 62 /* > */ ||
            ch === 63 /* ? */ ||
            ch === 94 /* ^ */ ||
            ch === 124 /* | */;
    }
    function _isGrouper(ch) {
        return ch === 40 /* ( */ ||
            ch === 41 /* ) */ ||
            ch === 91 /* [ */ ||
            ch === 93 /* ] */ ||
            ch === 123 /* { */ ||
            ch === 125 /* } */;
    }
    function _escapeString(str) {
        return str.replace(/\\(.)/g, function (_match, group) {
            switch (group) {
                case 'n':
                    return '\n';
                case 'r':
                    return '\r';
                case 't':
                    return '\t';
                case 'b':
                    return '\b';
                case 'f':
                    return '\f';
                default:
                    return group;
            }
        });
    }
    class Tokenizer {
        constructor(input) {
            this._index = -1;
            this._tokenStart = 0;
            this._next = null;
            this._input = input;
        }
        nextToken() {
            if (this._index === -1)
                this._advance();
            while (_isWhitespace(this._next)) {
                this._advance(true);
            }
            if (_isQuote(this._next))
                return this._tokenizeString();
            if (_isIdentOrKeywordStart(this._next))
                return this._tokenizeIdentOrKeyword();
            if (_isNumber(this._next))
                return this._tokenizeNumber();
            if (this._next === 46 /* . */)
                return this._tokenizeDot();
            if (this._next === 44 /* , */)
                return this._tokenizeComma();
            if (this._next === 58 /* : */)
                return this._tokenizeColon();
            if (_isOperator(this._next))
                return this._tokenizeOperator();
            if (_isGrouper(this._next))
                return this._tokenizeGrouper();
            // no match, should be end of input
            this._advance();
            if (this._next) {
                throw new Error(`Expected end of input, got ${this._next}`);
            }
            return null;
        }
        _advance(resetTokenStart) {
            if (this._index < this._input.length) {
                this._index++;
                this._next = this._input.charCodeAt(this._index);
                if (resetTokenStart) {
                    this._tokenStart = this._index;
                }
            }
            else {
                this._next = null;
            }
        }
        _getValue(lookahead) {
            const v = this._input.substring(this._tokenStart, this._index + (lookahead || 0));
            if (!lookahead)
                this._clearValue();
            return v;
        }
        _clearValue() {
            this._tokenStart = this._index;
        }
        _tokenizeString() {
            const _us = 'unterminated string';
            const quoteChar = this._next;
            this._advance(true);
            while (this._next !== quoteChar) {
                if (!this._next)
                    throw new Error(_us);
                if (this._next === 92 /* \ */) {
                    this._advance();
                    if (!this._next)
                        throw new Error(_us);
                }
                this._advance();
            }
            const t = token(Kind.STRING, _escapeString(this._getValue()));
            this._advance();
            return t;
        }
        _tokenizeIdentOrKeyword() {
            while (_isIdentifier(this._next)) {
                this._advance();
            }
            const value = this._getValue();
            const kind = _isKeyword(value) ? Kind.KEYWORD : Kind.IDENTIFIER;
            return token(kind, value);
        }
        _tokenizeNumber() {
            while (_isNumber(this._next)) {
                this._advance();
            }
            if (this._next === 46 /* . */)
                return this._tokenizeDot();
            return token(Kind.INTEGER, this._getValue());
        }
        _tokenizeDot() {
            this._advance();
            if (_isNumber(this._next))
                return this._tokenizeFraction();
            this._clearValue();
            return token(Kind.DOT, '.', constants_1.POSTFIX_PRECEDENCE);
        }
        _tokenizeComma() {
            this._advance(true);
            return token(Kind.COMMA, ',');
        }
        _tokenizeColon() {
            this._advance(true);
            return token(Kind.COLON, ':');
        }
        _tokenizeFraction() {
            while (_isNumber(this._next)) {
                this._advance();
            }
            return token(Kind.DECIMAL, this._getValue());
        }
        _tokenizeOperator() {
            this._advance();
            let op = this._getValue(2);
            if (_THREE_CHAR_OPS.indexOf(op) !== -1) {
                this._advance();
                this._advance();
            }
            else {
                op = this._getValue(1);
                if (_TWO_CHAR_OPS.indexOf(op) !== -1) {
                    this._advance();
                }
            }
            op = this._getValue();
            return token(Kind.OPERATOR, op, constants_1.PRECEDENCE[op]);
        }
        _tokenizeGrouper() {
            const value = String.fromCharCode(this._next);
            const t = token(Kind.GROUPER, value, constants_1.PRECEDENCE[value]);
            this._advance(true);
            return t;
        }
    }
    exports.Tokenizer = Tokenizer;
});
define("polymer-expressions/parser", ["require", "exports", "polymer-expressions/constants", "polymer-expressions/tokenizer"], function (require, exports, constants_2, tokenizer_1) {
    "use strict";
    function parse(expr, astFactory) {
        return new Parser(expr, astFactory).parse();
    }
    exports.parse = parse;
    class Parser {
        constructor(input, astFactory) {
            this._kind = null;
            this._token = null;
            this._value = null;
            this._tokenizer = new tokenizer_1.Tokenizer(input);
            this._ast = astFactory;
        }
        parse() {
            this._advance();
            return this._parseExpression();
        }
        _advance(kind, value) {
            if (!this._matches(kind, value)) {
                throw new Error(`Expected kind ${kind} (${value}), was ${this._token}`);
            }
            const t = this._tokenizer.nextToken();
            this._token = t;
            this._kind = t && t.kind;
            this._value = t && t.value;
        }
        _matches(kind, value) {
            return !(kind && (this._kind !== kind) || value && (this._value !== value));
        }
        _parseExpression() {
            if (!this._token)
                return this._ast.empty();
            const expr = this._parseUnary();
            return (!expr) ? null : this._parsePrecedence(expr, 0);
        }
        // _parsePrecedence and _parseBinary implement the precedence climbing
        // algorithm as described in:
        // http://en.wikipedia.org/wiki/Operator-precedence_parser#Precedence_climbing_method
        _parsePrecedence(left, precedence) {
            if (!left) {
                throw new Error('Expected left not to be null.');
            }
            while (this._token) {
                if (this._matches(tokenizer_1.Kind.GROUPER, '(')) {
                    const args = this._parseArguments();
                    left = this._ast.invoke(left, null, args);
                }
                else if (this._matches(tokenizer_1.Kind.GROUPER, '[')) {
                    const indexExpr = this._parseIndex();
                    left = this._ast.index(left, indexExpr);
                }
                else if (this._matches(tokenizer_1.Kind.DOT)) {
                    this._advance();
                    const right = this._parseUnary();
                    left = this._makeInvokeOrGetter(left, right);
                }
                else if (this._matches(tokenizer_1.Kind.KEYWORD)) {
                    break;
                }
                else if (this._matches(tokenizer_1.Kind.OPERATOR) &&
                    this._token.precedence >= precedence) {
                    left = this._value === '?' ? this._parseTernary(left) :
                        this._parseBinary(left, this._token);
                }
                else {
                    break;
                }
            }
            return left;
        }
        _makeInvokeOrGetter(left, right) {
            if (right.type === 'ID') {
                return this._ast.getter(left, right.value);
            }
            else if (right.type === 'Invoke' && right.receiver.type === 'ID') {
                const method = right.receiver;
                return this._ast.invoke(left, method.value, right.arguments);
            }
            else {
                throw new Error(`expected identifier: ${right}`);
            }
        }
        _parseBinary(left, op) {
            if (constants_2.BINARY_OPERATORS.indexOf(op.value) === -1) {
                throw new Error(`unknown operator: ${op.value}`);
            }
            this._advance();
            let right = this._parseUnary();
            while ((this._kind === tokenizer_1.Kind.OPERATOR || this._kind === tokenizer_1.Kind.DOT ||
                this._kind === tokenizer_1.Kind.GROUPER) &&
                this._token.precedence > op.precedence) {
                right = this._parsePrecedence(right, this._token.precedence);
            }
            return this._ast.binary(left, op.value, right);
        }
        _parseUnary() {
            if (this._matches(tokenizer_1.Kind.OPERATOR)) {
                const value = this._value;
                this._advance();
                // handle unary + and - on numbers as part of the literal, not as a
                // unary operator
                if (value === '+' || value === '-') {
                    if (this._matches(tokenizer_1.Kind.INTEGER)) {
                        return this._parseInteger(value);
                    }
                    else if (this._matches(tokenizer_1.Kind.DECIMAL)) {
                        return this._parseDecimal(value);
                    }
                }
                if (constants_2.UNARY_OPERATORS.indexOf(value) === -1)
                    throw new Error(`unexpected token: ${value}`);
                const expr = this._parsePrecedence(this._parsePrimary(), constants_2.POSTFIX_PRECEDENCE);
                return this._ast.unary(value, expr);
            }
            return this._parsePrimary();
        }
        _parseTernary(condition) {
            this._advance(tokenizer_1.Kind.OPERATOR, '?');
            const trueExpr = this._parseExpression();
            this._advance(tokenizer_1.Kind.COLON);
            const falseExpr = this._parseExpression();
            return this._ast.ternary(condition, trueExpr, falseExpr);
        }
        _parsePrimary() {
            switch (this._kind) {
                case tokenizer_1.Kind.KEYWORD:
                    const keyword = this._value;
                    if (keyword === 'this') {
                        this._advance();
                        // TODO(justin): return keyword node
                        return this._ast.id(keyword);
                    }
                    else if (constants_2.KEYWORDS.indexOf(keyword) !== -1) {
                        throw new Error(`unexpected keyword: ${keyword}`);
                    }
                    throw new Error(`unrecognized keyword: ${keyword}`);
                case tokenizer_1.Kind.IDENTIFIER:
                    return this._parseInvokeOrIdentifier();
                case tokenizer_1.Kind.STRING:
                    return this._parseString();
                case tokenizer_1.Kind.INTEGER:
                    return this._parseInteger();
                case tokenizer_1.Kind.DECIMAL:
                    return this._parseDecimal();
                case tokenizer_1.Kind.GROUPER:
                    if (this._value === '(') {
                        return this._parseParen();
                    }
                    else if (this._value === '{') {
                        return this._parseMap();
                    }
                    else if (this._value === '[') {
                        return this._parseList();
                    }
                    return null;
                case tokenizer_1.Kind.COLON:
                    throw new Error('unexpected token ":"');
                default:
                    return null;
            }
        }
        _parseList() {
            const items = [];
            do {
                this._advance();
                if (this._matches(tokenizer_1.Kind.GROUPER, ']'))
                    break;
                items.push(this._parseExpression());
            } while (this._matches(tokenizer_1.Kind.COMMA));
            this._advance(tokenizer_1.Kind.GROUPER, ']');
            return this._ast.list(items);
        }
        _parseMap() {
            const entries = {};
            do {
                this._advance();
                if (this._matches(tokenizer_1.Kind.GROUPER, '}'))
                    break;
                const key = this._value;
                this._advance(tokenizer_1.Kind.STRING);
                this._advance(tokenizer_1.Kind.COLON);
                entries[key] = this._parseExpression();
            } while (this._matches(tokenizer_1.Kind.COMMA));
            this._advance(tokenizer_1.Kind.GROUPER, '}');
            return this._ast.map(entries);
        }
        _parseInvokeOrIdentifier() {
            const value = this._value;
            if (value === 'true') {
                this._advance();
                return this._ast.literal(true);
            }
            if (value === 'false') {
                this._advance();
                return this._ast.literal(false);
            }
            if (value === 'null') {
                this._advance();
                return this._ast.literal(null);
            }
            const identifier = this._parseIdentifier();
            const args = this._parseArguments();
            return (!args) ? identifier : this._ast.invoke(identifier, null, args);
        }
        _parseIdentifier() {
            if (!this._matches(tokenizer_1.Kind.IDENTIFIER)) {
                throw new Error(`expected identifier: ${this._value}`);
            }
            const value = this._value;
            this._advance();
            return this._ast.id(value);
        }
        _parseArguments() {
            if (this._matches(tokenizer_1.Kind.GROUPER, '(')) {
                const args = [];
                do {
                    this._advance();
                    if (this._matches(tokenizer_1.Kind.GROUPER, ')')) {
                        break;
                    }
                    const expr = this._parseExpression();
                    args.push(expr);
                } while (this._matches(tokenizer_1.Kind.COMMA));
                this._advance(tokenizer_1.Kind.GROUPER, ')');
                return args;
            }
            return null;
        }
        _parseIndex() {
            if (this._matches(tokenizer_1.Kind.GROUPER, '[')) {
                this._advance();
                const expr = this._parseExpression();
                this._advance(tokenizer_1.Kind.GROUPER, ']');
                return expr;
            }
            return null;
        }
        _parseParen() {
            this._advance();
            const expr = this._parseExpression();
            this._advance(tokenizer_1.Kind.GROUPER, ')');
            return this._ast.paren(expr);
        }
        _parseString() {
            const value = this._ast.literal(this._value);
            this._advance();
            return value;
        }
        _parseInteger(prefix) {
            prefix = prefix || '';
            const value = this._ast.literal(parseInt(`${prefix}${this._value}`, 10));
            this._advance();
            return value;
        }
        _parseDecimal(prefix) {
            prefix = prefix || '';
            const value = this._ast.literal(parseFloat(`${prefix}${this._value}`));
            this._advance();
            return value;
        }
    }
    exports.Parser = Parser;
});
define("polymer-expressions/eval", ["require", "exports"], function (require, exports) {
    "use strict";
    const _BINARY_OPERATORS = {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
        '%': (a, b) => a % b,
        '==': (a, b) => a == b,
        '!=': (a, b) => a != b,
        '===': (a, b) => a === b,
        '!==': (a, b) => a !== b,
        '>': (a, b) => a > b,
        '>=': (a, b) => a >= b,
        '<': (a, b) => a < b,
        '<=': (a, b) => a <= b,
        '||': (a, b) => a || b,
        '&&': (a, b) => a && b,
        '|': (a, f) => f(a),
    };
    const _UNARY_OPERATORS = {
        '+': (a) => a,
        '-': (a) => -a,
        '!': (a) => !a,
    };
    class EvalAstFactory {
        empty() {
            // TODO(justinfagnani): return null instead?
            return {
                type: 'Empty',
                evaluate(scope) {
                    return scope;
                },
                getIds(idents) {
                    return idents;
                },
            };
        }
        // TODO(justinfagnani): just use a JS literal?
        literal(v) {
            return {
                type: 'Literal',
                value: v,
                evaluate(_scope) {
                    return this.value;
                },
                getIds(idents) {
                    return idents;
                },
            };
        }
        id(v) {
            return {
                type: 'ID',
                value: v,
                evaluate(scope) {
                    // TODO(justinfagnani): this prevernts access to properties named 'this'
                    if (this.value === 'this')
                        return scope;
                    return scope[this.value];
                },
                getIds(idents) {
                    idents.push(this.value);
                    return idents;
                },
            };
        }
        unary(op, expr) {
            const f = _UNARY_OPERATORS[op];
            return {
                type: 'Unary',
                operator: op,
                child: expr,
                evaluate(scope) {
                    return f(this.child.evaluate(scope));
                },
                getIds(idents) {
                    return this.child.getIds(idents);
                },
            };
        }
        binary(l, op, r) {
            const f = _BINARY_OPERATORS[op];
            return {
                type: 'Binary',
                operator: op,
                left: l,
                right: r,
                evaluate(scope) {
                    return f(this.left.evaluate(scope), this.right.evaluate(scope));
                },
                getIds(idents) {
                    this.left.getIds(idents);
                    this.right.getIds(idents);
                    return idents;
                },
            };
        }
        getter(g, n) {
            return {
                type: 'Getter',
                receiver: g,
                name: n,
                evaluate(scope) {
                    return this.receiver.evaluate(scope)[this.name];
                },
                getIds(idents) {
                    this.receiver.getIds(idents);
                    return idents;
                },
            };
        }
        invoke(receiver, method, args) {
            if (method != null && typeof method !== 'string') {
                throw new Error('method not a string');
            }
            return {
                type: 'Invoke',
                receiver: receiver,
                method: method,
                arguments: args,
                evaluate(scope) {
                    const receiver = this.receiver.evaluate(scope);
                    // TODO(justinfagnani): this might be wrong in cases where we're
                    // invoking a top-level function rather than a method. If method is
                    // defined on a nested scope, then we should probably set _this to null.
                    const _this = this.method ? receiver : scope['this'] || scope;
                    const f = this.method ? receiver[method] : receiver;
                    const args = this.arguments || [];
                    const argValues = args.map((a) => (a && a.evaluate(scope)));
                    return f.apply(_this, argValues);
                },
                getIds(idents) {
                    this.receiver.getIds(idents);
                    (this.arguments || []).forEach((a) => (a && a.getIds(idents)));
                    return idents;
                },
            };
        }
        paren(e) {
            return e;
        }
        index(e, a) {
            return {
                type: 'Index',
                receiver: e,
                argument: a,
                evaluate(scope) {
                    return this.receiver.evaluate(scope)[this.argument.evaluate(scope)];
                },
                getIds(idents) {
                    this.receiver.getIds(idents);
                    return idents;
                },
            };
        }
        ternary(c, t, f) {
            return {
                type: 'Ternary',
                condition: c,
                trueExpr: t,
                falseExpr: f,
                evaluate(scope) {
                    const c = this.condition.evaluate(scope);
                    if (c) {
                        return this.trueExpr.evaluate(scope);
                    }
                    else {
                        return this.falseExpr.evaluate(scope);
                    }
                },
                getIds(idents) {
                    this.condition.getIds(idents);
                    this.trueExpr.getIds(idents);
                    this.falseExpr.getIds(idents);
                    return idents;
                },
            };
        }
        map(entries) {
            return {
                type: 'Map',
                entries: entries,
                evaluate(scope) {
                    const map = {};
                    if (entries && this.entries) {
                        for (const key in entries) {
                            const val = this.entries[key];
                            if (val) {
                                map[key] = val.evaluate(scope);
                            }
                        }
                    }
                    return map;
                },
                getIds(idents) {
                    if (entries && this.entries) {
                        for (const key in entries) {
                            const val = this.entries[key];
                            if (val) {
                                val.getIds(idents);
                            }
                        }
                    }
                    return idents;
                },
            };
        }
        // TODO(justinfagnani): if the list is deeply literal
        list(l) {
            return {
                type: 'List',
                items: l,
                evaluate(scope) {
                    return (this.items || []).map((a) => (a && a.evaluate(scope)));
                },
                getIds(idents) {
                    (this.items || []).forEach((i) => (i && i.getIds(idents)));
                    return idents;
                },
            };
        }
    }
    exports.EvalAstFactory = EvalAstFactory;
});
define("polymer-expressions", ["require", "exports", "polymer-expressions/parser", "polymer-expressions/ast_factory", "polymer-expressions/eval"], function (require, exports, parser_1, ast_factory_1, eval_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    __export(parser_1);
    __export(ast_factory_1);
    __export(eval_1);
});
//# sourceMappingURL=polymer-expressions.js.map