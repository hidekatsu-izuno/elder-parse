import { CstNode } from "./cst.ts";
import type { Lexer, Token } from "./lexer.ts";

export declare type ParserOptions = {
	[key: string]: string;
};

export abstract class Parser {
	private lexer: Lexer;
	private options: ParserOptions;

	constructor(lexer: typeof this.lexer, options: typeof this.options = {}) {
		this.lexer = lexer;
		this.options = options;
	}

	parse(script: string | Token[], filename?: string) {
		const tokens = Array.isArray(script)
			? script
			: this.lexer.lex(script, filename);
		const builder = new CstBuilder(this.options);
		this.parseTokens(tokens, builder);
		return builder.root;
	}

	abstract parseTokens(tokens: Token[], builder: CstBuilder): void;
}

export class AggregateParseError extends Error {
	node: CstNode;
	errors: Error[];

	constructor(node: CstNode, errors: Error[], message: string) {
		super(message);
		this.node = node;
		this.errors = errors;
	}
}

export declare type CstBuilderOptions = {
	token?: boolean;
	trivia?: boolean;
	marker?: boolean;
};

const EMPTY_NODE = new CstNode("node", { type: "" });
export class CstBuilder {
	root: CstNode;
	current: CstNode;
	options: {
		token: boolean;
		trivia: boolean;
		marker: boolean;
	};

	constructor(options: CstBuilderOptions = {}) {
		this.root = EMPTY_NODE;
		this.current = EMPTY_NODE;
		this.options = {
			token: options.token ?? true,
			trivia: options.trivia ?? true,
			marker: options.marker ?? true,
		};
	}

	start(type: string, value?: string | number | boolean) {
		const elem = new CstNode("node", { type });
		if (value != null) {
			elem[1].value = value;
		}
		if (this.current === EMPTY_NODE) {
			this.root = elem;
		} else {
			this.current.append(elem);
		}
		this.current = elem;
		return this.current;
	}

	type(type: string, context?: CstNode) {
		const current = context ?? this.current;
		current[1].type = type;
		return current[1].type;
	}

	value(value: string | number | boolean, context?: CstNode) {
		const current = context ?? this.current;
		current[1].value = value.toString();
		return current[1].value;
	}

	append(child: CstNode, context?: CstNode) {
		const current = context ?? this.current;
		current.append(child);
		return child;
	}

	token(token: Token, context?: CstNode) {
		const elem = new CstNode("token", { type: token.type.name });
		if (this.options.trivia) {
			for (const skip of token.preskips) {
				const trivia = new CstNode("trivia", { type: skip.type.name });
				if (skip.text) {
					trivia.append(skip.text);
				}
				elem.append(trivia);
			}
		}
		if (token.text) {
			elem.append(token.text);
		}
		if (this.options.trivia) {
			for (const skip of token.postskips) {
				const trivia = new CstNode("trivia", { type: skip.type.name });
				if (skip.text) {
					trivia.append(skip.text);
				}
				elem.append(trivia);
			}
		}
		if (
			!this.options.token ||
			this.options.marker ||
			token.text ||
			(this.options.trivia &&
				(token.preskips.length !== 0 || token.postskips.length !== 0))
		) {
			const current = context ?? this.current;
			current.append(elem);
		}
		return token;
	}

	end(start?: CstNode) {
		if (start && start !== this.current) {
			throw new Error("Start and end elements do not match");
		}
		const parent = this.current.parent;
		if (parent) {
			const current = this.current;
			this.current = parent;
			return current;
		} else {
			return this.root;
		}
	}
}
