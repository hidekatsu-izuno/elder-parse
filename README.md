<!--
npm run format
npm run test

npm run version:minor:alpha
npm run release:alpha

npm run version:patch
npm run release
-->

# Elder-Parse

A TypeScript lexer and parser library with a hand-written style, designed for building custom parsers with concrete syntax tree (CST) support.

## Features

- **Hand-written lexer and parser**: Full control over tokenization and parsing logic
- **CST (Concrete Syntax Tree) support**: Preserves all syntax information including whitespace and comments
- **CSS selector queries**: Query and manipulate CST nodes using familiar CSS selectors
- **TypeScript support**: Written in TypeScript with full type definitions
- **Dual module format**: Supports both CommonJS and ES modules
- **Flexible token handling**: Support for keywords, separators, markers, and trivia tokens
- **Error recovery**: Built-in error handling and recovery mechanisms

## Installation

```bash
npm install elder-parse
```

## Quick Start

```typescript
import { Lexer, TokenType, Parser, TokenReader, CstBuilder } from 'elder-parse';

// Define token types
class MyTokens {
  static Identifier = new TokenType('Identifier');
  static Number = new TokenType('Number');
  static Space = new TokenType('Space', { skip: true });
  static Plus = new TokenType('Plus');
}

// Create a lexer
class MyLexer extends Lexer {
  constructor(options = {}) {
    super('mylang', [
      { type: MyTokens.Space, re: /\s+/y },
      { type: MyTokens.Number, re: /\d+/y },
      { type: MyTokens.Identifier, re: /[a-zA-Z]\w*/y },
      { type: MyTokens.Plus, re: /\+/y }
    ], options);
  }
}

// Create a parser
class MyParser extends Parser<MyLexer> {
  constructor(options) {
    super(new MyLexer(options), options);
  }
  
  protected parseTokens(reader: TokenReader, builder: CstBuilder) {
    builder.start('expression');
    // Parse your grammar here
    builder.end();
  }
}

// Use the parser
const parser = new MyParser();
const cst = parser.parse('1 + 2');
```

## CST Node Operations

elder-parse provides powerful CST manipulation capabilities using CSS selectors:

```typescript
import { CstNode } from 'elder-parse';

// Parse or create a CST
const cst = CstNode.parseJSON(
  ['node', { type: 'root' },
    ['node', { type: 'child', value: '1' }],
    ['node', { type: 'child', value: '2' }],
  ]
);

// Query nodes using CSS selectors
const firstChild = cst.selectOne('> [type=child]');
const findAllChildren = cst.selectAll('[type=child]');

// Check if a node matches a selector
if (cst.is(':has(> [type=child])')) {
  console.log('Root has children');
}

// Manipulate the tree
cst.append(new CstNode('node', { type: 'child', value: '3' }));
cst.remove(firstChild);

// Convert to JSON
console.log(cst.toJSONString());

// Convert to XML
console.log(cst.toXMLString());
```

## Advanced Features

### Keywords

Define reserved words and keywords with case sensitivity options:

```typescript
const IF = MyTokens.Identifier.newKeyword('if', { reserved: true });
const FUNCTION = MyTokens.Identifier.newKeyword('function', { 
  reserved: true,
  ignoreCase: true 
});
```

### Token Reader

The TokenReader provides convenient methods for parsing:

```typescript
// Peek at the next token
if (reader.peekIf(TokenType)) {
  const token = reader.consume();
}

// Consume with expectation
const token = reader.consume(ExpectedTokenType);

// Handle errors
if (!reader.peekIf(ExpectedType)) {
  throw reader.createParseError('Expected something');
}
```

### Builder Options

Control what information is preserved in the CST:

```typescript
const parser = new MyParser({
  meta: true,    // Include metadata
  token: true,   // Include token information
  trivia: true,  // Include whitespace and comments
  marker: true   // Include marker tokens
});
```

## API Reference

### Core Classes

- `Lexer`: Base class for creating lexers
- `Parser<L>`: Base class for creating parsers
- `TokenType`: Define token types with various options
- `Token`: Represents a lexed token
- `TokenReader`: Utilities for reading token streams
- `CstNode`: Concrete syntax tree node with selector support
- `CstBuilder`: Builder for constructing CST nodes

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Format code
npm run format
```

## License

MIT License - see LICENSE file for details

## Author

Hidekatsu Izuno <hidekatsu.izuno@gmail.com>

## Links

- [GitHub Repository](https://github.com/hidekatsu-izuno/elder-parse)
- [npm Package](https://www.npmjs.com/package/elder-parse)
- [Issue Tracker](https://github.com/hidekatsu-izuno/elder-parse/issues)
