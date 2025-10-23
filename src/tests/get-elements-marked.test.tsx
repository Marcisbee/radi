import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { collectUpdateTargets } from "../lifecycle.ts";
import { update } from "../client.ts";

/**
 * Helpers
 */
function debugMarkedLocal(root: Node): string[] {
  return collectUpdateTargets(root).map((el) => el.nodeName);
}
function names(root: Node): string[] {
  return debugMarkedLocal(root);
}

test.before.each(() => {
  document.body.innerHTML = "";
});

/**
 * Component returning a plain element (non reactive root)
 */
function PlainComponent() {
  return <div className="plain">plain</div>;
}

/**
 * Reactive component (returns a function) producing a div wrapper
 */
function ReactiveComponent() {
  return () => <div className="reactive-wrap">reactive</div>;
}

/**
 * Child component used inside parents
 */
function Child() {
  return <span className="child">child</span>;
}

/**
 * Child reactive component
 */
function ReactiveChild() {
  return () => <span className="reactive-child">rchild</span>;
}

/**
 * Non-reactive parent with nested component child.
 * Should include both parent and child component hosts on update traversal.
 */
function NonReactiveParent() {
  return (
    <div className="non-reactive-parent">
      <Child />
    </div>
  );
}

/**
 * Reactive parent with nested component child.
 * Should include only the parent host; nested component host excluded (updated via reuse path).
 */
function ReactiveParent() {
  return () => (
    <div className="reactive-parent">
      <Child />
    </div>
  );
}

/**
 * Reactive parent with nested reactive component host under reactive parent.
 */
function ReactiveParentWithReactiveChild() {
  return () => (
    <div className="reactive-parent-rchild">
      <ReactiveChild />
    </div>
  );
}

/**
 * Reactive parent with mixed inert and reactive function child elements.
 * Reactive function child plain element should be marked.
 */
function MixedReactiveParent() {
  return () => (
    <div className="mixed-parent">
      <div className="inert">inert</div>
      {() => <span className="func-child">f</span>}
    </div>
  );
}

test("marks root component host", async () => {
  const root = await mount(<PlainComponent />, document.body);
  const marked = names(root);
  assert.true(marked.includes("RADI-HOST"), "root host marked");
});

test("includes nested component under non-reactive parent", async () => {
  const root = await mount(<NonReactiveParent />, document.body);
  const marked = names(root);
  // Should contain parent host AND child host
  const hosts = marked.filter((n) => n === "RADI-HOST");
  assert.equal(hosts.length, 2, "two component hosts (parent + child)");
});

test("excludes nested component under reactive parent", async () => {
  const root = await mount(<ReactiveParent />, document.body);
  const marked = names(root);
  const hosts = marked.filter((n) => n === "RADI-HOST");
  assert.equal(
    hosts.length,
    1,
    "only parent reactive host marked, child excluded",
  );
});

test("excludes nested reactive component host under reactive parent", async () => {
  const root = await mount(<ReactiveParentWithReactiveChild />, document.body);
  const marked = names(root);
  const hosts = marked.filter((n) => n === "RADI-HOST");
  assert.equal(hosts.length, 1, "only parent host marked");
});

test("includes function child reactive element", async () => {
  const root = await mount(<MixedReactiveParent />, document.body);
  const markedSet = new Set(names(root));
  assert.true(markedSet.has("RADI-HOST"), "parent host marked");
  const funcChild = document.querySelector(".func-child");
  assert.true(
    markedSet.has(funcChild!.parentElement!.nodeName) ||
      markedSet.has(funcChild!.nodeName),
    "reactive function child chain marked at some element",
  );
});

test("manual update does not introduce duplicate nested component markings", async () => {
  const root = await mount(<ReactiveParent />, document.body);
  // Initial
  const initialHosts = names(root).filter((n) => n === "RADI-HOST").length;
  assert.equal(initialHosts, 1);
  // After update
  update(root);
  await Promise.resolve();
  const afterHosts = names(root).filter((n) => n === "RADI-HOST").length;
  assert.equal(afterHosts, 1, "still single host marked after update");
});

test("non-reactive parent update traverses into child host", async () => {
  const root = await mount(<NonReactiveParent />, document.body);
  const before = names(root).filter((n) => n === "RADI-HOST").length;
  assert.equal(before, 2, "two hosts before update");
  update(root);
  await Promise.resolve();
  const after = names(root).filter((n) => n === "RADI-HOST").length;
  assert.equal(after, 2, "two hosts after update (no change)");
});

await test.run();
