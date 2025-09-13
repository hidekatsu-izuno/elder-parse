import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { CstNode } from "../src/cst.ts";
import { Token, TokenType } from "../src/lexer.ts";
import { CstBuilder } from "../src/parser.ts";

suite("test cst", () => {
	test("test parse", () => {
		const actual = CstNode.parseJSON(`
			["node", { "type": "a" },
				["node", { "type": "b", "attr": "b2" },
					["node", { "type": "text", "value": "text" },
						["token", { "type": "token" }, "test"]
					],
					["node", { "type": "100", "value": 100 }],
					["node", { "type": "true", "value": true }],
					["node", { "type": "undefined" }]
				],
				["meta", { "extra": "c" }]
			]
		`);
		const builder = new CstBuilder();
		builder.start("a");
		{
			builder.start("b", { attr: "b2" });
			{
				builder.start("text", { value: "text" });
				builder.token(new Token(new TokenType("token"), "test"));
				builder.end();

				builder.start("100", { value: 100 });
				builder.end();

				builder.start("true", { value: true });
				builder.end();

				builder.start("undefined", { value: undefined });
				builder.end();
			}
			builder.end();
			builder.meta({ extra: "c" });
		}
		const expected = builder.end();
		assert.deepEqual(actual.toXMLString(), expected.toXMLString());

		try {
			CstNode.parseJSON(["node", { "type": "a", "__proto__": "" }]);
			assert.fail();
		} catch (err: unknown) {
			assert.ok(err);
		}
	});

	test("test is", () => {
		const cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"node",
				{ type: "b", value: "b2" },
				["node", { type: "b", value: "b3" }],
				["node", { type: "ba", value: "ba1" }],
				["node", { type: "ba", value: "ba2" }],
				["node", { type: "ba", value: "ba3" }],
			],
			["node", { type: "c" }],
		]);
		assert.equal(cst.is("[type=a]"), true);
		assert.equal(cst.is(":has(> [type=b])"), true);
		assert.equal(cst.is(":has(> [type=c])"), true);
		assert.equal(cst.is(":has(> [type=ba])"), false);
		assert.equal(!!cst.selectOne("> [type=b] > [type=ba]"), true);
		assert.equal(cst.is(":has(> [type=b] > [type=ba])"), true);
	});

	test("test selectOne/selectParent/selectAll", () => {
		const cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			["node", { type: "a", value: "a1" }],
			["node", { type: "b", value: "b1" }],
			[
				"node",
				{ type: "b", value: "b2" },
				["node", { type: "b", value: "b3" }],
				["node", { type: "ba", value: "ba1" }],
				["node", { type: "ba", value: "ba2" }],
				["node", { type: "ba", value: "ba3" }],
			],
			["node", { type: "c", value: "c1" }],
			["node", { type: "c", value: "c2" }],
			["node", { type: "c", value: "c3" }],
		]);

		assert.equal(cst.selectOne("> [type=b]"), cst.children[1]);

		assert.equal(cst.selectOne("> node[type=b]"), cst.children[1]);
		assert.equal(cst.selectOne("> *[type=b]"), cst.children[1]);
		assert.equal(cst.selectOne("> [type=b][value=b2]"), cst.children[2]);
		assert.equal(
			cst.selectOne("> [type=b] > [type=ba]"),
			(cst.children[2] as CstNode).children[1],
		);
		assert.equal(
			cst.selectOne("> [type=b][value=b2]")?.selectOne("> [type=ba]"),
			(cst.children[2] as CstNode).children[1],
		);
		assert.equal(
			cst
				.selectOne(":scope > [type=b][value=b2]")
				?.selectOne(":scope > [type=ba]"),
			(cst.children[2] as CstNode).children[1],
		);
		assert.deepEqual(cst.selectAll("> [type=b]"), [
			cst.children[1],
			cst.children[2],
		]);
		assert.deepEqual(cst.selectAll("[type=b]"), [
			cst.children[1],
			cst.children[2],
			(cst.children[2] as CstNode).children[0],
		]);
		assert.equal(cst.selectOne("[type=ba]")?.selectParent("[type=a]"), cst);
	});

	test("test remove", () => {
		const cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"node",
				{ type: "b", value: "b2" },
				["node", { type: "b", value: "b3" }],
				["node", { type: "ba", value: "ba1" }],
				["node", { type: "ba", value: "ba2" }],
				["node", { type: "ba", value: "ba3" }],
			],
		]);
		const nodeB = cst.selectOne("> [type=b]") as CstNode;
		cst.remove(nodeB);
		assert.equal(cst.selectOne("> [type=b]"), undefined);
	});

	test("test text", () => {
		let cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"token",
				{ type: "b" },
				["trivia", { type: "s" }, " "],
				"xxx",
				["trivia", { type: "e" }, " "],
			],
			["token", { type: "b" }, "yyy"],
		]);
		assert.deepEqual(cst.text(), "xxxyyy");

		cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"chunk",
				{ type: "b", text: "xxx" },
				["trivia", { type: "s" }, "["],
				[
					"token",
					{ type: "c" },
					["trivia", { type: "s" }, "<"],
					"y",
					["trivia", { type: "e" }, ">"],
				],
				["token", { type: "c" }, "y"],
				["trivia", { type: "e" }, "]"],
			],
			["token", { type: "b" }, "yyy"],
		]);
		assert.deepEqual(cst.text(), "xxxyyy");
	});

	test("test textAll", () => {
		let cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"token",
				{ type: "b" },
				["trivia", { type: "s" }, " "],
				"xxx",
				["trivia", { type: "e" }, " "],
			],
			["token", { type: "b" }, "yyy"],
		]);
		assert.deepEqual(cst.textAll(), ["xxx", "yyy"]);

		cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"chunk",
				{ type: "b", text: "xxx" },
				["trivia", { type: "s" }, "["],
				[
					"token",
					{ type: "c" },
					["trivia", { type: "s" }, "<"],
					"y",
					["trivia", { type: "e" }, ">"],
				],
				["token", { type: "c" }, "y"],
				["trivia", { type: "e" }, "]"],
			],
			["token", { type: "b" }, "yyy"],
		]);
		assert.deepEqual(cst.textAll(), ["xxx", "yyy"]);
	});

	test("test toJSONString", () => {
		const cst = CstNode.parseJSON([
			"node",
			{ type: "a", value: "b", alpha: "c" },
		]);
		assert.equal(
			cst.toJSONString(),
			'["node", { "type": "a", "alpha": "c", "value": "b" }]',
		);
	});

	test("test toPlainString", () => {
		let cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"token",
				{ type: "b" },
				["trivia", { type: "s" }, "["],
				"xxx",
				["trivia", { type: "e" }, "]"],
			],
			["token", { type: "b" }, "yyy"],
		]);
		assert.deepEqual(cst.toPlainString(), "[xxx]yyy");

		cst = CstNode.parseJSON([
			"node",
			{ type: "a" },
			[
				"chunk",
				{ type: "b", text: "xxx" },
				["trivia", { type: "s" }, "["],
				[
					"token",
					{ type: "c" },
					["trivia", { type: "s" }, "<"],
					"y",
					["trivia", { type: "e" }, ">"],
				],
				["token", { type: "c" }, "y"],
				["trivia", { type: "e" }, "]"],
			],
			["token", { type: "b" }, "yyy"],
		]);
		assert.deepEqual(cst.toPlainString(), "[<y>y]yyy");
	});
});
