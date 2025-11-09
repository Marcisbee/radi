import { bench } from "@marcisbee/rion/bench";
import { locator } from "@marcisbee/rion/locator";

function setProps1(el: HTMLElement, propsNew: Record<string, any>) {
  const propsOld = (el as any).__props || ((el as any).__props = {});
  for (const k in propsOld) {
    if (!(k in propsNew)) {
      if (k === "style") el.style.cssText = "";
      else if (k.startsWith("on")) el[k.toLowerCase()] = null;
      else if (k === "class") el.removeAttribute("class");
      else el.removeAttribute(k);
    }
  }
  for (const k in propsNew) {
    const vNew = propsNew[k];
    const vOld = propsOld[k];
    if (vNew === vOld) continue;
    propsOld[k] = vNew;
    if (k === "style" && typeof vNew === "object" && vNew) {
      const s = el.style;
      for (const sk in { ...vOld, ...vNew }) {
        if (!(sk in vNew) || vNew[sk] === undefined) s[sk as any] = "";
        else if (!vOld || vOld[sk] !== vNew[sk]) s[sk as any] = vNew[sk];
      }
    } else if (k === "class") el.className = vNew ?? "";
    else if (k.startsWith("on")) {
      el[k.toLowerCase()] = typeof vNew === "function" ? vNew : null;
    } else if (vNew === undefined) el.removeAttribute(k);
    else el.setAttribute(k, vNew);
  }
  el.__props = propsNew;
}

function setProps2(el: HTMLElement, props: Record<string, any>) {
  const old = (el as any).__props || ((el as any).__props = {});
  const style = el.style;
  const keys = Object.keys({ ...old, ...props });

  keys.forEach(k => {
    const v = props[k];
    const prev = old[k];

    if (v === prev) return;

    if (!(k in props)) {
      // Removed
      if (k === "style") style.cssText = "";
      else if (k.startsWith("on")) el[k.toLowerCase() as "onclick"] = null;
      else if (k !== "class") el.removeAttribute(k);
      else el.className = "";
      delete old[k];
    } else if (k === "style" && v && typeof v === "object") {
      // Style object diff
      const sOld = prev || {};
      const sNew = v;
      const all = new Set([...Object.keys(sOld), ...Object.keys(sNew)]);
      all.forEach(sk => {
        const nv = sNew[sk];
        if (nv === undefined) style[sk as any] = "";
        else if (sOld[sk] !== nv) style[sk as any] = nv;
      });
      old[k] = v;
    } else {
      // Regular prop
      old[k] = v;
      if (k === "class") el.className = v ?? "";
      else if (k.startsWith("on")) el[k.toLowerCase() as "onclick"] = typeof v === "function" ? v : null;
      else if (v === undefined) el.removeAttribute(k);
      else el.setAttribute(k, v);
    }
  });
  el.__props = props;
}

function getElement(): HTMLElement {
  return document.body.childNodes[0];
}

bench("setProps1", {
  beforeEach() {
    const el = document.createElement("div");
    el.innerHTML = "Hello world!";
    document.body.appendChild(el);
  },
  afterEach() {
    getElement().remove();
  },
}, () => {
  const el = getElement();

  setProps1(el, {
    id: "foo",
    "data-custom": "test",
    style: {
      display: "block",
      color: "orange",
      background: "white",
    },
    onclick(e) {
      console.log("click", e);
    },
  });

  document.body.offsetHeight; // Force reflow to simulate real-world scenario

  setProps1(el, {
    id: undefined,
    "data-custom": "test2",
    style: {
      display: "block",
      color: "red",
      background: undefined,
    },
    onclick(e) {
      console.log("click", e);
    },
  });

  document.body.offsetHeight; // Force reflow to simulate real-world scenario
});

bench("setProps2", {
  beforeEach() {
    const el = document.createElement("div");
    el.innerHTML = "Hello world!";
    document.body.appendChild(el);
  },
  afterEach() {
    getElement().remove();
  },
}, () => {
  const el = getElement();

  setProps2(el, {
    id: "foo",
    "data-custom": "test",
    style: {
      display: "block",
      color: "orange",
      background: "white",
    },
    onclick(e) {
      console.log("click", e);
    },
  });

  document.body.offsetHeight; // Force reflow to simulate real-world scenario

  setProps2(el, {
    id: undefined,
    "data-custom": "test2",
    style: {
      display: "block",
      color: "red",
      background: undefined,
    },
    onclick(e) {
      console.log("click", e);
    },
  });

  document.body.offsetHeight; // Force reflow to simulate real-world scenario
});

// bench("textContent", {
//   async setup() {
//     count = 0;
//     document.body.innerHTML = `<button>${count}</button>`;
//     const button = await locator("button")
//       .getOne() as HTMLButtonElement;
//     const buttonText = button.childNodes[0] as Text;
//     button.onclick = () => {
//       count++;
//       buttonText.textContent = String(count);
//     };
//   },
// }, async () => {
//   const countToWaitFor = count + 1;
//   const button = await locator("button").getOne() as HTMLButtonElement;

//   button.click();

//   await locator("button").hasText(String(countToWaitFor)).getOne();
// });

// bench("nodeValue", {
//   async setup() {
//     count = 0;
//     document.body.innerHTML = `<button>${count}</button>`;
//     const button = await locator("button").getOne() as HTMLButtonElement;
//     const buttonText = button.childNodes[0] as Text;
//     button.onclick = () => {
//       count++;
//       buttonText.nodeValue = String(count);
//     };
//   },
// }, async () => {
//   const countToWaitFor = count + 1;
//   const button = await locator("button").getOne() as HTMLButtonElement;

//   button.click();

//   await locator("button").hasText(String(countToWaitFor)).getOne();
// });

// bench("radi", {
//   async setup() {
//     function RadiCounter(this: HTMLElement) {
//       return (
//         <button
//           onclick={() => {
//             count++;
//             update(this);
//           }}
//         >
//           {() => count}
//         </button>
//       );
//     }

//     count = 0;
//     const cmp = <RadiCounter />;
//     createRoot(document.body).render(cmp);

//     await locator("button").hasText(String(0)).getOne();
//   },
// }, async () => {
//   const countToWaitFor = count + 1;
//   const button = await locator("button").getOne() as HTMLButtonElement;

//   button.click();

//   await locator("button").hasText(String(countToWaitFor)).getOne();
// });

// bench("react", {
//   async setup() {
//     function ReactCounter() {
//       const [, setTick] = useState(0);

//       return createElementReact(
//         "button",
//         {
//           onClick: () => {
//             count++;
//             flushSync(() => setTick((t) => t + 1));
//           },
//         },
//         String(count),
//       );
//     }

//     count = 0;
//     createRootReact(document.body).render(
//       createElementReact(ReactCounter, null),
//     );

//     await locator("button").hasText(String(0)).getOne();
//   },
// }, async () => {
//   const countToWaitFor = count + 1;
//   const button = await locator("button").getOne() as HTMLButtonElement;

//   button.click();

//   await locator("button").hasText(String(countToWaitFor)).getOne();
// });

await bench.run();
