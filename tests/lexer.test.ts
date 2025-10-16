import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { CstNode } from "../src/cst.ts";
import { Token } from "../src/lexer.ts";
import { TestLexer } from "./common/TestLexer.ts";
import { TestParser } from "./common/TestParser.ts";

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
		/*
		const parser1 = new TestParser({
			location: false,
			empty: false,
		});
		try {
			parser1.parse("CALC\n ((1 +3.1*2) / 4) MO 2");
			assert.fail();
		} catch (err) {
			assert.equal(
				(err as Error).message,
				"Unexpected token: MO",
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
				"[5,4] Unexpected token: MO\n" + 
				"4 |*2) / \n" + 
				"5>|4) M☚O 2",
			);
		}
		*/
		const parser3 = new TestParser();
		try {
			parser3.parse("CALC\n ((1\n +3.1\n*2) / \n4) +");
			assert.fail();
		} catch (err) {
			assert.equal(
				(err as Error).message,
				"[5,4] Unexpected token: <EoF>\n" +
					"4 |*2) / \n" +
					"5>|4) +\u261A",
			);
		}

		const parser4 = new TestParser();
		try {
			parser4.parse("CALC\n ((1\n +3.1\n*2) / \n4) +", {
				source: "source4.calc"
			});
			assert.fail();
		} catch (err) {
			assert.equal(
				(err as Error).message,
				"source4.calc[5,4] Unexpected token: <EoF>\n" +
					"4 |*2) / \n" +
					"5>|4) +\u261A",
			);
		}
	});
});
