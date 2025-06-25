import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { CstNode } from "../src/cst.ts";

suite("test cst", () => {
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
		assert.equal(cst.is(":has(> [type=b] > [type=ba])"), false);
	});

	test("test selectOne/selectAll", () => {
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
});
