import { assert, clock, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { Suspense, update } from "../client.ts";

/**
 * Async component tests covering:
 * - Basic async component resolution
 * - Async component with delayed resolution
 * - Async component rejection handling
 * - Async component within Suspense boundary
 */

// Basic async component that resolves immediately
function ImmediateAsyncComponent() {
  return Promise.resolve(<div className="immediate-async">Immediate</div>);
}

// Async component that resolves after a delay
function DelayedAsyncComponent(
  this: HTMLElement,
  props: JSX.Props<{ delay: number }>,
) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(<div className="delayed-async">Delayed {props().delay}ms</div>);
    }, props().delay);
  });
}

// Async component that rejects
function RejectedAsyncComponent() {
  return Promise.reject(new Error("Async component failed"));
}

test("renders-immediate-async", async () => {
  const root = await mount(<ImmediateAsyncComponent />, document.body);
  // Wait for microtasks to flush
  await Promise.resolve();
  assert.exists(root.querySelector(".immediate-async"));
  assert.contains(root.textContent!, "Immediate");
});

test("renders-delayed-async", async () => {
  const root = await mount(<DelayedAsyncComponent delay={50} />, document.body);
  // Initially should be empty while suspended
  assert.equal(root.textContent!.trim(), "");

  // After delay, should render the component
  await clock.fastForward(55);
  assert.exists(root.querySelector(".delayed-async"));
  assert.contains(root.textContent!, "Delayed 50ms");
});

test("handles-async-rejection", async () => {
  const root = await mount(<RejectedAsyncComponent />, document.body);
  // Wait for microtasks to flush
  await Promise.resolve();
  // Should render nothing when rejected (empty comment node)
  assert.equal(root.textContent!.trim(), "");
});

test("async-component-with-suspense", async () => {
  const root = await mount(
    <Suspense fallback={() => <strong>Loading async...</strong>}>
      <DelayedAsyncComponent delay={100} />
    </Suspense>,
    document.body,
  );

  // Initially should show fallback
  assert.contains(root.textContent!, "Loading async...");
  assert.exists(root.querySelector("strong"));

  // After delay, should show the async component
  await clock.fastForward(105);
  assert.contains(root.textContent!, "Delayed 100ms");
  assert.exists(root.querySelector(".delayed-async"));
  assert.excludes(root.textContent!, "Loading async...");
});

test("mixed-async-and-sync", async () => {
  function SyncComponent() {
    return <span className="sync">Sync</span>;
  }

  const root = await mount(
    <div>
      <SyncComponent />
      <ImmediateAsyncComponent />
      <DelayedAsyncComponent delay={30} />
    </div>,
    document.body,
  );

  // Sync component should be immediately available
  assert.exists(root.querySelector(".sync"));
  assert.contains(root.textContent!, "Sync");

  // Immediate async should be available after microtasks
  await Promise.resolve();
  assert.exists(root.querySelector(".immediate-async"));
  assert.contains(root.textContent!, "Immediate");

  // Delayed async should appear after its delay
  await clock.fastForward(35);
  assert.exists(root.querySelector(".delayed-async"));
  assert.contains(root.textContent!, "Delayed 30ms");
});

test("async-component-replacement-before-resolution", async () => {
  let showAsync = true;

  function AsyncComponent(this: HTMLElement) {
    return new Promise((resolve) => {
      // Simulate a slow async operation
      setTimeout(() => {
        resolve(<div className="async-result">Async Result</div>);
      }, 100);
    });
  }

  function SyncComponent() {
    return <div className="sync-result">Sync Result</div>;
  }

  function App(this: HTMLElement) {
    return (
      <div>
        <button
          onclick={() => {
            showAsync = !showAsync;
            update(this);
          }}
        >
          Toggle
        </button>
        {() => showAsync ? <AsyncComponent /> : <SyncComponent />}
      </div>
    );
  }

  const root = await mount(<App />, document.body);

  // Initially should show async component (but it's still loading)
  // The button text should be visible, but async content not yet rendered
  assert.contains(root.textContent!, "Toggle");

  // Toggle to show sync component before async resolves
  const button = root.querySelector("button")!;
  button.click();

  // Should immediately show sync component
  await Promise.resolve();
  assert.contains(root.textContent!, "Sync Result");
  assert.exists(root.querySelector(".sync-result"));
  assert.excludes(root.textContent!, "Async Result");
  assert.equal(root.querySelector(".async-result"), null);

  // Wait for async component to resolve (it should be ignored now)
  await clock.fastForward(105);

  // Should still show sync component, not async result
  assert.contains(root.textContent!, "Sync Result");
  assert.exists(root.querySelector(".sync-result"));
  assert.excludes(root.textContent!, "Async Result");
  assert.equal(root.querySelector(".async-result"), null);
});

test("async-component-cleanup-on-disconnect", async () => {
  let resolvePromise: (value: JSX.Element) => void;

  function AsyncComponent(this: HTMLElement) {
    return new Promise<JSX.Element>((resolve) => {
      resolvePromise = resolve;
      // This promise will be resolved later
    });
  }

  function ConditionalWrapper(this: HTMLElement) {
    let showComponent = true;

    return (
      <div>
        <button
          onclick={() => {
            showComponent = false;
            update(this);
          }}
        >
          Hide
        </button>
        {() => showComponent ? <AsyncComponent /> : null}
      </div>
    );
  }

  const root = await mount(<ConditionalWrapper />, document.body);

  // Initially should show nothing (async component is pending)
  assert.equal(root.textContent!.trim(), "Hide");

  // Hide the component before it resolves
  const button = root.querySelector("button")!;
  button.click();

  // Should still show the button but no async component
  assert.equal(root.textContent!.trim(), "Hide");

  // Resolve the async component (should be ignored since it's disconnected)
  resolvePromise!(<div className="async-result">Async Result</div>);
  await Promise.resolve();

  // Should still show only the button, not the async result
  assert.equal(root.textContent!.trim(), "Hide");
  assert.equal(root.querySelector(".async-result"), null);
});

test("async-component-replaced-before-resolution-does-not-render", async () => {
  let showAsync = true;

  function SlowAsyncComponent(this: HTMLElement) {
    return new Promise<JSX.Element>((resolve) => {
      // Very slow async operation
      setTimeout(() => {
        resolve(<div className="slow-async">Slow Async Content</div>);
      }, 500);
    });
  }

  function FastSyncComponent() {
    return <div className="fast-sync">Fast Sync Content</div>;
  }

  function App(this: HTMLElement) {
    return (
      <div>
        <button
          onclick={() => {
            showAsync = !showAsync;
            update(this);
          }}
        >
          Toggle
        </button>
        <div id="content">
          {() => showAsync ? <SlowAsyncComponent /> : <FastSyncComponent />}
        </div>
      </div>
    );
  }

  const root = await mount(<App />, document.body);
  const contentDiv = root.querySelector("#content")!;

  // Initially should show nothing (async component is pending)
  assert.equal(contentDiv.textContent!.trim(), "");

  // Toggle to show sync component before async resolves
  const button = root.querySelector("button")!;
  button.click();

  // Should immediately show sync component
  await Promise.resolve();
  assert.contains(contentDiv.textContent!, "Fast Sync Content");
  assert.exists(root.querySelector(".fast-sync"));

  // Wait for async component to resolve (it should be ignored)
  await clock.fastForward(505);

  // Should still show sync component, not the async result that resolved late
  assert.contains(contentDiv.textContent!, "Fast Sync Content");
  assert.exists(root.querySelector(".fast-sync"));
  assert.excludes(contentDiv.textContent!, "Slow Async Content");
  assert.equal(root.querySelector(".slow-async"), null);

  // Toggle back to async component
  button.click();

  // Should show nothing again while async component loads
  assert.equal(contentDiv.textContent!.trim(), "");

  // Wait for async component to resolve
  await clock.fastForward(505);

  // Should now show the async component
  assert.contains(contentDiv.textContent!, "Slow Async Content");
  assert.exists(root.querySelector(".slow-async"));
  assert.excludes(contentDiv.textContent!, "Fast Sync Content");
  assert.equal(root.querySelector(".fast-sync"), null);
});

// test("suspense-within-parent-component", async () => {
//   function Parent(this: HTMLElement) {
//     let showSuspense = true;

//     return (
//       <div>
//         <h2>Parent Component</h2>
//         <button
//           onclick={() => {
//             showSuspense = !showSuspense;
//             update(this);
//           }}
//         >
//           Toggle Suspense
//         </button>
//         <div id="suspense-region">
//           {() =>
//             showSuspense ? (
//               <Suspense fallback={() => <em>Loading inside parent...</em>}>
//                 <DelayedAsyncComponent delay={80} />
//               </Suspense>
//             ) : (
//               <span className="no-async">No Async Content</span>
//             )
//           }
//         </div>
//       </div>
//     );
//   }

//   const root = await mount(<Parent />, document.body);
//   const region = root.querySelector("#suspense-region")!;

//   // Parent renders and initial fallback from Suspense should be visible
//   assert.contains(root.textContent!, "Parent Component");
//   assert.exists(root.querySelector("button"));
//   assert.contains(region.textContent!, "Loading inside parent...");
//   assert.exists(region.querySelector("em"));

//   // After delay, async content inside Suspense should render
//   await clock.fastForward(85);
//   assert.contains(region.textContent!, "Delayed 80ms");
//   assert.exists(root.querySelector(".delayed-async"));
//   assert.excludes(root.textContent!, "Loading inside parent...");

//   // Toggle to replace the Suspense region with synchronous content
//   const button = root.querySelector("button")!;
//   button.click();
//   await Promise.resolve();
//   assert.contains(region.textContent!, "No Async Content");
//   assert.exists(root.querySelector(".no-async"));
//   assert.equal(root.querySelector(".delayed-async"), null);

//   // Toggle back to show Suspense again (should show fallback while loading)
//   button.click();
//   await Promise.resolve();
//   assert.contains(region.textContent!, "Loading inside parent...");
//   assert.exists(region.querySelector("em"));

//   // After another delay, async content should appear again
//   await clock.fastForward(85);
//   assert.contains(region.textContent!, "Delayed 80ms");
//   assert.exists(root.querySelector(".delayed-async"));
//   assert.excludes(region.textContent!, "No Async Content");
// });

await test.run();
