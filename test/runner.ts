/**
 * Minimal browser test runner with assertion helpers.
 *
 * API:
 * import { test, assert } from './runner.ts';
 *
 * test.before(fn)       // runs once before all tests
 * test.after(fn)        // runs once after all tests
 * test.before.each(fn)  // runs before every test
 * test.after.each(fn)   // runs after every test
 *
 * test('name', fn)      // regular test
 * test.skip('name')     // skipped test (not executed, reported as skipped)
 *
 * await test.run();
 *
 * Now logs every PASS / FAIL / SKIP test name.
 */
import type { Clock } from "npm:playwright@1.56.1";

// Since we mock performance in Playwright, use an iframe to get a clean performance.now()
const iframe = document.createElement("iframe");
iframe.srcdoc = "";
document.head.appendChild(iframe);
const now = iframe.contentWindow?.performance.now || performance.now;

type MaybePromise<T> = T | Promise<T>;
type TestFn = () => MaybePromise<any>;

interface TestCase {
  name: string;
  fn: TestFn;
  skipped?: boolean;
}

interface RunError {
  test?: string;
  error: any;
}

interface RunResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  durationMs: number;
  errors: RunError[];
}

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
        message || `Expected ${format(actual)} to be ${format(expected)}`,
      );
    }
  },
  equal(actual: any, expected: any, message?: string) {
    if (!deepEqual(actual, expected)) {
      throw new Error(
        message ||
          `Expected deep equal:\n\n${format(actual)}\n\n${format(expected)}\n`,
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
        let out = html.trim();
        out = out.replace(/\s+/g, " ");
        out = out.replace(/>\s+</g, "><");
        return out;
      }
      const actualHTML = normalizeHTML(toHTML(a));
      const expectedHTML = normalizeHTML(toHTML(b));
      if (actualHTML !== expectedHTML) {
        throw new Error(
          message ||
            `HTML snapshot mismatch:\n\nActual:\n${actualHTML}\n\nExpected:\n${expectedHTML}\n`,
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
          message || `Expected ${format(actual)} NOT to be ${format(expected)}`,
        );
      }
    },
    equal(actual: any, expected: any, message?: string) {
      if (deepEqual(actual, expected)) {
        throw new Error(
          message ||
            `Expected (deep equal) ${format(actual)} NOT to equal ${
              format(
                expected,
              )
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

function createTestAPI() {
  const tests: TestCase[] = [];
  const beforeAll: TestFn[] = [];
  const afterAll: TestFn[] = [];
  const beforeEach: TestFn[] = [];
  const afterEach: TestFn[] = [];
  let started = false;

  // Styled logging
  const STYLE_FAIL = "color:#b71c1c;font-weight:bold;";
  const STYLE_PASS = "color:#2e7d32;font-weight:bold;";
  const STYLE_SKIP = "color:#616161;font-weight:bold;";
  const STYLE_ERROR_TITLE = "color:#b71c1c;";
  const STYLE_ERROR_TEST_NAME =
    "color:#b71c1c;font-weight:bold;text-decoration:underline;";
  const STYLE_ERROR_STACK = "color:#b71c1c;";

  function logStatus(status: "PASS" | "FAIL" | "SKIP", testName: string) {
    const style = status === "PASS"
      ? STYLE_PASS
      : status === "FAIL"
      ? STYLE_FAIL
      : STYLE_SKIP;
    (status === "FAIL" ? console.group : console.log)(
      `%c${status} %c${testName}`,
      style,
      "font-weight:normal;",
    );
  }

  function printErrorDetail(d: any) {
    if (d instanceof Error && d.stack) {
      console.error(`%c${d.stack}`, STYLE_ERROR_STACK);
    } else {
      console.error(d);
    }
  }

  function logError(title: string, ...details: any[]) {
    console.log(`%c${title}`, STYLE_ERROR_TITLE);
    details.forEach(printErrorDetail);
  }

  function logTestError(title: string, testName: string, ...details: any[]) {
    if (title) {
      console.error(
        `%c${title}: %c${testName}`,
        STYLE_ERROR_TITLE,
        STYLE_ERROR_TEST_NAME,
      );
    }

    details.forEach(printErrorDetail);
  }

  async function runHookList(list: TestFn[], label: string, testName?: string) {
    for (const hook of list) {
      try {
        await hook();
      } catch (error) {
        if (testName) {
          logTestError(`Hook error (${label})`, testName, error);
        } else {
          logError(`Hook error (${label})`, error);
        }
        throw error;
      }
    }
  }

  const api: {
    (name: string, fn: TestFn): void;
    skip(name: string, fn?: TestFn): void;
    before: {
      (fn: TestFn): void;
      each: (fn: TestFn) => void;
    };
    after: {
      (fn: TestFn): void;
      each: (fn: TestFn) => void;
    };
    run(): Promise<RunResult>;
  } = <T extends TestFn>(name: string, fn: T) => {
    if (started) {
      throw new Error("Cannot add tests after test.run() has started");
    }
    tests.push({ name, fn });
  };

  api.skip = (name: string, fn?: TestFn) => {
    if (started) {
      throw new Error("Cannot add tests after test.run() has started");
    }
    tests.push({ name, fn: fn || (() => {}), skipped: true });
  };

  api.before = ((fn: TestFn) => {
    beforeAll.push(fn);
  }) as any;
  api.after = ((fn: TestFn) => {
    afterAll.push(fn);
  }) as any;
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
    const start = now();

    await runHookList(beforeAll, "beforeAll").catch((err) => {
      errors.push({ error: err });
      logError("Aborting: beforeAll hook failed.");
      const durationMs = now() - start;
      // All non-skipped tests count as failed because we can't proceed
      const failed = tests.filter((t) => !t.skipped).length;
      const skipped = tests.filter((t) => t.skipped).length;
      // Log skipped tests (for completeness)
      for (const t of tests.filter((t) => t.skipped)) {
        logStatus("SKIP", t.name);
      }
      return {
        passed: 0,
        failed,
        skipped,
        total: tests.length,
        durationMs,
        errors,
      } as RunResult;
    });

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const t of tests) {
      if (t.skipped) {
        skipped++;
        logStatus("SKIP", t.name);
        continue;
      }

      try {
        await runHookList(beforeEach, "beforeEach", t.name);
      } catch (hookError) {
        // Treat beforeEach failure as test failure (not skip)
        failed++;
        errors.push({ test: t.name, error: hookError });
        logStatus("FAIL", t.name);
        console.groupEnd();
        continue; // Skip test body execution
      }

      let testFailed = false;
      try {
        const result = t.fn();
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        testFailed = true;
        failed++;
        errors.push({ test: t.name, error });
        logStatus("FAIL", t.name);
        logTestError("", t.name, error);
        console.groupEnd();
      }

      try {
        await runHookList(afterEach, "afterEach", t.name);
      } catch (hookError) {
        if (!testFailed) {
          failed++;
          logStatus("FAIL", t.name);
          console.groupEnd();
        }
        errors.push({ test: t.name, error: hookError });
        logTestError("afterEach hook failed", t.name, hookError);
        continue;
      }

      if (!testFailed) {
        passed++;
        logStatus("PASS", t.name);
      }
    }

    try {
      await runHookList(afterAll, "afterAll");
    } catch (error) {
      errors.push({ error });
      logError("afterAll hook failed", error);
    }

    const durationMs = now() - start;
    const result: RunResult = {
      passed,
      failed,
      skipped,
      total: tests.length,
      durationMs,
      errors,
    };

    window.__test_results = (window.__test_results || []).concat(result);

    if (result.failed) {
      window.__test_failing = true;
    }

    // const summaryStyle = "font-weight:bold;";
    // console.log(
    //   `%cResult: ${passed} passed, ${failed} failed, ${skipped} skipped (total ${tests.length}) in ${
    //     durationMs.toFixed(
    //       2,
    //     )
    //   }ms`,
    //   summaryStyle,
    // );

    return result;
  };

  return api;
}

declare global {
  interface Window {
    __test_results?: RunResult[];
    __test_failing?: boolean;
  }
}

function showReport() {
  const arr: RunResult[] = (window as any).__test_results || [];
  const bold = "font-weight:bold;";
  if (!arr.length) {
    console.log("\n%cNo test results recorded.", bold);
    return;
  }

  const aggregate = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    durationMs: 0,
  };

  // Aggregate results across runs
  for (const r of arr) {
    aggregate.passed += r.passed;
    aggregate.failed += r.failed;
    aggregate.skipped += r.skipped;
    aggregate.total += r.total;
    aggregate.durationMs += r.durationMs;
  }

  const infoStyle = "font-weight:bold;"; // general bold
  const passStyle = "color:#2e7d32;font-weight:bold;"; // green bold
  const failStyle = "color:#b71c1c;font-weight:bold;"; // red bold
  const skipStyle = "color:orange;font-weight:bold;"; // yellow bold

  // Build the format string and corresponding styles dynamically to include skipped in yellow
  let summaryStr = "%cSuites: " + arr.length + " total\n" +
    "Tests:  %c" + aggregate.passed + " passed%c";
  if (aggregate.skipped) {
    summaryStr += ", %c" + aggregate.skipped + " skipped%c";
  }
  if (aggregate.failed) {
    summaryStr += ", %c" + aggregate.failed + " failed%c\n";
  } else {
    summaryStr += "%c\n";
  }
  summaryStr += "Time:   " + aggregate.durationMs.toFixed(2) + " ms";

  const summaryStyles: string[] = [infoStyle, passStyle, infoStyle];
  if (aggregate.skipped) {
    summaryStyles.push(skipStyle, infoStyle);
  }
  if (aggregate.failed) {
    summaryStyles.push(failStyle, infoStyle);
  } else {
    // final reset style for the "%c" used in the else branch
    summaryStyles.push(infoStyle);
  }

  console.log("");
  console.log(summaryStr, ...summaryStyles);
}

export const clock = (globalThis as any).__pwClock.controller as Clock;

export const test = createTestAPI();
export { assert, showReport };

(window as any).showReport = showReport;
