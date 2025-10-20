import { type CstAttrs, CstNode } from "./cst.ts";
import {
	type Lexer,
	type LexerOptions,
	type Token,
	TokenReader,
} from "./lexer.ts";

export declare type ParserOptions = LexerOptions &
	CstBuilderOptions & {
		[key: string]: any;
	};

export declare type ParseOption = {
	source?: string;
	lex?: boolean;
};

export abstract class Parser<L extends Lexer> {
	private lexer: L;
	private options: ParserOptions;

	constructor(lexer: L, options: ParserOptions = {}) {
		this.lexer = lexer;
		this.options = options;
	}

	parse(input: string | Token[], options: ParseOption = {}) {
		let tokens: Token[];
		if (options.lex === false && Array.isArray(input)) {
			tokens = input;
		} else {
			tokens = this.lexer.lex(input, options.source);
		}
		const reader = new TokenReader(tokens);
		const builder = new CstBuilder(this.options);
		this.process(reader, builder);
		return builder.root;
	}

	protected abstract process(reader: TokenReader, builder: CstBuilder): void;
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
	meta?: boolean;
	token?: boolean;
	trivia?: boolean;
	empty?: boolean;
};

const EMPTY_NODE = new CstNode("node", { type: "" });
export class CstBuilder {
	root: CstNode;
	current: CstNode;
	options: {
		meta: boolean;
		token: boolean;
		trivia: boolean;
		empty: boolean;
	};

	constructor(options: CstBuilderOptions = {}) {
		this.root = EMPTY_NODE;
		this.current = EMPTY_NODE;
		this.options = {
			meta: options.meta ?? true,
			token: options.token ?? true,
			trivia: options.trivia ?? true,
			empty: options.empty ?? true,
		};
	}

	start(type: string, attrs?: Omit<CstAttrs, "type">) {
		const props: Record<string, any> = { type };
		if (attrs) {
			for (const key of Object.keys(attrs)) {
				const value = attrs[key];
				if (value !== undefined) {
					props[key] = value;
				}
			}
		}

		const elem = new CstNode("node", props);
		if (this.current === EMPTY_NODE) {
			this.root = elem;
		} else {
			this.current.append(elem);
		}
		this.current = elem;
		return this.current;
	}

	attr(name: string, value: string | number | boolean, context?: CstNode) {
		const current = context ?? this.current;
		current[1][name] = value;
		return value;
	}

	append(child: CstNode, context?: CstNode) {
		const current = context ?? this.current;
		current.append(child);
		return child;
	}

	remove(child: CstNode, context?: CstNode) {
		const current = context ?? this.current;
		current.remove(child);
		return child;
	}

	meta(attrs: CstAttrs, context?: CstNode) {
		const props: Record<string, any> = {};
		for (const key of Object.keys(attrs)) {
			const value = attrs[key];
			if (value !== undefined) {
				props[key] = value;
			}
		}

		const meta = new CstNode("meta", props);
		if (this.options.meta) {
			const current = context ?? this.current;
			current.append(meta);
		}
		return meta;
	}

	token(token: Token, context?: CstNode) {
		const elem = token.subtokens
			? new CstNode("chunk", { type: token.type.name, text: token.text })
			: new CstNode("token", { type: token.type.name });
		if (this.options.trivia) {
			for (const skip of token.preskips) {
				const trivia = new CstNode("trivia", { type: skip.type.name });
				if (skip.text) {
					trivia.append(skip.text);
				}
				elem.append(trivia);
			}
		}
		if (token.subtokens) {
			for (const subtoken of token.subtokens) {
				this.token(subtoken, elem);
			}
		} else if (token.text) {
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
		if (this.options.token && (token.text || this.options.empty)) {
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
