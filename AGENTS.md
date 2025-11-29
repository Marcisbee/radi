A focused guide for coding agents. Follow these principles to produce small,
fast, simple, and maintainable code.

## Core pillars

- Code must be small
  - Write only what is necessary to meet the requirement.
  - Prefer fewer files, fewer branches, and fewer abstractions when possible.
  - Remove dead code, unused dependencies, and redundant helpers.

- Code must be performant
  - Choose algorithms and data structures with appropriate complexity.
  - Avoid unnecessary allocations, deep copies, or extra passes over data.
  - Measure critical paths; optimize based on evidence, not assumptions.

- KISS (Keep It Simple, Stupid)
  - Prefer straightforward solutions over clever ones.
  - Reduce moving parts; favor direct composition over indirection.
  - If a solution feels complex, explore a simpler design first.

- Single Responsibility Principle (SRP)
  - Each unit (function, class, module) does one job well.
  - Split multi-purpose logic into focused units with clear boundaries.
  - Keep public interfaces minimal and coherent.

- Don’t overuse comments
  - Write self-explanatory code with clear names and small functions.
  - Use comments for rationale or non-obvious decisions, not restating code.
  - Remove outdated or misleading comments.

## Design guidelines

- Minimalism in code
  - Limit code to what is necessary. Avoid extra layers, flags, and parameters
    that do not serve the immediate requirement.
  - Prefer deletion and simplification over generalization.

- Simplicity in structure
  - Use flat, consistent project layouts. Avoid deep hierarchies and
    cross-module dependencies unless required.
  - Keep dependency graphs simple; prevent circular or implicit coupling.

- Modularity
  - Divide logic into small, independent modules that are easy to test and
    reuse.
  - Encapsulate implementation details; expose minimal, well-defined interfaces.

- Clear naming
  - Use descriptive, plain-language names that convey purpose (what, not how).
  - Avoid abbreviations and terms of art unless standard and necessary.

- Avoiding overengineering
  - Use design patterns only when they solve a concrete problem.
  - Prefer direct implementations; avoid speculative abstractions.
  - Watch for unnecessary factories, strategies, and layers (~
    Over-engineeering).

## Testing

- Goals
  - Tests must be fast, deterministic, and focused on behavior.
  - Cover critical paths and edge cases before micro-optimizations.

- Run tests
  - Run all tests: `deno task test`
  - Run tests in specific file: `deno task test "<relative path to file>"`

- Guidance for agents
  - If no test framework is configured, scaffold minimal tests with Vitest or
    Jest.
  - Prefer unit tests that mirror the SRP of modules.
  - Keep test names explicit: “does X when Y” and avoid ambiguous terms.

## Project-specific rules

- use kebab-case for file names
- use camelCase for variable and function names
- use PascalCase for class names and React components
- use UPPER_SNAKE_CASE for constants
- use 2 spaces for indentation
- use single quotes for strings
- use semicolons at the end of statements
- use trailing commas in multi-line objects and arrays
- use template literals for string interpolation
- do not use default exports, use named exports instead
- function content should be less than 50 lines
- avoid using `any` type in TypeScript, use specific types instead
- prefer `const` over `let` and `let` over `var`
- use loops like `for...of` or array methods like `.map()`, `.filter()`, and
  `.reduce()` instead of traditional `for` loops
- use destructuring assignment for objects and arrays
- use css modules for styling React components
- avoid using inline styles in React components, use CSS classes instead
- prefer immutability, avoid mutating objects and arrays directly

## Agent notes

- When uncertain, choose the simplest working solution and document trade-offs
  briefly.
- Prefer deletion and refactoring over adding complexity.
- Ask for missing requirements rather than guessing abstractions.
- Avoid using terminal commands for file operations; use provided tools.
