export class TokenType {
	name: string;
	skip: boolean;
	separator: boolean;

	private hasKeyword = false;
	private map: Record<string, Keyword> = {};
	private imap: Record<string, Keyword> = {};

	constructor(
		name: string,
		options?: {
			skip?: boolean;
			separator?: boolean;
		},
	) {
		this.name = name;
		this.skip = options?.skip ?? false;
		this.separator = options?.separator ?? false;
	}

	newKeyword(
		text: string,
		options?: {
			ignoreCase?: boolean;
			reserved?: boolean;
		},
	) {
		const keyword = new Keyword(text, options);
		if (options?.ignoreCase) {
			this.imap[text.toLowerCase()] = keyword;
		} else {
			this.map[text] = keyword;
		}
		this.hasKeyword = true;
		return keyword;
	}

	getKeyword(name: string): Keyword | undefined {
		if (!this.hasKeyword) {
			return;
		}

		const keyword = this.map[name];
		if (keyword) {
			return keyword;
		}
		return this.imap[name.toLowerCase()];
	}

	toString() {
		return this.name;
	}
}

export class Keyword {
	name: string;
	ignoreCase: boolean;
	reserved: boolean;

	constructor(
		name: string,
		options?: {
			ignoreCase?: boolean;
			reserved?: boolean;
		},
	) {
		this.name = name;
		this.ignoreCase = !!options?.ignoreCase;
		this.reserved = !!options?.reserved;
	}
}

export class SourceLocation {
	content: string;
	lineNumber: number;
	columnNumber: number;
	source?: string;

	constructor(
		content: string,
		lineNumber = 1,
		columnNumber = 0,
		source?: string,
	) {
		this.content = content;
		this.lineNumber = lineNumber;
		this.columnNumber = columnNumber;
		this.source = source;
	}

	clone() {
		return new SourceLocation(
			this.content,
			this.lineNumber,
			this.columnNumber,
			this.source,
		);
	}

	toString() {
		let out = "";
		if (this.source != null) {
			out += this.source;
		}
		out += `[${this.lineNumber},${this.columnNumber}]`;
		return out;
	}
}

export declare type TokenQuery =
	| TokenType
	| Keyword
	| string
	| RegExp
	| ((token: Token) => boolean)
	| TokenQuery[];

export class Token {
	type: TokenType;
	text: string;
	keyword?: Keyword;
	preskips: Token[];
	subtokens?: Token[];
	postskips: Token[];
	location?: SourceLocation;

	constructor(
		type: TokenType,
		text: string,
		options?: {
			keyword?: Keyword;
			preskips?: Token[];
			subtokens?: Token[];
			postskips?: Token[];
			location?: SourceLocation;
		},
	) {
		this.type = type;
		this.text = text;
		this.keyword = options?.keyword;
		this.preskips = options?.preskips ?? [];
		this.subtokens = options?.subtokens;
		this.postskips = options?.postskips ?? [];
		this.location = options?.location;
	}

	is(query: TokenQuery) {
		if (Array.isArray(query)) {
			for (const item of query) {
				if (this.is(item)) {
					return true;
				}
			}
			return false;
		} else if (query instanceof Keyword) {
			return this.keyword === query;
		} else if (query instanceof TokenType) {
			return this.type === query;
		} else if (typeof query === "string") {
			return this.text === query;
		} else if (query instanceof RegExp) {
			return query.test(this.text);
		} else if (typeof query === "function") {
			return !!query(this);
		} else {
			throw new Error(`Invalid query: ${query}`);
		}
	}

	clone() {
		return new Token(this.type, this.text, {
			keyword: this.keyword,
			preskips: [...this.preskips],
			subtokens: this.subtokens ? [...this.subtokens] : undefined,
			postskips: [...this.postskips],
			location: this.location?.clone(),
		});
	}

	toString() {
		if (
			this.preskips.length > 0 ||
			this.subtokens ||
			this.postskips.length > 0
		) {
			let out = "";
			for (const skip of this.preskips) {
				out += skip.toString();
			}
			if (this.subtokens) {
				for (const subtoken of this.subtokens) {
					out += subtoken.toString();
				}
			} else {
				out += this.text;
			}
			for (const skip of this.postskips) {
				out += skip.toString();
			}
			return out;
		}
		return this.text;
	}
}

export declare type TokenPattern = {
	type: TokenType;
	re: RegExp | ((state: Record<string, any>) => RegExp | false);
	skip?: boolean;
	separator?: boolean;
	onMatch?: (state: Record<string, any>, token: Token) => Token[] | void;
	onUnmatch?: (state: Record<string, any>) => void;
};

export declare type LexerOptions = {
	skipTokenStrategy?: "ignore" | "next" | "adaptive";
	[key: string]: any;
};

export abstract class Lexer {
	static Reserved = new TokenType("Reserved");
	static EoF = new TokenType("EoF");
	static Error = new TokenType("Error", { separator: true });

	name: string;
	patterns: TokenPattern[];
	options: LexerOptions = {};

	constructor(
		name: string,
		patterns: TokenPattern[],
		options: LexerOptions = {},
	) {
		this.name = name;
		this.patterns = [
			...patterns,
			{ type: Lexer.Error, re: /./y, separator: true },
		];
		this.options = { ...options };
		if (!this.options.skipTokenStrategy) {
			this.options.skipTokenStrategy = "adaptive";
		}
		if (this.options.patternFilter) {
			this.patterns = this.options.patternFilter(this.patterns);
		}
	}

	lex(input: string | Token[], source?: string) {
		const state = {};
		this.initState(state);

		if (typeof input === "string") {
			return this.sublex(state, input, new SourceLocation(input, 1, 0, source));
		}

		const mapping = [];
		let text = "";
		for (const token of input) {
			mapping.push(token.location);
			text += `${token.text}\n`;
		}
		const tokens = this.sublex(
			state,
			text,
			new SourceLocation(text, 1, 0, source),
		);
		for (const token of tokens) {
			let sloc: SourceLocation | undefined;
			if (token.location?.lineNumber != null) {
				sloc = mapping[token.location.lineNumber - 1];
			}
			token.location = sloc;
		}
		return tokens;
	}

	isReserved(keyword: Keyword) {
		return keyword.reserved;
	}

	protected initState(state: Record<string, any>) {}

	protected sublex(
		state: Record<string, any>,
		input: string,
		start?: SourceLocation,
	) {
		const tokens: Token[] = [];
		let pos = 0;
		const content = start ? start.content : input;
		let lineNumber = start ? start.lineNumber : 1;
		let columnNumber = start ? start.columnNumber : 0;
		const source = start?.source;

		let skips = [];
		while (pos < input.length) {
			let pattern: TokenPattern | undefined;
			let text: string | undefined;
			let location: SourceLocation | undefined;
			for (const pat of this.patterns) {
				const re = typeof pat.re === "function" ? pat.re(state) : pat.re;
				if (re) {
					re.lastIndex = pos;
					const m = re.exec(input);
					if (m) {
						pattern = pat;
						text = m[0];
						location = new SourceLocation(
							content,
							lineNumber,
							columnNumber,
							source,
						);
						pos = re.lastIndex;
						break;
					}
				}
				if (pat.onUnmatch) {
					pat.onUnmatch(state);
				}
			}

			if (pattern == null || text == null) {
				throw new Error(`Failed to tokenize: ${pos}`);
			}

			const token = new Token(pattern.type, text, {
				location,
			});
			const keyword = token.type.getKeyword(token.text);
			if (keyword) {
				token.keyword = keyword;
				if (this.isReserved(keyword)) {
					token.type = Lexer.Reserved;
				}
			}
			const newTokens = pattern.onMatch?.(state, token);
			if (newTokens && newTokens.length > 0) {
				skips.push(...newTokens[0].preskips);
				newTokens[0].preskips = [];

				for (const newToken of newTokens) {
					if (newToken.keyword) {
						continue;
					}

					const keyword = token.type.getKeyword(token.text);
					if (keyword) {
						newToken.keyword = keyword;
						if (this.isReserved(keyword)) {
							newToken.type = Lexer.Reserved;
						}
					}
				}
			}
			for (const newToken of newTokens || [token]) {
				if (newToken.type.skip) {
					if (this.options.skipTokenStrategy !== "ignore") {
						skips.push(newToken);
					}
				}

				if (this.options.skipTokenStrategy === "adaptive") {
					if (newToken.type.separator) {
						const last = tokens[tokens.length - 1];
						if (last && last.postskips.length === 0 && skips.length > 0) {
							last.postskips.push(...skips);
							skips = [];
						}
					}
				}

				if (!newToken.type.skip) {
					if (skips.length > 0) {
						newToken.preskips.push(...skips);
						skips = [];
					}
					tokens.push(newToken);
				}
			}
			if (newTokens && newTokens.length > 0) {
				const last = tokens[tokens.length - 1];
				if (last && last.type === Lexer.EoF) {
					if (this.options.skipTokenStrategy !== "ignore") {
						skips.push(...last.preskips);
						skips.push(...last.postskips);
					}
					tokens.pop();
				}
			}

			let index = text.indexOf("\n");
			if (index !== -1) {
				let lastIndex: number;
				do {
					lastIndex = index + 1;
					lineNumber++;
					index = text.indexOf("\n", lastIndex);
				} while (index !== -1);
				columnNumber = text.length - lastIndex;
			} else {
				columnNumber += text.length;
			}
		}

		tokens.push(
			new Token(Lexer.EoF, "", {
				preskips: skips,
				location: new SourceLocation(content, lineNumber, columnNumber, source),
			}),
		);

		return tokens;
	}
}

export class TokenReader {
	tokens: Token[];
	pos = 0;
	state: Record<string, any> = {};

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	peek(pos = 0) {
		return this.tokens[this.pos + pos];
	}

	peekIf(
		...queries: (
			| TokenQuery
			| { query: TokenQuery; min?: number; max?: number }
		)[]
	) {
		if (queries.length === 0) {
			throw new RangeError("conditions must be at least one.");
		}

		let pos = 0;
		for (const query of queries) {
			if (!query) {
				throw new RangeError("condition must not be empty.");
			}

			const token = this.peek(pos);
			if (typeof query === "object" && query != null && "query" in query) {
				const min = query.min ?? 1;
				const max = query.max ?? 1;
				let count = 0;
				while (count < max) {
					if (this.peek(pos + count)?.is(query.query)) {
						count++;
					} else {
						break;
					}
				}
				if (count < min) {
					return false;
				}
				pos += count;
			} else if (token?.is(query)) {
				pos++;
			} else {
				return false;
			}
		}
		return true;
	}

	consume(condition?: TokenQuery) {
		const token = this.peek();
		if (token == null) {
			throw this.createParseError();
		}
		if (condition != null && !token.is(condition)) {
			throw this.createParseError();
		}
		this.pos++;
		return token;
	}

	createParseError(options: { message?: string } = {}) {
		const token = this.peek();
		let message = options.message ?? "Unexpected token";
		let text = token && token.type !== Lexer.EoF ? token.text : "<EoF>";
		if (token?.location) {
			message = `${token.location} ${message}`;

			if (token.location.content) {
				const lineNumber = token.location.lineNumber;
				const columnNumber = token.location.columnNumber;
				const lines = token.location.content.split(/\r?\n/g);
				const numSize = `${lines.length}`.length;
				if (lineNumber >= 2 && lineNumber - 2 < lines.length) {
					text += `\n${`${lineNumber - 1}`.padStart(numSize, "0")} |${lines[lineNumber - 2]}`;
				}
				if (lineNumber >= 1 && lineNumber - 1 < lines.length) {
					let line = lines[token.location.lineNumber - 1];
					if (columnNumber === 0) {
						line = `\u2BC6${line}`;
					} else if (columnNumber < line.length) {
						line = `${line.substring(0, columnNumber)}\u2BC6${line.substring(columnNumber)}`;
					} else {
						line += "\u2BC6";
					}
					text += `\n${`${lineNumber}`.padStart(numSize, "0")}>|${line}`;
				}
				if (lineNumber >= 0 && lineNumber < lines.length) {
					text += `\n${`${lineNumber + 1}`.padStart(numSize, "0")} |${lines[lineNumber]}`;
				}
			}

			const err = new ParseError(`${message}: ${text}`);
			err.lineNumber = token.location.lineNumber;
			err.columnNumber = token.location.columnNumber;
			err.source = token.location.source;
			return err;
		}
		return new ParseError(`${message}: ${text}`);
	}
}

export class ParseError extends Error {
	source?: string;
	lineNumber?: number;
	columnNumber?: number;

	constructor(message: string) {
		super(message);
		this.name = "ParseError";
	}
}
