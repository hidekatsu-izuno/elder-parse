import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { CstNode } from "../src/cst.ts";
import { SourceLocation, Token } from "../src/lexer.ts";
import { TestLexer } from "./common/TestLexer.ts";
import { TestParser } from "./common/TestParser.ts";

suite("test lexer and parser", () => {
	test("test lexer", () => {
		const lexer = new TestLexer({
			skipTokenStrategy: "ignore",
		});
		const content = "CALC ((1 +3.1*2) / 4) MOD 2";
		const tokens = lexer.lex(content);
		assert.deepEqual(tokens, [
			new Token(TestLexer.Start, ""),
			new Token(TestLexer.Reserved, "CALC", {
				keyword: TestLexer.CALC,
				location: new SourceLocation(content, 1, 0),
			}),
			new Token(TestLexer.LeftParen, "(", {
				location: new SourceLocation(content, 1, 5),
			}),
			new Token(TestLexer.LeftParen, "(", {
				location: new SourceLocation(content, 1, 6),
			}),
			new Token(TestLexer.Numeric, "1", {
				location: new SourceLocation(content, 1, 7),
			}),
			new Token(TestLexer.Plus, "+", {
				location: new SourceLocation(content, 1, 9),
			}),
			new Token(TestLexer.Numeric, "3.1", {
				location: new SourceLocation(content, 1, 10),
			}),
			new Token(TestLexer.Prime, "*", {
				location: new SourceLocation(content, 1, 13),
			}),
			new Token(TestLexer.Numeric, "2", {
				location: new SourceLocation(content, 1, 14),
			}),
			new Token(TestLexer.RightParen, ")", {
				location: new SourceLocation(content, 1, 15),
			}),
			new Token(TestLexer.Slash, "/", {
				location: new SourceLocation(content, 1, 17),
			}),
			new Token(TestLexer.Numeric, "4", {
				location: new SourceLocation(content, 1, 19),
			}),
			new Token(TestLexer.RightParen, ")", {
				location: new SourceLocation(content, 1, 20),
			}),
			new Token(TestLexer.Identifier, "MOD", {
				keyword: TestLexer.MOD,
				location: new SourceLocation(content, 1, 22),
			}),
			new Token(TestLexer.Numeric, "2", {
				location: new SourceLocation(content, 1, 26),
			}),
			new Token(TestLexer.EoF, "", {
				location: new SourceLocation(content, 1, 27),
			}),
		]);
	});

	test("test parser", () => {
		const parser = new TestParser({
			skipTokenStrategy: "ignore",
			location: false,
			empty: false,
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

	test("test parser error", () => {
		const parser1 = new TestParser({
			empty: false,
		});
		try {
			parser1.parse("CALC\n ((1 +3.1*2) / 4) MO 2");
			assert.fail();
		} catch (err) {
			assert.equal(
				(err as Error).message,
				"[2,18] Unexpected token: MO\n" +
					"1 |CALC\n" +
					"2>| ((1 +3.1*2) / 4) \u2BC6MO 2",
			);
		}
		const parser2 = new TestParser({
			empty: false,
		});
		try {
			parser2.parse("CALC\n ((1\n +3.1\n*2) / \n4) MO 2");
			assert.fail();
		} catch (err) {
			assert.equal(
				(err as Error).message,
				"[5,3] Unexpected token: MO\n" + "4 |*2) / \n" + "5>|4) \u2BC6MO 2",
			);
		}
		const parser3 = new TestParser();
		try {
			parser3.parse("CALC\n ((1\n +3.1\n*2) / \n4) +");
			assert.fail();
		} catch (err) {
			assert.equal(
				(err as Error).message,
				// biome-ignore format: for multiline
				"[5,4] Unexpected token: <EoF>\n" +
				"4 |*2) / \n" +
				"5>|4) +\u2BC6",
			);
		}

		const parser4 = new TestParser();
		const source = new TestLexer().lex(
			"123456789\n\n CALC\n ((1\n +3.1\n*2) +/ \n4)123456789",
			"source4.calc",
		);
		source.shift();
		source.shift();
		source.pop();
		source.pop();

		try {
			parser4.parse(source, {});
			assert.fail();
		} catch (err) {
			assert.equal(
				(err as Error).message,
				// biome-ignore format: for multiline
				"source4.calc[6,5] Unexpected token: /\n" +
				"5 | +3.1\n" +
				"6>|*2) +\u2BC6/ \n" +
				"7 |4)123456789",
			);
		}
	});
});
