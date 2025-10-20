import type { CstNode } from "../../src/cst";
import type { TokenReader } from "../../src/lexer";
import {
	type CstBuilder,
	Parser,
	type ParserOptions,
} from "../../src/parser.ts";
import { TestLexer } from "./TestLexer.ts";

export class TestParser extends Parser<TestLexer> {
	constructor(options?: ParserOptions) {
		super(new TestLexer(options), options);
	}

	protected process(reader: TokenReader, builder: CstBuilder): void {
		builder.start("Calc");
		while (reader.peekIf(TestLexer.Start)) {
			builder.token(reader.consume());
			if (reader.peekIf(TestLexer.CALC)) {
				builder.token(reader.consume());
				this.parseExpression(reader, builder);
			} else {
				throw reader.createParseError({ message: "Test Error!" });
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
