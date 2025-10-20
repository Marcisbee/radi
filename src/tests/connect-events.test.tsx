import { assert, test } from "jsr:@marcisbee/rion";
import { render } from "../main.ts";

function Probe() {
  return <div>probe</div>;
}

test("connect in component", async () => {
  const probe = <Probe />;

  let called = 0;
  probe.addEventListener("connect", () => {
    called++;
  });

  render(probe, document.body);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.is(called, 1);
});

test("connect in element", async () => {
  const probe = <div />;

  let called = 0;
  probe.addEventListener("connect", () => {
    called++;
  });

  render(probe, document.body);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.is(called, 1);
});

await test.run();
