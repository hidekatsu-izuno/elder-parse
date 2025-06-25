import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { CstNode } from "../src/cst.ts";
import {
	Lexer,
	type LexerOptions,
	Token,
	type TokenReader,
	TokenType,
} from "../src/lexer.ts";
import { type CstBuilder, Parser, type ParserOptions } from "../src/parser.ts";

class TestLexer extends Lexer {
	static Start = new TokenType("Start", { marker: true });
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

class TestParser extends Parser<TestLexer> {
	constructor(options?: LexerOptions & ParserOptions) {
		super(new TestLexer(options), options);
	}

	protected parseTokens(reader: TokenReader, builder: CstBuilder): void {
		builder.start("Calc");
		while (reader.peekIf(TestLexer.Start)) {
			builder.token(reader.consume());
			if (reader.peekIf(TestLexer.CALC)) {
				builder.token(reader.consume());
				this.parseExpression(reader, builder);
			} else {
				throw reader.createParseError();
			}
		}
		builder.token(reader.consume(TestLexer.EoF));
		builder.end();
	}

	private parseExpression(
		reader: TokenReader,
		builder: CstBuilder,
		priority = 0,
	) {
		if (priority === 0) {
			builder.start("Expression");
		}
		let node: CstNode;
		if (reader.peekIf(TestLexer.LeftParen)) {
			builder.start("GroupExpression");
			reader.consume();
			this.parseExpression(reader, builder, 1);
			reader.consume(TestLexer.RightParen);
			node = builder.end();
		} else {
			node = this.parseReference(reader, builder);
		}
		while (reader.peek() && !reader.peekIf(TestLexer.EoF)) {
			if (priority < 2 && reader.peekIf([TestLexer.Plus, TestLexer.Minus])) {
				builder.start("AddOperation");
				{
					builder.start("Left");
					builder.append(node);
					builder.end();
				}
				{
					builder.start("Operator");
					builder.token(reader.consume());
					builder.end();
				}
				{
					builder.start("Right");
					this.parseExpression(reader, builder, 2);
					builder.end();
				}
				node = builder.end();
			} else if (
				priority < 3 &&
				reader.peekIf([TestLexer.Prime, TestLexer.Slash])
			) {
				builder.start("MultiplyOperation");
				{
					builder.start("Left");
					builder.append(node);
					builder.end();
				}
				{
					builder.start("Operator");
					builder.token(reader.consume());
					builder.end();
				}
				{
					builder.start("Right");
					this.parseExpression(reader, builder, 3);
					builder.end();
				}
				node = builder.end();
			} else if (priority < 4 && reader.peekIf(TestLexer.MOD)) {
				builder.start("ModOperation");
				{
					builder.start("Left");
					builder.append(node);
					builder.end();
				}
				{
					builder.start("Operator");
					builder.token(reader.consume());
					builder.end();
				}
				{
					builder.start("Right");
					this.parseExpression(reader, builder, 4);
					builder.end();
				}
				node = builder.end();
			} else {
				break;
			}
		}
		if (priority === 0) {
			node = builder.end();
		}
		return node;
	}

	private parseReference(reader: TokenReader, builder: CstBuilder) {
		if (reader.peekIf([TestLexer.Plus, TestLexer.Minus], TestLexer.Numeric)) {
			builder.start("NumericLiteral");
			builder.token(reader.consume());
			builder.token(reader.consume());
			return builder.end();
		} else if (reader.peekIf(TestLexer.Numeric)) {
			builder.start("NumericLiteral");
			builder.token(reader.consume());
			return builder.end();
		} else {
			builder.start("VariableRef");
			builder.token(reader.consume(TestLexer.Identifier));
			return builder.end();
		}
	}
}

suite("test lexer and parser", () => {
	test("test lexer", () => {
		const lexer = new TestLexer({
			skipTokenStrategy: "ignore",
			location: false,
		});
		const tokens = lexer.lex("CALC ((1 +3.1*2) / 4) MOD 2");
		assert.deepEqual(tokens, [
			new Token(TestLexer.Start, ""),
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
	});

	test("test parser", () => {
		const parser = new TestParser({
			skipTokenStrategy: "ignore",
			location: false,
			marker: false,
		});
		const root = parser.parse("CALC ((1 +3.1*2) / 4) MOD 2");

		assert.deepEqual(
			root.toJSONString(),
			CstNode.parseJSON([
				"node",
				{ type: "Calc" },
				["token", { type: "Reserved" }, "CALC"],
				[
					"node",
					{ type: "Expression" },
					[
						"node",
						{ type: "ModOperation" },
						[
							"node",
							{ type: "Left" },
							[
								"node",
								{ type: "GroupExpression" },
								[
									"node",
									{ type: "MultiplyOperation" },
									[
										"node",
										{ type: "Left" },
										[
											"node",
											{ type: "GroupExpression" },
											[
												"node",
												{ type: "AddOperation" },
												[
													"node",
													{ type: "Left" },
													[
														"node",
														{ type: "NumericLiteral" },
														["token", { type: "Numeric" }, "1"],
													],
												],
												[
													"node",
													{ type: "Operator" },
													["token", { type: "Plus" }, "+"],
												],
												[
													"node",
													{ type: "Right" },
													[
														"node",
														{ type: "MultiplyOperation" },
														[
															"node",
															{ type: "Left" },
															[
																"node",
																{ type: "NumericLiteral" },
																["token", { type: "Numeric" }, "3.1"],
															],
														],
														[
															"node",
															{ type: "Operator" },
															["token", { type: "Prime" }, "*"],
														],
														[
															"node",
															{ type: "Right" },
															[
																"node",
																{ type: "NumericLiteral" },
																["token", { type: "Numeric" }, "2"],
															],
														],
													],
												],
											],
										],
									],
									[
										"node",
										{ type: "Operator" },
										["token", { type: "Slash" }, "/"],
									],
									[
										"node",
										{ type: "Right" },
										[
											"node",
											{ type: "NumericLiteral" },
											["token", { type: "Numeric" }, "4"],
										],
									],
								],
							],
						],
						[
							"node",
							{ type: "Operator" },
							["token", { type: "Identifier" }, "MOD"],
						],
						[
							"node",
							{ type: "Right" },
							[
								"node",
								{ type: "NumericLiteral" },
								["token", { type: "Numeric" }, "2"],
							],
						],
					],
				],
			]).toJSONString(),
		);
	});
});
