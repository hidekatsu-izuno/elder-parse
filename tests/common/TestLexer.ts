import { Lexer, type LexerOptions, Token, TokenType } from "../../src/lexer.ts";

export class TestLexer extends Lexer {
	static Start = new TokenType("Start");
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
				{
					type: TestLexer.Identifier,
					re: /[A-Za-z][A-Za-z0-9]*/y,
					onMatch: (state, token) => this.onMatchIdentifier(token),
				},
			],
			options,
		);
	}

	private onMatchIdentifier(token: Token) {
		if (token.is(TestLexer.CALC)) {
			return [new Token(TestLexer.Start, ""), token];
		}
	}
}
