/// <reference path="../jsx.d.ts" />
import { assert, test } from "@marcisbee/rion";

import { createAbortSignal, createRoot } from "../client.ts";

/**
 * Abortable component registers an abort event listener bound to its lifecycle.
 * When the hosting element is removed from the DOM, the underlying `AbortSignal`
 * dispatches an "abort" event which we capture and log via the shared `events` array.
 *
 * Props:
 * - label?: string - optional label used to namespace the logged event.
 *
 * The component returns a simple div so that tests can mount / remove it.
 */
function Abortable(this: HTMLElement, props: JSX.Props<{ label?: string }>) {
  const signal = createAbortSignal(this);
  const labelAccessor = () => props().label ?? "abortable";

  signal.addEventListener("abort", () => {
    // Immutable append for clarity.
    events = [...events, `${labelAccessor()}:aborted`];
  });

  return <div className="abortable">{labelAccessor()}</div>;
}

/** Shared events list for assertions; reset before each test. */
let events: string[] = [];

test.before.each(() => {
  events = [];
});

/**
 * abort on unmount
 * Mount component, unmount via root API, expect exactly one abort event.
 */
test("abort on unmount", async () => {
  const rootApi = createRoot(document.body);
  const cmp = <Abortable />;
  const connected = new Promise<HTMLElement>((resolve) => {
    (cmp as EventTarget).addEventListener(
      "connect",
      (e) => resolve(e.target as HTMLElement),
      { once: true },
    );
  });
  rootApi.render(cmp);
  await connected;
  assert.length(events, 0);

  // Unmount root -> should trigger abort.
  rootApi.unmount();

  // Allow microtasks to flush.
  await Promise.resolve();

  assert.length(events, 1);
  assert.equal(events[0], "abortable:aborted");
});

/**
 * single abort event
 * Removing an already removed element should not produce a second abort.
 */
test("single abort event", async () => {
  const rootApi = createRoot(document.body);
  const cmp = <Abortable label="multi" />;
  const connected = new Promise<HTMLElement>((resolve) => {
    (cmp as EventTarget).addEventListener(
      "connect",
      (e) => resolve(e.target as HTMLElement),
      { once: true },
    );
  });
  rootApi.render(cmp);
  await connected;
  assert.length(events, 0);

  // First unmount.
  rootApi.unmount();
  await Promise.resolve();
  assert.length(events, 1);
  assert.equal(events[0], "multi:aborted");

  // Second unmount (noop / idempotent).
  rootApi.unmount();
  await Promise.resolve();
  assert.length(events, 1);
});

await test.run();
