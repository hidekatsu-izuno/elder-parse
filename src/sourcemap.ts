import { encode } from "@jridgewell/sourcemap-codec";
import type { Token } from "./lexer.ts";

export declare type SourceMapV3 = {
	version: 3;
	file?: string | null;
	names: string[];
	sourceRoot?: string;
	sources: (string | null)[];
	sourcesContent?: (string | null)[];
	ignoreList?: number[];
	mappings: string;
}

export declare type SourceMapOptions = {
	file?: string,
	sourceRoot?: string,
	source?: string,
	sourceContent?: string,
};

export function toSourceMap(tokens: Token[], options: SourceMapOptions = {}) {
	const map: SourceMapV3 = {
		version: 3,
		names: [],
		sources: [],
		mappings: "",
	};
	if (options.file) {
		map.file = options.file;
	}
	if (options.sourceRoot) {
		map.sourceRoot = options.sourceRoot;
	}
	if (options.source) {
		map.sources.push(options.source);
		if (options.sourceContent) {
			map.sourcesContent = [options.sourceContent];
		}
	}

	const mappings: [number, number, number, number][][] = [];

	let line = 1;
	let column = 0;
	const pat = /\r?\n/g;
	for (const token of tokens) {
		let text = "";
		for (const skip of token.preskips) {
			text += skip.toString();
		}
		column += text.length;
		pat.lastIndex = 0;
		for (let m = pat.exec(text); m; m = pat.exec(text)) {
			line++;
			pat.lastIndex = m.index + m[0].length;
			column = text.length - pat.lastIndex;
		}

		const location = token.location;
		if (location?.source) {
			for (let i = mappings.length; i < line; i++) {
				mappings[i] = [];
			}
			mappings[line - 1].push([column, 0, location.lineNumber, location.columnNumber]);
		}

		text = "";
		if (token.subtokens) {
			for (const subtoken of token.subtokens) {
				text += subtoken.toString();
			}
		} else {
			text += token.text;
		}
		for (const skip of token.postskips) {
			text += skip.toString();
		}
		column += text.length;
		pat.lastIndex = 0;
		for (let m = pat.exec(text); m; m = pat.exec(text)) {
			line++;
			pat.lastIndex = m.index + m[0].length;
			column = text.length - pat.lastIndex;
		}
	}
	map.mappings = encode(mappings);
	return map;
}
