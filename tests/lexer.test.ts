import assert from "node:assert/strict";
import { suite, test } from "node:test";
import {
	Lexer,
	type LexerOptions,
	Token,
	TokenReader,
	TokenType,
} from "../src/lexer.ts";
import { type CstBuilder, Parser, type ParserOptions } from "../src/parser.ts";

class TestLexer extends Lexer {
	static Space = new TokenType("Space", { skip: true });
	static Identifier = new TokenType("Identifier");
	static Numeric = new TokenType("Numeric");
	static LeftParen = new TokenType("LeftParen");
	static RightParen = new TokenType("RightParen");
	static Plus = new TokenType("Plus");
	static Minus = new TokenType("Minus");
	static Prime = new TokenType("Prime");
	static Slash = new TokenType("Slash");

	static CALC = this.Identifier.newKeyword("CALC", { reserved: true });
	static MOD = this.Identifier.newKeyword("MOD", { ignoreCase: true });

	constructor(options: LexerOptions = {}) {
		super(
			"test",
			[
				{ type: TestLexer.Space, re: /[ \r\n]+/y, skip: true },
				{ type: TestLexer.LeftParen, re: /[(]/y },
				{ type: TestLexer.RightParen, re: /[)]/y },
				{ type: TestLexer.Plus, re: /[+]/y },
				{ type: TestLexer.Minus, re: /[-]/y },
				{ type: TestLexer.Prime, re: /[*]/y },
				{ type: TestLexer.Slash, re: /[/]/y },
				{ type: TestLexer.Numeric, re: /(?:0|[1-9][0-9]*)(?:\.[0-9]*)?/y },
				{ type: TestLexer.Identifier, re: /[A-Za-z][A-Za-z0-9]*/y },
			],
			options,
		);
	}
}

class TestParser extends Parser {
	constructor(options?: ParserOptions) {
		super(new TestLexer(), options);
	}

	parseTokens(tokens: Token[], builder: CstBuilder): void {
		const reader = new TokenReader(tokens);
		builder.start("Calc");
		if (reader.peekIf(TestLexer.CALC)) {
		}
		builder.end();
	}
}

suite("test lexer", () => {
	test("test calcuration", () => {
		const lexer = new TestLexer({
			skipTokenStrategy: "ignore",
			location: false,
		});
		const tokens = lexer.lex("CALC ((1 +3.1*2) / 4) MOD 2");
		assert.deepEqual(tokens, [
			new Token(TestLexer.Reserved, "CALC", { keyword: TestLexer.CALC }),
			new Token(TestLexer.LeftParen, "("),
			new Token(TestLexer.LeftParen, "("),
			new Token(TestLexer.Numeric, "1"),
			new Token(TestLexer.Plus, "+"),
			new Token(TestLexer.Numeric, "3.1"),
			new Token(TestLexer.Prime, "*"),
			new Token(TestLexer.Numeric, "2"),
			new Token(TestLexer.RightParen, ")"),
			new Token(TestLexer.Slash, "/"),
			new Token(TestLexer.Numeric, "4"),
			new Token(TestLexer.RightParen, ")"),
			new Token(TestLexer.Identifier, "MOD", { keyword: TestLexer.MOD }),
			new Token(TestLexer.Numeric, "2"),
			new Token(TestLexer.EoF, ""),
		]);

		new TestParser();
	});
});
