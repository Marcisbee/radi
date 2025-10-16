import { dispatchEventSink, update } from "./main.ts";

const suspendEvent = new Event("suspend", {
  bubbles: true,
  composed: true,
  cancelable: true,
});
export function suspend(target: Node) {
  return target.dispatchEvent(suspendEvent);
}

const unsuspendEvent = new Event("unsuspend", {
  bubbles: true,
  composed: true,
  cancelable: true,
});
export function unsuspend(target: Node) {
  return target.dispatchEvent(unsuspendEvent);
}

function waitForUnsuspense(target: Node | Node[], finish: () => void) {
  const targets = Array.isArray(target) ? target : [target];

  let suspendCount = 0;
  const onSuspend = (e?: Event) => {
    e?.preventDefault();
    e?.stopPropagation();
    e?.stopImmediatePropagation();

    console.log("suspend");
    suspendCount++;
  };

  for (const t of targets) {
    t.addEventListener("suspend", onSuspend);
    dispatchEventSink(t, new Event("suspension"));
  }

  Promise.resolve().then(() => {
    for (const t of targets) {
      t.removeEventListener("suspend", onSuspend);
    }

    if (suspendCount === 0) {
      finish();
      return;
    }

    let remaining = suspendCount;
    const onUnsuspend = (e?: Event) => {
      e?.preventDefault();
      e?.stopPropagation();
      e?.stopImmediatePropagation();

      console.log("unsuspend");
      remaining--;
      if (remaining <= 0) {
        for (const t of targets) {
          t.removeEventListener("unsuspend", onUnsuspend);
        }
        finish();
      }
    };

    for (const t of targets) {
      t.addEventListener("unsuspend", onUnsuspend);
    }
  });
}

export function Suspense(
  this: DocumentFragment,
  props: () => { children: any[]; fallback: any },
) {
  // @TODO improve update logic, what if children or fallback props update
  const { children, fallback } = props();
  console.log({ children, fallback });
  const target = children;
  let output = fallback;

  waitForUnsuspense(target, () => {
    output = target;
    update(this);
  });

  return () => output;
}
