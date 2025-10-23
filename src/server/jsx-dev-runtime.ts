/**
 * Server JSX Dev Runtime for Radi.
 *
 * Thin re-export of the server JSX runtime factories so that tooling
 * expecting a separate *-jsx-dev-runtime entry can reference this path.
 *
 * Usage (TypeScript / bundler config):
 *   {
 *     "compilerOptions": {
 *       "jsx": "react-jsxdev",
 *       "jsxImportSource": "radi"
 *     },
 *     "paths": {
 *       "radi/jsx-dev-runtime": ["radi/src/server-jsx-dev-runtime.ts"]
 *     }
 *   }
 *
 * This file intentionally only re-exports the symbols. The server runtime
 * already includes a `jsxDEV` factory variant suitable for dev transforms.
 */
export * from "./jsx-runtime.ts";
