# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.4.2](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.4.1...v0.4.2) (2025-09-29)


### Features

* add clone method to CstNode and improve type checking in serialization methods ([5e2512e](https://github.com/hidekatsu-izuno/elder-parse/commit/5e2512e2b44907769ca7056f377e01a70787e8cc))
* enhance CstNode.parseJSON to prevent illegal property usage and add corresponding test ([49dec43](https://github.com/hidekatsu-izuno/elder-parse/commit/49dec43ca591e1be69ce61ef66e0fcda28863669))
* enhance error messages in lexer and parser tests for better clarity ([62d81b7](https://github.com/hidekatsu-izuno/elder-parse/commit/62d81b7604b2871b5b954e59ce77727c8853c4ef))

## [0.4.1](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.4.0...v0.4.1) (2025-09-13)


### Features

* enhance CstNode and Token classes to support subtokens and improve text handling ([5027e29](https://github.com/hidekatsu-izuno/elder-parse/commit/5027e29a38874426130da12f215b0dd08d88ac8c))
* improve formatting in CstNode and CstBuilder for better readability and maintainability ([b94e285](https://github.com/hidekatsu-izuno/elder-parse/commit/b94e285c2ddc9d7ae227b7b764a29dfa182c4273))
* update biome schema and dependencies to version 2.2.4 for improved compatibility ([323147f](https://github.com/hidekatsu-izuno/elder-parse/commit/323147f2a42615a130b1e5336e6de26d68d0f4c0))
* update CstNode and CstBuilder to support 'chunk' type and enhance text handling in tests ([f2f282c](https://github.com/hidekatsu-izuno/elder-parse/commit/f2f282cfb160cfa15fb2b82682af2de63548f665))

## [0.4.0](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.11...v0.4.0) (2025-09-10)


### Features

* add textAll method to CstNode for collecting all text values ([83f77d9](https://github.com/hidekatsu-izuno/elder-parse/commit/83f77d95a081bfa0b61c4a61b240806c426c1b01))
* enhance Token class to support subtokens and improve toString method ([2292479](https://github.com/hidekatsu-izuno/elder-parse/commit/2292479c3e9509dfe3fd6e2f2702a23dbb8376f4))

## [0.3.11](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.10...v0.3.11) (2025-08-21)

## [0.3.10](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.9...v0.3.10) (2025-08-20)

## [0.3.9](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.8...v0.3.9) (2025-07-01)


### Features

* add selectParent method to CstNode class for parent selection ([8d587ba](https://github.com/hidekatsu-izuno/elder-parse/commit/8d587ba221d9e3bb0d161cc4e2900c568c2cdfbf))


### Bug Fixes

* correct sorting logic for 'type' attribute in CstNode class ([34b6557](https://github.com/hidekatsu-izuno/elder-parse/commit/34b65573ac01718a27b6a534449fd351febbf505))
* improve formatting of toJSONString assertion in cst.test.ts ([06f05df](https://github.com/hidekatsu-izuno/elder-parse/commit/06f05dfa8067a0aae4b2e5fb7485a6e36384dc96))

## [0.3.8](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.7...v0.3.8) (2025-06-27)


### Bug Fixes

* improve code formatting and consistency in cst.ts and cst.test.ts ([f8590b1](https://github.com/hidekatsu-izuno/elder-parse/commit/f8590b1d2b7bc9afbdaee55b1861809fab88e0a4))

## [0.3.7](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.6...v0.3.7) (2025-06-26)


### Features

* add pseudo-selector support and update tests for new behavior ([5a9fe8a](https://github.com/hidekatsu-izuno/elder-parse/commit/5a9fe8a38642d8c7bdaf601e14d988949398a76c))


### Bug Fixes

* format code for consistency and improve readability in cst.ts and parser.ts ([a7f14c3](https://github.com/hidekatsu-izuno/elder-parse/commit/a7f14c3368afba76b51df3c406d9f13001fd08a0))
* improve type checking in CstNodeAdapter and update tests for new behavior ([7065483](https://github.com/hidekatsu-izuno/elder-parse/commit/7065483a636858b18857fd4ffd931f148f9992f2))
* update README setup instructions and improve type handling in parser and lexer ([56f2f55](https://github.com/hidekatsu-izuno/elder-parse/commit/56f2f556d5f2a02be81e9f68fd7f5e11a73f696f))

## [0.3.6](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.5...v0.3.6) (2025-06-25)

## [0.3.5](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.4...v0.3.5) (2025-06-25)

## [0.3.4](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.3...v0.3.4) (2025-06-25)


### Features

* enhance lexer and parser functionality; update tests and configurations ([0265e46](https://github.com/hidekatsu-izuno/elder-parse/commit/0265e46e20311e4e5809e44bbc1ec5220a1edf05))


### Bug Fixes

* update launch configuration and improve test assertions for CstNode ([c1b9138](https://github.com/hidekatsu-izuno/elder-parse/commit/c1b91380ef1ea528d3ddee802d76126334ffde4f))

## [0.3.3](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.2...v0.3.3) (2025-06-24)

## [0.3.2](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.1...v0.3.2) (2025-06-24)


### Features

* add remove method to CstNode; refactor attributes and update tests ([94de9aa](https://github.com/hidekatsu-izuno/elder-parse/commit/94de9aa06437ef831b69041101594cf1b200b2bc))


### Bug Fixes

* update biome schema to version 2.0.5; improve formatting and readability in lexer and test files ([07cf607](https://github.com/hidekatsu-izuno/elder-parse/commit/07cf6079cba9939371469500e6367990a13493c1))

## [0.3.1](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.3.0...v0.3.1) (2025-06-23)


### Bug Fixes

* update biome schema and dependencies to version 2.0.0; refactor code for improved readability ([6e0f200](https://github.com/hidekatsu-izuno/elder-parse/commit/6e0f2002e14eae241d1e31a35690536e560cd28b))

## [0.3.0](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.2.1...v0.3.0) (2025-06-16)

## [0.2.1](https://github.com/hidekatsu-izuno/elder-parse/compare/v0.2.0...v0.2.1) (2025-06-09)

## 0.2.0 (2025-06-09)
