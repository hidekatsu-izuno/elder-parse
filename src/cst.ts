import type { Options } from "css-select";
import { is, selectAll, selectOne } from "css-select";
import { escapeXml } from "./utils.ts";

export type CstAttrs = {
	[name: string]: string | number | boolean | undefined;
};

export type CstPrintOptions = {
	token?: boolean;
	trivia?: boolean;
	marker?: boolean;
};

const KEY_PARENT = Symbol.for("parent");

class CstNodeAdapter
	implements NonNullable<Options<CstNode, CstNode>["adapter"]>
{
	static OPTIONS: Options<CstNode, CstNode> = {
		xmlMode: true,
		adapter: new CstNodeAdapter(),
		pseudos: {
			x_has(elem: CstNode, value?: string | null) {
				return !!(value && selectOne(value, [elem], CstNodeAdapter.OPTIONS));
			},
		},
	};

	static filterSelector(selector: string) {
		return selector.replace(/:has\(/g, ":x_has(");
	}

	isTag(node: CstNode): node is CstNode {
		return node instanceof CstNode;
	}

	existsOne(test: (elem: CstNode) => boolean, elems: CstNode[]) {
		for (const elem of elems) {
			if (test(elem)) {
				return true;
			}
		}
		return false;
	}

	hasAttrib(elem: CstNode, name: string): boolean {
		return name in elem[1];
	}

	getAttributeValue(elem: CstNode, name: string) {
		return (elem[1] as any)?.[name]?.toString();
	}

	getChildren(node: CstNode): CstNode[] {
		const result: CstNode[] = [];
		for (let i = 2; i < node.length; i++) {
			const child = node[i];
			if (child instanceof CstNode) {
				result.push(child);
			}
		}
		return result;
	}

	getName(node: CstNode): string {
		return node.name;
	}

	getParent(node: CstNode): CstNode | null {
		return node.parent ?? null;
	}

	getSiblings(node: CstNode): CstNode[] {
		const result: CstNode[] = [];
		const parent = node.parent;
		if (parent) {
			for (let i = 2; i < parent.length; i++) {
				const child = parent[i];
				if (child instanceof CstNode) {
					result.push(child);
				}
			}
		}
		return result;
	}

	getText(node: CstNode): string {
		let str = "";
		for (let i = 2; i < node.length; i++) {
			const child = node[i];
			if (child instanceof CstNode) {
				str += this.getText(child);
			}
		}
		return str;
	}

	removeSubsets(nodes: CstNode[]): CstNode[] {
		return Array.from(new Set(nodes));
	}

	findAll(test: (node: CstNode) => boolean, nodes: CstNode[]): CstNode[] {
		const result: CstNode[] = [];
		function traverse(current: CstNode) {
			if (test(current)) {
				result.push(current);
			}
			for (let i = 2; i < current.length; i++) {
				const child = current[i];
				if (child instanceof CstNode) {
					traverse(child);
				}
			}
		}
		for (const node of nodes) {
			traverse(node);
		}
		return result;
	}

	findOne(test: (node: CstNode) => boolean, nodes: CstNode[]): CstNode | null {
		function traverse(current: CstNode): CstNode | null {
			if (test(current)) {
				return current;
			}
			for (let i = 2; i < current.length; i++) {
				const child = current[i];
				if (child instanceof CstNode) {
					const result = traverse(child);
					if (result != null) {
						return result;
					}
				}
			}
			return null;
		}
		for (const node of nodes) {
			const result = traverse(node);
			if (result != null) {
				return result;
			}
		}
		return null;
	}
}

export class CstNode extends Array<CstAttrs | CstNode | string> {
	static parseJSON(source: any): CstNode {
		const node =
			typeof source === "string"
				? JSON.parse(source, (key, value) => {
						if (value?.constructor === Object) {
							return Object.keys(value).reduce((obj: any, key: string) => {
								const type = key === "type" ? "string" : typeof value[key];
								if (type === "string") {
									obj[key] = value[key] ?? "";
								} else if (type === "number" || type === "boolean") {
									obj[key] = value[key];
								} else {
									obj[key] = undefined;
								}
								return obj;
							}, {});
						}
						return value;
					})
				: source;

		function traverse(current: Array<unknown>) {
			if (current[0] === "node" || current[0] === "token") {
				if (current.length < 2) {
					throw new SyntaxError();
				}
			} else if (current[0] === "meta") {
				if (current.length !== 2) {
					throw new SyntaxError();
				}
			} else {
				throw new SyntaxError();
			}

			if (current[1]?.constructor !== Object) {
				throw new SyntaxError();
			}

			const attrs = current[1] as Record<string, any>;
			if (current[0] === "node" || current[0] === "token") {
				if (typeof attrs?.type !== "string") {
					throw new SyntaxError();
				}
			}
			for (const value of Object.values(attrs)) {
				if (
					typeof value !== "string" &&
					typeof value !== "number" &&
					typeof value !== "boolean"
				) {
					throw new SyntaxError(
						`'${value}' must be string, number or boolean.`,
					);
				}
			}

			Object.setPrototypeOf(current, CstNode.prototype);
			for (let i = 2; i < current.length; i++) {
				const child = current[i];
				if (Array.isArray(child) && typeof child[0] === "string") {
					traverse(child);
					child[1][KEY_PARENT] = current;
				} else if (typeof child !== "string") {
					throw new SyntaxError();
				}
			}
		}

		if (Array.isArray(node)) {
			traverse(node);
		} else {
			throw new SyntaxError();
		}
		return node as CstNode;
	}

	0: string;
	1: CstAttrs & {
		[KEY_PARENT]?: CstNode;
	};

	constructor(
		name: string,
		attrs: CstAttrs,
		...childNodes: (CstNode | string)[]
	) {
		super(2 + childNodes.length);
		this[0] = name;
		this[1] = attrs;
		for (let i = 0; i < childNodes.length; i++) {
			this[i + 2] = childNodes[i];
		}
	}

	get name() {
		return this[0];
	}

	get attrs(): Readonly<Record<string, string | number | boolean | undefined>> {
		return this[1];
	}

	get parent(): CstNode | undefined {
		return this[1][KEY_PARENT];
	}

	get children() {
		return this.slice(2);
	}

	append(node: CstNode | string) {
		if (node instanceof CstNode) {
			const parent = node[1][KEY_PARENT];
			if (parent) {
				const index = parent.indexOf(node);
				if (index !== -1) {
					parent.splice(index, 1);
				}
			}
			this.push(node);
			node[1][KEY_PARENT] = this;
		} else {
			this.push(node);
		}
	}

	remove(node: CstNode | string) {
		for (let i = this.length - 1; i > 1; i--) {
			if (this[i] === node) {
				this.splice(i, 1);
				if (node instanceof CstNode) {
					delete node[1][KEY_PARENT];
				}
			}
		}
		return node;
	}

	is(selector: string) {
		return is(
			this,
			CstNodeAdapter.filterSelector(selector),
			CstNodeAdapter.OPTIONS,
		);
	}

	selectOne(selector: string): CstNode | undefined {
		return (
			selectOne<CstNode, CstNode>(
				CstNodeAdapter.filterSelector(selector),
				[this],
				CstNodeAdapter.OPTIONS,
			) ?? undefined
		);
	}

	selectAll(selector: string): CstNode[] {
		return selectAll<CstNode, CstNode>(
			CstNodeAdapter.filterSelector(selector),
			[this],
			CstNodeAdapter.OPTIONS,
		);
	}

	text() {
		return this.toPlainString();
	}

	toJSONString() {
		let out = "";
		function print(elem: CstNode, indent: number) {
			for (let i = 0; i < indent; i++) {
				out += "\t";
			}
			out += `[${JSON.stringify(elem[0])}, {`;
			let first = true;
			for (const key of Object.keys(elem[1]).sort((a, b) => {
				if (a === "type") {
					return b !== "type" ? 1 : 0;
				} else if (b === "type") {
					return -1;
				} else {
					return a > b ? 1 : a < b ? -1 : 0;
				}
			})) {
				if (first) {
					out += " ";
					first = false;
				} else {
					out += ", ";
				}
				out += `${JSON.stringify(key)}: ${JSON.stringify(elem[1][key])}`;
			}
			if (!first) {
				out += " ";
			}
			out += "}";
			if (elem.length > 2) {
				for (let i = 2; i < elem.length; i++) {
					const child = elem[i];
					if (Array.isArray(child)) {
						out += ",\n";
						print(child, indent + 1);
					} else {
						out += ",";
						if (elem[0] === "node") {
							out += "\n";
							for (let i = 0; i < indent + 1; i++) {
								out += "\t";
							}
						} else {
							out += " ";
						}
						out += JSON.stringify(child);
					}
				}
				if (elem[0] === "node") {
					out += "\n";
					for (let i = 0; i < indent; i++) {
						out += "\t";
					}
				}
			}
			out += "]";
		}
		print(this, 0);
		return out;
	}

	toXMLString() {
		let out = "";
		function print(elem: CstNode, indent: number) {
			for (let i = 0; i < indent; i++) {
				out += "\t";
			}
			out += `<${escapeXml(elem[0])}`;
			for (const key of Object.keys(elem[1]).sort((a, b) => {
				if (a === "type") {
					return b !== "type" ? 1 : 0;
				} else if (b === "type") {
					return -1;
				} else {
					return a > b ? 1 : a < b ? -1 : 0;
				}
			})) {
				const value = elem[1][key];
				out += ` ${escapeXml(key)}="${escapeXml(value != null ? value.toString() : "")}"`;
			}
			if (elem.length > 2) {
				out += ">";
				for (let i = 2; i < elem.length; i++) {
					const child = elem[i];
					if (Array.isArray(child)) {
						out += "\n";
						print(child, indent + 1);
					} else {
						if (elem[0] === "node") {
							out += "\n";
							for (let i = 0; i < indent + 1; i++) {
								out += "\t";
							}
						}
						out += escapeXml(child.toString());
					}
				}
				if (elem[0] === "node") {
					out += "\n";
					for (let i = 0; i < indent; i++) {
						out += "\t";
					}
				}
				out += `</${escapeXml(elem[0])}>`;
			} else {
				out += ` />`;
			}
		}
		print(this, 0);
		return out;
	}

	toPlainString() {
		let out = "";
		function print(elem: CstNode, indent: number) {
			for (let i = 2; i < elem.length; i++) {
				const child = elem[i];
				if (Array.isArray(child)) {
					print(child, indent + 1);
				} else {
					out += child.toString();
				}
			}
		}
		print(this, 0);
		return out;
	}

	toString() {
		return this.toJSONString();
	}
}
