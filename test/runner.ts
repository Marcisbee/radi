// Simple browser test runner implementing the requested API.
//
// Usage:
//
// import { test, assert } from './test.ts';
//
// test.before(() => { console.log('SETUP'); });
// test.after(() => { console.log('CLEANUP'); });
// test.before.each(() => { console.log('>> BEFORE'); });
// test.after.each(() => { console.log('>> AFTER'); });
//
// test('foo', () => {
//   console.log('>>>> TEST: FOO');
//   assert.is(2 + 2, 4);
// });
//
// test('bar', () => {
//   console.log('>>>> TEST: BAR');
//   assert.ok(true);
// });
//
// await test.run();
//
// Output order:
// SETUP
// >> BEFORE
// >>>> TEST: FOO
// >> AFTER
// >> BEFORE
// >>>> TEST: BAR
// >> AFTER
// CLEANUP
//
// If an assertion fails, an Error is thrown for that test,
// logged, collected, and execution continues with remaining tests.

type MaybePromise<T> = T | Promise<T>;
type TestFn = () => MaybePromise<any>;

interface TestCase {
  name: string;
  fn: TestFn;
}

interface RunError {
  test?: string;
  error: any;
}

interface RunResult {
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
  errors: RunError[];
}

/* -------------------- Assertions -------------------- */

function format(v: any): string {
  if (typeof v === "string") return JSON.stringify(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!keysB.includes(k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

const assert = {
  ok(value: any, message = "Expected value to be truthy") {
    if (!value) throw new Error(message);
  },
  is(actual: any, expected: any, message?: string) {
    if (!Object.is(actual, expected)) {
      throw new Error(
        message ||
          `Expected ${format(actual)} to be ${format(expected)}`,
      );
    }
  },
  equal(actual: any, expected: any, message?: string) {
    if (!deepEqual(actual, expected)) {
      throw new Error(
        message ||
          `Expected (deep equal) ${format(actual)} to equal ${
            format(expected)
          }`,
      );
    }
  },
  throws(fn: () => any, message = "Expected function to throw") {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) throw new Error(message);
  },
  snapshot: {
    html(a: any, b: any, message?: string) {
      function toHTML(input: any): string {
        if (typeof input === "string") return input;
        if (input instanceof Element) return input.outerHTML;
        if (input && typeof input === "object" && "outerHTML" in input) {
          return (input as any).outerHTML;
        }
        return String(input);
      }
      function normalizeHTML(html: string): string {
        // Remove leading/trailing whitespace
        let out = html.trim();
        // Collapse all internal whitespace (including newlines/tabs) to single spaces
        out = out.replace(/\s+/g, " ");
        // Remove spaces directly between tags: >< (already ensured), but ensure no space around angle brackets
        out = out.replace(/>\s+</g, "><");
        return out;
      }
      const actualHTML = normalizeHTML(toHTML(a));
      const expectedHTML = normalizeHTML(toHTML(b));
      if (actualHTML !== expectedHTML) {
        throw new Error(
          message ||
            `HTML snapshot mismatch:\nActual: ${actualHTML}\nExpected: ${expectedHTML}`,
        );
      }
    },
  },
  not: {
    ok(value: any, message = "Expected value to be falsy") {
      if (value) throw new Error(message);
    },
    is(actual: any, expected: any, message?: string) {
      if (Object.is(actual, expected)) {
        throw new Error(
          message ||
            `Expected ${format(actual)} NOT to be ${format(expected)}`,
        );
      }
    },
    equal(actual: any, expected: any, message?: string) {
      if (deepEqual(actual, expected)) {
        throw new Error(
          message ||
            `Expected (deep equal) ${format(actual)} NOT to equal ${
              format(expected)
            }`,
        );
      }
    },
    throws(fn: () => any, message = "Expected function NOT to throw") {
      let threw = false;
      try {
        fn();
      } catch {
        threw = true;
      }
      if (threw) throw new Error(message);
    },
    snapshot: {
      html(a: any, b: any, message?: string) {
        function toHTML(input: any): string {
          if (typeof input === "string") return input;
          if (input instanceof Element) return input.outerHTML;
          if (input && typeof input === "object" && "outerHTML" in input) {
            return (input as any).outerHTML;
          }
          return String(input);
        }
        function normalizeHTML(html: string): string {
          let out = html.trim();
          out = out.replace(/\s+/g, " ");
          out = out.replace(/>\s+</g, "><");
          return out;
        }
        const actualHTML = normalizeHTML(toHTML(a));
        const otherHTML = normalizeHTML(toHTML(b));
        if (actualHTML === otherHTML) {
          throw new Error(
            message ||
              `Expected HTML snapshots to differ but both normalized to: ${actualHTML}`,
          );
        }
      },
    },
  },
};

/* -------------------- Test Runner -------------------- */

function createTestAPI() {
  const tests: TestCase[] = [];
  const beforeAll: TestFn[] = [];
  const afterAll: TestFn[] = [];
  const beforeEach: TestFn[] = [];
  const afterEach: TestFn[] = [];
  let started = false;

  async function runHookList(list: TestFn[], label: string, testName?: string) {
    for (const hook of list) {
      try {
        await hook();
      } catch (error) {
        console.error(
          `Hook error (${label}${testName ? `: ${testName}` : ""})`,
          error,
        );
        throw error; // stop further hooks in this phase
      }
    }
  }

  const api = (<T extends TestFn>(name: string, fn: T) => {
    if (started) {
      throw new Error("Cannot add tests after test.run() has started");
    }
    tests.push({ name, fn });
  }) as any;

  api.before = (fn: TestFn) => {
    beforeAll.push(fn);
  };
  api.after = (fn: TestFn) => {
    afterAll.push(fn);
  };
  api.before.each = (fn: TestFn) => {
    beforeEach.push(fn);
  };
  api.after.each = (fn: TestFn) => {
    afterEach.push(fn);
  };

  api.run = async (): Promise<RunResult> => {
    if (started) {
      throw new Error("test.run() has already been called");
    }
    started = true;

    const errors: RunError[] = [];
    const start = performance.now();
    await runHookList(beforeAll, "beforeAll").catch((err) => {
      errors.push({ error: err });
      console.error("Aborting: beforeAll hook failed.");
      return {
        passed: 0,
        failed: tests.length,
        total: tests.length,
        durationMs: performance.now() - start,
        errors,
      };
    });

    let passed = 0;
    let failed = 0;

    for (const t of tests) {
      try {
        await runHookList(beforeEach, "beforeEach", t.name);
      } catch (hookError) {
        failed++;
        errors.push({ test: t.name, error: hookError });
        // skip test execution if beforeEach fails
        continue;
      }

      try {
        const result = t.fn();
        if (result instanceof Promise) {
          await result;
        }
        passed++;
      } catch (error) {
        failed++;
        errors.push({ test: t.name, error });
        if (error && error.stack) {
          console.error(`Test failed: ${t.name}\n${error.stack}`);
        } else {
          console.error(`Test failed: ${t.name}`, error);
        }
      }

      try {
        await runHookList(afterEach, "afterEach", t.name);
      } catch (hookError) {
        // afterEach failure counts as a test failure but doesn't stop next test
        failed++;
        errors.push({ test: t.name, error: hookError });
        console.error(`afterEach hook failed for test "${t.name}"`, hookError);
      }
    }

    try {
      await runHookList(afterAll, "afterAll");
    } catch (error) {
      errors.push({ error });
      console.error("afterAll hook failed", error);
    }

    const durationMs = performance.now() - start;
    const result: RunResult = {
      passed,
      failed,
      total: tests.length,
      durationMs,
      errors,
    };

    // Summary
    const color = (s: string, c: string) => {
      // basic ANSI coloring – some browsers strip it; kept for completeness
      return `%c${s}`;
    };
    const summaryStyle = "font-weight:bold;";
    console.log(
      color(
        `Result: ${passed}/${tests.length} passed, ${failed} failed in ${
          durationMs.toFixed(
            2,
          )
        }ms`,
        "summary",
      ),
      summaryStyle,
    );

    if (errors.length) {
      console.group("Errors");
      for (const e of errors) {
        if (e.test) {
          console.error(`Test "${e.test}" failed:`, e.error);
        } else {
          console.error("Setup/teardown error:", e.error);
        }
      }
      console.groupEnd();
    }

    return result;
  };

  return api;
}

// Create the exported singleton test API.
export const test = createTestAPI();
export { assert }; // Optional: expose globally (useful for quick script tags without imports)

(window as any).test = test;
(window as any).assert = assert;
