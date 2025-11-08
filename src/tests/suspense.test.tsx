import { assert, clock, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createKey, suspend, Suspense, unsuspend, update } from "../client.ts";

/**
 * Suspense behavior tests covering:
 * - Fallback resolution after single delayed child unsuspends.
 * - Immediate child rendering without fallback.
 * - Multiple staggered delayed children.
 * - Perpetual suspension (never unsuspends).
 * - Error during suspension (fallback persists).
 * - Mixed immediate + delayed children.
 * - Ignored re-suspension after initial unsuspend.
 */

/**
 * DelayedChild100
 * Suspends once, waits 100ms, then unsuspends and updates state text.
 */
function DelayedChild100(this: HTMLElement) {
  let state = "suspended";
  (async () => {
    suspend(this);
    await new Promise((resolve) => setTimeout(resolve, 100));
    state = "unsuspended";
    update(this);
    unsuspend(this);
  })();
  return (
    <div>
      <h1>I am {() => state}</h1>
    </div>
  );
}

test("fallback-unsuspends-child", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong>Loading...</strong>}>
      <DelayedChild100 /> Extra
    </Suspense>,
    document.body,
  );
  assert.contains(root.textContent, "Loading...");
  assert.contains(root.textContent, "I am suspended");
  await clock.fastForward(90);
  assert.contains(root.textContent, "I am suspended");
  assert.excludes(root.textContent, "I am unsuspended");
  await clock.fastForward(10);
  assert.contains(root.textContent, "I am unsuspended");
  assert.excludes(root.textContent, "Loading...");
  assert.contains(root.textContent, "Extra");
});

/** ImmediateChild renders synchronously without suspension. */
function ImmediateChild(this: HTMLElement) {
  return <span className="immediate">Immediate</span>;
}

/**
 * DelayedChild
 * Suspends once for a configurable delay, then unsuspends and shows "done".
 */
function DelayedChild(
  this: HTMLElement,
  props: JSX.Props<{ label: string; delay: number }>,
) {
  let state = "pending";
  (async () => {
    suspend(this);
    await new Promise((resolve) => setTimeout(resolve, props().delay));
    state = "done";
    update(this);
    unsuspend(this);
  })();
  return <span className={"delayed-" + props().label}>{() => state}</span>;
}

/**
 * NeverUnsuspendChild
 * Suspends and never calls unsuspend, leaving fallback in place permanently.
 */
function NeverUnsuspendChild(this: HTMLElement) {
  let state = "start";

  state = "suspended";
  update(this);
  suspend(this);

  return <span className="never">{() => state}</span>;
}

/**
 * ErrorChild
 * Throws during suspension; unsuspend is never called so fallback persists.
 */
function ErrorChild(this: HTMLElement) {
  let state = "init";

  try {
    suspend(this);
    state = "errored";
    update(this);
    throw new Error("Suspension failure");
  } catch {
    // Fallback remains; unsuspend intentionally omitted.
  }

  return <span className="error-child">{() => state}</span>;
}

/**
 * Resuspender
 * Performs two sequential suspension cycles; Suspense ignores the second after reveal.
 */
function Resuspender(this: HTMLElement) {
  let phase = "boot";
  (async () => {
    suspend(this);
    phase = "s1";
    update(this);
    await new Promise((resolve) => setTimeout(resolve, 30));
    phase = "s1-done";
    update(this);
    unsuspend(this);
    await new Promise((resolve) => setTimeout(resolve, 30));
    suspend(this);
    phase = "s2";
    update(this);
    await new Promise((resolve) => setTimeout(resolve, 30));
    phase = "s2-done";
    update(this);
    unsuspend(this);
  })();
  return <span className="resuspender">{() => phase}</span>;
}

test("renders-immediate", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong className="fallback">Loading</strong>}>
      <ImmediateChild />
    </Suspense>,
    document.body,
  );
  assert.excludes(root.textContent, "Loading");
  assert.exists(root.querySelector(".immediate"));
});

test("multi-stagger", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong className="fallback">Wait</strong>}>
      <DelayedChild label="a" delay={50} />
      <DelayedChild label="b" delay={80} />
    </Suspense>,
    document.body,
  );
  assert.contains(root.textContent!, "Wait");
  assert.excludes(root.textContent, "done");
  await clock.fastForward(55);
  assert.contains(root.textContent!, "Wait");
  assert.contains(root.textContent!, "done");
  assert.contains(root.textContent!, "pending");
  await clock.fastForward(30);
  assert.excludes(root.textContent, "Wait");
  assert.contains(root.textContent!, "done");
});

test("never-unsuspends", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong className="fallback">Hold</strong>}>
      <NeverUnsuspendChild />
    </Suspense>,
    document.body,
  );
  assert.contains(root.textContent!, "Hold");
  await clock.fastForward(500);
  assert.contains(root.textContent!, "Hold");
  assert.contains(root.textContent!, "suspended");
});

test("error-keeps-fallback", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong className="fallback">Err</strong>}>
      <ErrorChild />
    </Suspense>,
    document.body,
  );
  assert.contains(root.textContent!, "Err");
  await clock.fastForward(200);
  assert.contains(root.textContent!, "Err");
  assert.contains(root.textContent!, "errored");
});

test("mixed-delays", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong className="fallback">Mix</strong>}>
      <ImmediateChild />
      <DelayedChild label="slow" delay={70} />
    </Suspense>,
    document.body,
  );
  assert.contains(root.textContent!, "Mix");
  assert.contains(root.textContent!, "Immediate");
  assert.contains(root.textContent!, "pending");
  await clock.fastForward(40);
  assert.contains(root.textContent!, "Mix");
  assert.contains(root.textContent!, "Immediate");
  assert.contains(root.textContent!, "pending");
  assert.contains(root.textContent!, "Immediate");
  await clock.fastForward(40);
  assert.excludes(root.textContent, "Mix");
  assert.contains(root.textContent!, "Immediate");
  assert.contains(root.textContent!, "done");
  assert.elementExists(".immediate");
  assert.elementExists(".delayed-slow");
});

test("can-resuspend", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong className="fallback">Phase</strong>}>
      <Resuspender />
    </Suspense>,
    document.body,
  );
  assert.contains(root.textContent!, "Phase");
  assert.contains(root.textContent!, "s1");
  await clock.fastForward(35);
  assert.excludes(root.textContent, "Phase");
  assert.contains(root.textContent!, "s1-done");
  await clock.fastForward(35);
  assert.contains(root.textContent!, "Phase");
  assert.contains(root.textContent!, "s2");
  await clock.fastForward(40);
  assert.contains(root.textContent!, "s2-done");
  assert.excludes(root.textContent, "Phase");
});

test("can resuspend with key change", async () => {
  function ResuspenderWithKey(this: HTMLElement) {
    let phase = "boot";
    (async () => {
      suspend(this);
      phase = "s1";
      update(this);
      await new Promise((resolve) => setTimeout(resolve, 30));
      phase = "s1-done";
      update(this);
      unsuspend(this);
    })();
    return <span className="resuspender">{() => phase}</span>;
  }

  function App(this: HTMLElement) {
    let key = 0;
    return (
      <div>
        <button
          type="button"
          onclick={() => {
            key++;
            update(this);
          }}
        >
          Resuspend
        </button>
        <Suspense fallback={() => <strong className="fallback">Phase</strong>}>
          {() => createKey(() => <ResuspenderWithKey />, key)}
        </Suspense>
      </div>
    );
  }

  const root = await mount(<App />, document.body);
  const button = root.querySelector("button")!;

  // Initial suspend cycle
  assert.contains(root.textContent!, "Phase");
  assert.contains(root.textContent!, "s1");
  await clock.fastForward(35);
  assert.excludes(root.textContent, "Phase");
  assert.contains(root.textContent!, "s1-done");
  // Trigger resuspend via key change
  button.click();
  assert.contains(root.textContent!, "Phase");
  assert.contains(root.textContent!, "s1");
  await clock.fastForward(35);
  assert.excludes(root.textContent, "Phase");
  assert.contains(root.textContent!, "s1-done");
});

test("handles sub-components", async () => {
  function Child(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      unsuspend(this);
    })();

    return <div id="b">B</div>;
  }

  function Parent(this: HTMLElement) {
    let count = 0;
    return (
      <div>
        <button
          type="button"
          onclick={() => {
            count++;
            update(this);
          }}
        >
          update
        </button>
        <Suspense fallback={() => <strong className="fallback">Phase</strong>}>
          {() => (count > 0 && <Child />)}
        </Suspense>
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$--><!--false-->
          </suspense>
          <!--$--><!--null-->
        </host>
      </div>
    </host>
    `,
  );

  const button = root.querySelector("button")!;
  button.click();

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: none;">
            <!--$--><!--$-->
            <host>
              <div id="b">B</div>
            </host>
          </suspense>
          <!--$--><strong class="fallback">Phase</strong>
        </host>
      </div>
    </host>
    `,
  );

  await clock.fastForward(100);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$-->
            <host>
              <div id="b">B</div>
            </host>
          </suspense>
          <!--$--><!--null-->
        </host>
      </div>
    </host>
    `,
  );
});

test("handles sub-components 2", async () => {
  function Child1(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      unsuspend(this);
    })();

    return <div id="a">A</div>;
  }

  function Child2(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      unsuspend(this);
    })();

    return <div id="b">B</div>;
  }

  function Parent(this: HTMLElement) {
    let count = 0;
    return (
      <div>
        <Suspense fallback={() => <strong className="fallback">Phase</strong>}>
          {() => (count > 0 && <Child1 />)}
        </Suspense>
        <button
          type="button"
          onclick={() => {
            count++;
            update(this);
          }}
        >
          update
        </button>
        <Suspense fallback={() => <strong className="fallback">Phase</strong>}>
          {() => (count > 0 && <Child2 />)}
        </Suspense>
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$--><!--false-->
          </suspense>
          <!--$--><!--null-->
        </host>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$--><!--false-->
          </suspense>
          <!--$--><!--null-->
        </host>
      </div>
    </host>
    `,
  );

  const button = root.querySelector("button")!;
  button.click();

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <host>
          <suspense _r="" style="display: none;">
            <!--$--><!--$-->
            <host>
              <div id="a">A</div>
            </host>
          </suspense>
          <!--$--><strong class="fallback">Phase</strong>
        </host>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: none;">
            <!--$--><!--$-->
            <host>
              <div id="b">B</div>
            </host>
          </suspense>
          <!--$--><strong class="fallback">Phase</strong>
        </host>
      </div>
    </host>
    `,
  );

  await clock.fastForward(100);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$-->
            <host>
              <div id="a">A</div>
            </host>
          </suspense>
          <!--$--><!--null-->
        </host>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$-->
            <host>
              <div id="b">B</div>
            </host>
          </suspense>
          <!--$--><!--null-->
        </host>
      </div>
    </host>
    `,
  );
});

test("handles sub-components 2", async () => {
  let count = 0;

  function Child3(this: HTMLElement) {
    return (
      <section>
        <Suspense fallback={() => <strong className="fallback">Phase</strong>}>
          {() => (count > 0 && <Child1 />)}
        </Suspense>
      </section>
    );
  }

  function Child2(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      unsuspend(this);
    })();

    return <div id="b">B</div>;
  }

  function Child1(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      unsuspend(this);
    })();

    return <div id="a">A</div>;
  }

  function Parent(this: HTMLElement) {
    return (
      <div>
        <Child3 />
        <button
          type="button"
          onclick={() => {
            count++;
            update(this);
          }}
        >
          update
        </button>
        <Suspense fallback={() => <strong className="fallback">Phase</strong>}>
          {() => (count > 0 && <Child2 />)}
        </Suspense>
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <host>
          <section>
            <host>
              <suspense _r="" style="display: contents;">
                <!--$--><!--$--><!--false-->
              </suspense>
              <!--$--><!--null-->
            </host>
          </section>
        </host>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$--><!--false-->
          </suspense>
          <!--$--><!--null-->
        </host>
      </div>
    </host>
    `,
  );

  const button = root.querySelector("button")!;
  button.click();

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <host>
          <section>
            <host>
              <suspense _r="" style="display: none;">
                <!--$--><!--$-->
                <host>
                  <div id="a">A</div>
                </host>
              </suspense>
              <!--$--><strong class="fallback">Phase</strong>
            </host>
          </section>
        </host>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: none;">
            <!--$--><!--$-->
            <host>
              <div id="b">B</div>
            </host>
          </suspense>
          <!--$--><strong class="fallback">Phase</strong>
        </host>
      </div>
    </host>
    `,
  );

  await clock.fastForward(100);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <host>
          <section>
            <host>
              <suspense _r="" style="display: contents;">
                <!--$--><!--$-->
                <host>
                  <div id="a">A</div>
                </host>
              </suspense>
              <!--$--><!--null-->
            </host>
          </section>
        </host>
        <button type="button">update</button>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$--><!--$-->
            <host>
              <div id="b">B</div>
            </host>
          </suspense>
          <!--$--><!--null-->
        </host>
      </div>
    </host>
    `,
  );
});

test("handles sub-components 3", async () => {
  function Child1(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      unsuspend(this);
    })();

    return <div id="a">A</div>;
  }

  function Child2(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      unsuspend(this);
    })();

    return <div id="b">B</div>;
  }

  function Parent1() {
    return (
      <div>
        <Suspense fallback={() => <strong id="as">Phase</strong>}>
          <Child1 />
        </Suspense>
      </div>
    );
  }

  function Parent2() {
    return (
      <div>
        <Parent1 />
        <Suspense fallback={() => <strong id="bs">Phase</strong>}>
          <Child2 />
        </Suspense>
      </div>
    );
  }

  const root = await mount(<Parent2 />, document.body);

  assert.equal(root.querySelector("#a")?.checkVisibility(), false);
  assert.equal(root.querySelector("#as")?.checkVisibility(), true);
  assert.equal(root.querySelector("#b")?.checkVisibility(), false);
  assert.equal(root.querySelector("#bs")?.checkVisibility(), true);

  await clock.fastForward(100);

  assert.equal(root.querySelector("#a")?.checkVisibility(), true);
  assert.equal(root.querySelector("#as")?.checkVisibility(), undefined);
  assert.equal(root.querySelector("#b")?.checkVisibility(), true);
  assert.equal(root.querySelector("#bs")?.checkVisibility(), undefined);
});

test("handles sub-components 4", async () => {
  function Child1(this: HTMLElement) {
    suspend(this);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      unsuspend(this);
    })();

    return <div id="a">A</div>;
  }

  function Parent1() {
    return (
      <div>
        <Suspense fallback={() => <strong id="as">Phase</strong>}>
          <Child1 />
        </Suspense>
      </div>
    );
  }

  function Parent2() {
    return (
      <div>
        <Parent1 />
        <Suspense fallback={() => <strong id="bs">Phase</strong>}>
          <div>no suspend here</div>
        </Suspense>
      </div>
    );
  }

  const root = await mount(<Parent2 />, document.body);

  assert.equal(root.querySelector("#a")?.checkVisibility(), false);
  assert.equal(root.querySelector("#as")?.checkVisibility(), true);

  await clock.fastForward(100);

  assert.equal(root.querySelector("#a")?.checkVisibility(), true);
  assert.equal(root.querySelector("#as")?.checkVisibility(), undefined);
});

await test.run();
