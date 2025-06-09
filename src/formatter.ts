import { EOL } from "node:os";
import { CstNode } from "./cst.ts";
import { AggregateParseError, type Parser } from "./parser.ts";

export declare type ContentActionType = "multiline" | "noprint";

export declare type FormatActionType =
	| "reset"
	| "indent"
	| "unindent"
	| "softbreak"
	| "break"
	| "nospace"
	| "nobreak";

export declare type FormatPattern = {
	pattern: string;
	content?: ContentActionType;
	before?: FormatActionType | FormatActionType[];
	after?: FormatActionType | FormatActionType[];
};

export declare type FormatterOptions = {
	printWidth?: number;
	tabWidth?: number;
	useTabs?: boolean;
	endOfLine?: "lf" | "crlf" | "cr" | "auto";
	[key: string]: any;
};

export abstract class Formatter {
	parser: Parser;
	private patterns = new Array<FormatPattern>();
	options: FormatterOptions;

	constructor(
		parser: Parser,
		patterns: FormatPattern[],
		options: FormatterOptions = {},
	) {
		this.parser = parser;
		this.patterns = patterns;
		this.options = options;
	}

	format(script: string | CstNode, filename?: string): string {
		let node: CstNode | undefined;
		if (script instanceof CstNode) {
			node = script;
		} else {
			try {
				node = this.parser.parse(script, filename);
			} catch (err) {
				if (err instanceof AggregateParseError) {
					node = err.node;
				} else {
					throw err;
				}
			}
		}

		const out = new FormatWriter(this.options);
		if (node) {
			this.formatElement(node, out);
		}
		return out.toString();
	}

	private formatElement(node: CstNode, out: FormatWriter) {
		let before: FormatActionType | FormatActionType[] | undefined;
		let content: ContentActionType | undefined;
		let after: FormatActionType | FormatActionType[] | undefined;
		for (const item of this.patterns) {
			if (node.is(item.pattern)) {
				before = item.before;
				content = item.content;
				after = item.after;
				break;
			}
		}

		if (before) {
			if (Array.isArray(before)) {
				for (const action of before) {
					out.control(action);
				}
			} else {
				out.control(before);
			}
		}
		if (content === "noprint") {
			// no handle
		} else if (content === "multiline") {
			const segments = node.text().split(/\r\n?|\n/g);
			let first = true;
			for (const segment of segments) {
				if (segment) {
					if (first) {
						first = false;
					} else {
						out.control("break");
					}
					out.write(segment, true);
				}
			}
		} else {
			const children = node.children;
			if (children.length) {
				for (const child of children) {
					if (child instanceof CstNode) {
						this.formatElement(child, out);
					} else {
						out.write(child.toString(), false);
					}
				}
			} else {
				out.write("", false);
			}
		}
		if (after) {
			if (Array.isArray(after)) {
				for (const action of after) {
					out.control(action);
				}
			} else {
				out.control(after);
			}
		}
	}
}

class FormatWriter {
	printWidth: number;
	indent: string;
	indentWidth: number;
	eol: string;

	private text = "";
	private depth = 0;
	private line = new Array<{
		text: string;
		depth: number;
		nospace?: boolean;
	}>();

	private nospace = false;
	private nobreak = false;
	private actions = new Array<FormatActionType>();

	constructor(options: FormatterOptions) {
		this.printWidth = options.printWidth ?? 80;
		if (options.useTabs) {
			this.indent = "\t";
			this.indentWidth = options.tabWidth ?? 2;
		} else {
			this.indent = " ".repeat(options.tabWidth ?? 2);
			this.indentWidth = options.tabWidth ?? 2;
		}
		if (options.endOfLine === "crlf") {
			this.eol = "\r\n";
		} else if (options.endOfLine === "cr") {
			this.eol = "\r";
		} else if (options.endOfLine === "auto") {
			this.eol = EOL;
		} else {
			this.eol = "\n";
		}
	}

	control(action: FormatActionType) {
		if (action === "nospace") {
			this.nospace = true;
		} else if (action === "nobreak") {
			this.nobreak = true;
		} else {
			this.actions.push(action);
		}
	}

	write(text: string, skip: boolean) {
		if (this.actions.length > 0) {
			this.performActions();
		}
		if (skip) {
			this.line.push({ text, depth: this.depth });
		} else {
			this.line.push({ text, depth: this.depth, nospace: this.nospace });
			this.nospace = false;
			this.nobreak = false;
		}
	}

	toString() {
		this.nospace = false;
		this.nobreak = false;
		this.performActions();
		return this.text;
	}

	private performActions() {
		let breaked = false;
		let breakCount = 0;
		let depth = this.depth;
		for (const action of this.actions) {
			if (action === "break") {
				breakCount++;
				breaked = true;
			} else {
				if (!breaked) {
					breakCount++;
					breaked = true;
				}

				if (action === "softbreak") {
					// no handle
				} else if (action === "indent") {
					depth++;
				} else if (action === "unindent") {
					depth--;
				} else if (action === "reset") {
					depth = 0;
				} else {
					throw new Error(`Unexpected action: ${action}`);
				}
			}
		}
		this.actions.length = 0;

		if (!(this.nospace || this.nobreak)) {
			if (this.line.length > 0) {
				const depth = this.line[0].depth;

				let first = true;
				let width = 0;
				let text = "";
				for (let i = 0; i < this.line.length; i++) {
					const item = this.line[i];
					if (!item.text) {
						continue;
					}

					if (first) {
						width = this.indentWidth * depth;
						text = this.indent.repeat(depth);
					}

					const nospace = first || item.nospace;
					if (width + item.text.length + (nospace ? 0 : 1) < this.printWidth) {
						width += (nospace ? 0 : 1) + item.text.length;
						text += (nospace ? "" : " ") + item.text;
					} else {
						this.text += text + this.eol;

						width = this.indentWidth * (depth + 1) + item.text.length;
						text = this.indent.repeat(depth + 1) + item.text;
					}
					first = false;
				}
				if (text) {
					this.text += text;
				} else {
					breakCount = 0;
				}
				this.line.length = 0;
			} else {
				breakCount = 0;
			}

			if (breakCount > 2) {
				breakCount = 2;
			}
			for (let i = 0; i < breakCount; i++) {
				this.text += this.eol;
			}
		}

		this.depth = depth;
	}
}
