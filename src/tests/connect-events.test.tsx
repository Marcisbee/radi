import { assert, test } from "@marcisbee/rion";
import { createRoot } from "../client.ts";

function Probe() {
  return <div>probe</div>;
}

test("connect in component", async () => {
  const probe = <Probe />;

  let called = 0;
  probe.addEventListener("connect", () => {
    called++;
  });

  createRoot(document.body).render(probe);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.equal(called, 1);
});

test("connect in element", async () => {
  const probe = <div />;

  let called = 0;
  probe.addEventListener("connect", () => {
    called++;
  });

  createRoot(document.body).render(probe);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.equal(called, 1);
});

await test.run();
