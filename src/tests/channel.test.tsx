import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { createChannel } from "../channel.ts";

/* =========================================================
   Channel Provider / Consumer Tests
   ========================================================= */

const Theme = createChannel<"light" | "dark">("light");

function TestThemeProvider(this: HTMLElement, props: JSX.PropsWithChildren) {
  const theme = Theme.provide(this, "light");
  return () => (
    <div>
      <button
        type="button"
        onclick={() => {
          theme.set((prev) => (prev === "light" ? "dark" : "light"));
        }}
      >
        toggle-theme
      </button>
      {props().children}
    </div>
  );
}

function Badge(this: HTMLElement) {
  const theme = Theme.use(this);
  return (
    <div
      className="badge"
      style={() => ({
        background: theme() === "dark" ? "#222" : "#eee",
        color: theme() === "dark" ? "#eee" : "#222",
      })}
    >
      Theme: {theme}
    </div>
  );
}

function NestedOverride(this: HTMLElement) {
  Theme.provide(this, "dark"); // Local override
  const theme = Theme.use(this);
  return <div className="nested">Nested: {theme}</div>;
}

test("channel nested override", async () => {
  const root = await mount(
    <TestThemeProvider>
      <Badge />
      <NestedOverride />
    </TestThemeProvider>,
    document.body,
  );

  const badge = root.querySelector(".badge")!;
  const nested = root.querySelector(".nested")!;
  assert.ok(badge);
  assert.ok(nested);
  // Initial values
  assert.ok(badge.textContent!.includes("light"), "Badge should start light");
  assert.ok(nested.textContent!.includes("dark"), "Nested override dark");

  // Toggle provider -> badge should change, nested stays dark
  (root.querySelector("button") as HTMLButtonElement).click();
  // Let microtasks & update propagate
  await Promise.resolve();
  assert.ok(badge.textContent!.includes("dark"), "Badge should become dark");
  assert.ok(nested.textContent!.includes("dark"), "Nested remains dark");
});

await test.run();