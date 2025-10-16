import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { toSourceMap } from "../src/sourcemap.ts";
import { TestLexer } from "./common/TestLexer.ts";

suite("test utils", () => {
	test("test toSourceMap", () => {
		const lexer = new TestLexer();
        const source = "test.calc";
        const content = "CALC ((1 +3.1*2) / 4) MOD 2";
		let tokens = lexer.lex(content, source);
        tokens = tokens.filter(token => token.text !== "CALC");

		const map = toSourceMap(tokens, {
            sourceRoot: "",
            source,
            sourceContent: content,
        });
        assert.equal(map.mappings, "CACK,CAAC,CAAC,EAAE,CAAC,GAAG,CAAC,CAAC,EAAE,EAAE,CAAC,EAAE,IAAI,CAAC");
	});
});
