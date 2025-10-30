const tasks = new Set<() => void>();
let microtaskScheduled = false;

function runAfterConnected(task: () => void) {
  tasks.add(task);
  if (microtaskScheduled) return;
  microtaskScheduled = true;
  microtaskTarget.dispatchEvent(
    new Event("microtask", { cancelable: true }),
  );
}

const microtaskTarget = new EventTarget();

microtaskTarget.addEventListener(
  "microtask",
  (e) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    for (const task of tasks) task();
    tasks.clear();
    microtaskScheduled = false;
  },
  { capture: true },
);

function sendConnectEvent(target: Node) {
  if (!target.isConnected) {
    return;
  }
  if (target.onconnect || target.__component || target.__reactive_children) {
    queueMicrotask(() => {
      if (!target.isConnected) {
        return;
      }
      target.dispatchEvent(new Event("connect"));
    });
  }
}

function sendDisconnectEvent(target: Node) {
  if (target.isConnected) {
    return;
  }
  if (target.ondisconnect || target.__component || target.__reactive_children) {
    queueMicrotask(() => {
      target.dispatchEvent(new Event("disconnect"));
    });
  }
}

function sendUpdateEvent(target: Node) {
  if (!target.isConnected) {
    return true;
  }
  if (
    target.onupdate || target.__component || target.__reactive_children ||
    target.__reactive_attributes
  ) {
    // queueMicrotask(() => {
    return target.dispatchEvent(new Event("update", { cancelable: true }));
    // });
  }
  return true;
}

function replace(childNew: Node, childOld: Node) {
  childOld.replaceWith(childNew);
  // queueMicrotask(() => {
  sendConnectEvent(childNew);
  sendDisconnectEvent(childOld);
  // for (const el of traverseReactiveChildren([childOld])) {
  //   el.dispatchEvent(new Event("disconnect"));
  // }
  // });
  return childNew;
}

function connect(child: Node, parent: Node) {
  if (
    parent.nodeType === Node.COMMENT_NODE ||
    parent.nodeType === Node.TEXT_NODE
  ) {
    // Preserve ordering of reactive children by appending after the last inserted child for this anchor.
    const tail: Node = parent?.__tail.isConnected ? parent.__tail : parent;
    tail.after(child);
    parent.__tail = child;
    // queueMicrotask(() => {
    sendConnectEvent(child);
    // });
    return child;
  }

  parent.appendChild(child);

  if (child.__component) {
    // if (parent.isConnected) {
    //   build(child.__component(child), child);
    //   // queueMicrotask(() => {
    //   child.dispatchEvent(new Event("connect"));
    //   // });
    // } else {
    //   runAfterConnected(() => {
    //     build(child.__component(child), child);
    //     // queueMicrotask(() => {
    //     child.dispatchEvent(new Event("connect"));
    //     // });
    //   });
    // }
    // return child;
    queueMicrotask(() => {
      if (!child.isConnected) {
        return;
      }
      build(child.__component(child), child);
      // queueMicrotask(() => {
      // child.dispatchEvent(new Event('connect'));
      // });
    });
  }

  sendConnectEvent(child);

  return child;
}

function disconnect(child: Node) {
  if (child?.nodeType === Node.COMMENT_NODE && "__reactive_children" in child) {
    for (const cc of child.__reactive_children || []) {
      disconnect(cc);
    }

    if ("__tail" in child) (child as any).__tail = null;
  }

  if (Array.isArray(child)) {
    for (const c of child) {
      disconnect(c);
    }
    return child;
  }

  child.remove();

  sendDisconnectEvent(child);
  // child.dispatchEvent(new Event("disconnect"));
  // for (const el of traverseReactiveChildren([child])) {
  //   el.dispatchEvent(new Event("disconnect"));
  // }

  return child;
}

function setReactiveAttribute(
  element: HTMLElement,
  key: string,
  value: (element: HTMLElement) => any,
) {
  element.setAttribute("_r", "");
  element.__reactive_attributes ??= new Map<string, (target: Node) => void>();
  const update = (e: HTMLElement) => {
    const v = value(e);
    if (v === false || v == null) {
      e.removeAttribute(key);
    } else if (v === true) {
      e.setAttribute(key, "");
    } else {
      e.setAttribute(key, v);
    }
  };
  element.__reactive_attributes.set(key, update);
  return update;
}

function diffAttributes(fromNode: Element, toNode: Element) {
  var toNodeAttrs = toNode.attributes;
  var attr;
  var attrName;
  var attrNamespaceURI;
  var attrValue;
  var fromValue;

  toNode.__reactive_attributes = fromNode.__reactive_attributes;
  if (fromNode.__reactive_attributes instanceof Map) {
    fromNode.__reactive_attributes.clear();
  }

  // document-fragments dont have attributes so lets not do anything
  if (toNode.nodeType === 11 || fromNode.nodeType === 11) {
    return;
  }

  // update attributes on original DOM element
  for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
    attr = toNodeAttrs[i];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    attrValue = attr.value;

    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);

      if (fromValue !== attrValue) {
        if (attr.prefix === "xmlns") {
          attrName = attr.name; // It's not allowed to set an attribute with the XMLNS namespace without specifying the `xmlns` prefix
        }
        fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
      }
    } else {
      fromValue = fromNode.getAttribute(attrName);

      if (fromValue !== attrValue) {
        fromNode.setAttribute(attrName, attrValue);
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  var fromNodeAttrs = fromNode.attributes;

  for (var d = fromNodeAttrs.length - 1; d >= 0; d--) {
    attr = fromNodeAttrs[d];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;

    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;

      if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
        fromNode.removeAttributeNS(attrNamespaceURI, attrName);
      }
    } else {
      if (!toNode.hasAttribute(attrName)) {
        fromNode.removeAttribute(attrName);
      }
    }
  }
}

function buildRender(parent: Anchor, fn: (parent: Anchor) => any) {
  parent.__render = () => {
    (parent as any).__tail = parent;
    parent.__reactive_children = ([] as any[]).concat(
      diff(parent.__reactive_children, fn(parent), parent),
    );
  };
}

function diff(valueOld: any, valueNew: any, parent: Node): Node[] {
  if (parent.__render_id === currentUpdateId) {
    // Already processed this branch for this update; return the last known children if tracked
    return (parent.__reactive_children as Node[]) || [];
  }

  const arrayOld = Array.isArray(valueOld) ? valueOld : [valueOld];
  const arrayNew = Array.isArray(valueNew) ? valueNew : [valueNew];
  const arrayOut = Array(arrayNew.length);

  let i = 0;
  for (const itemNew of arrayNew) {
    const ii = i++;
    const itemOld = arrayOld[ii];

    if (itemOld === undefined) {
      arrayOut[ii] = build(itemNew, parent);
      continue;
    }

    if (Array.isArray(itemOld)) {
      if (Array.isArray(itemNew)) {
        const output = diff(itemOld, itemNew, parent);
        arrayOut[ii] = Array.isArray(output) ? output : [output];
        continue;
      }
    }

    if (itemOld === itemNew) {
      arrayOut[ii] = itemOld;
      continue;
    }

    if (
      itemOld.nodeType === Node.COMMENT_NODE &&
      "__reactive_children" in itemOld
    ) {
      if (typeof itemNew === "function") {
        // Handled by updater(...)
        itemOld.__memo = itemOld.__memo;
        buildRender(itemOld, itemNew);
        arrayOut[ii] = itemOld;
        continue;
      }

      if (
        itemNew.nodeType === Node.COMMENT_NODE &&
        "__reactive_children" in itemNew
      ) {
        // Handled by updater(...)
        arrayOut[ii] = itemOld;
        continue;
      }
    }

    if (itemOld.nodeType === Node.TEXT_NODE) {
      if (typeof itemNew === "string" || typeof itemNew === "number") {
        itemOld.nodeValue = itemNew;
        arrayOut[ii] = itemOld;
        continue;
      }

      if (itemNew?.nodeType === Node.TEXT_NODE) {
        itemOld.nodeValue = itemNew.nodeValue;
        arrayOut[ii] = itemOld;
        continue;
      }
    }

    if (itemOld.nodeType === Node.ELEMENT_NODE) {
      if (
        itemNew?.nodeType === Node.ELEMENT_NODE &&
        itemOld.nodeName === itemNew.nodeName
      ) {
        if (itemNew.__component) {
          if (
            itemOld.__props?.key !== itemNew.__props?.key ||
            itemOld.__type !== itemNew.__type
          ) {
            replace(itemNew, itemOld);
            build(itemNew.__component(itemNew), itemNew);
            arrayOut[ii] = itemNew;
            continue;
          }

          itemOld.__props = itemNew.__props;
          itemOld.__component = itemNew.__component;
          // buildRender(itemOld as any, itemOld.__component);
          arrayOut[ii] = itemOld;
          continue;
        }

        diffAttributes(itemOld, itemNew);

        diff(
          Array.from(itemOld.childNodes),
          Array.from(itemNew.childNodes),
          itemOld,
        );

        arrayOut[ii] = itemOld;
        continue;
      }

      if (itemNew?.nodeType === Node.ELEMENT_NODE) {
        replace(itemNew, itemOld);
        arrayOut[ii] = itemNew;
        continue;
      }

      // arrayOut[ii] = build(itemNew, parent);
      // disconnect(itemOld);
      // continue;
    }

    // console.warn('DANGER', { itemNew, itemOld });
    // For reactive anchor parents, preserve relative ordering on replacement
    if (
      (parent.nodeType === Node.COMMENT_NODE ||
        parent.nodeType === Node.TEXT_NODE) &&
      itemOld?.nodeType
    ) {
      const builtNode = build(itemNew, parent) as Node;
      replace(builtNode, itemOld as Node);
      disconnect(itemOld as Node);
      arrayOut[ii] = builtNode;
      continue;
    }

    arrayOut[ii] = build(itemNew, parent);
    disconnect(itemOld);
  }

  for (const toRemove of arrayOld.slice(arrayNew.length)) {
    disconnect(toRemove);
  }

  return arrayOut;
}

function runUpdate(target: Node) {
  if (!sendUpdateEvent(target)) {
    return false;
  }
  // target.dispatchEvent(new Event("update"));
  if (target.isConnected && target.__render_id !== currentUpdateId) {
    if ("__render" in target) {
      if (!target.__memo?.()) {
        target.__render(target);
      }
    } else if ("__reactive_attributes" in target) {
      for (const update of target.__reactive_attributes.values()) {
        update(target);
      }
    }
    target.__render_id = currentUpdateId;
  }
  return true;
}

function updater(target: Node) {
  currentUpdateId += 1;
  // console.log("UPDATE", currentUpdateId, target);

  if (!runUpdate(target)) {
    return;
  }

  if (target.__reactive_children) {
    // target.dispatchEvent(new Event("update"))
    for (
      const toUpdate of traverseReactiveChildren(
        [].concat(target.__reactive_children || []),
      )
    ) {
      // toUpdate.dispatchEvent(new Event("update"))
      runUpdate(toUpdate);
    }
  } else {
    for (const toUpdate of traverseReactiveChildren([target])) {
      // toUpdate.dispatchEvent(new Event("update"))
      runUpdate(toUpdate);
    }
  }
}

class UpdateEvent extends Event {
  constructor(public node: Node) {
    super("update");
  }
}

const updateTarget = new EventTarget();
updateTarget.addEventListener(
  "update",
  (e) => {
    e.stopImmediatePropagation();
    if (e.node instanceof Node) {
      updater(e.node);
    }
  },
  { capture: true, passive: true },
);

// const updateEventId = `update:${Date.now()}`;
let currentUpdateId: number = 0;
// document.addEventListener(
//   updateEventId,
//   (e) => {
//     e.stopImmediatePropagation();
//     if (e.target instanceof Node) {
//       updater(e.target);
//     }
//   },
//   { capture: true },
// );

function traverseReactiveChildren(scopes: Node[]) {
  const reactive: Anchor[] = [];

  for (const scope of scopes) {
    const xpathResult = document.evaluate(
      ".//comment() | .//*[@_r] | .//host",
      scope,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null,
    );
    let node = xpathResult.iterateNext();
    while (node) {
      if ("__reactive_children" in node || "__reactive_attributes" in node) {
        reactive.push(node as any);
      }
      node = xpathResult.iterateNext();
    }
  }
  return reactive;
}

type BuiltNode = (Node | Node[]) | BuiltNode[];
type Anchor = Node & {
  __reactive_children: Node[];
  __render_id: number;
  __render: (anchor: Anchor) => void;
};
type ComponentHost = Node & {
  __type: Function;
  __key: string | undefined;
  __instance: BuiltNode;
  __component: (anchor: ComponentHost) => BuiltNode;
};

let i = 0;
function build(a: any, parent: Node): BuiltNode {
  if (Array.isArray(a)) {
    return a.map((child) => build(child, parent));
  }

  if (typeof a === "string") {
    const node = document.createTextNode(a);
    connect(node, parent);
    return node;
  }

  if (typeof a === "number") {
    const node = document.createTextNode(String(a));
    connect(node, parent);
    return node;
  }

  if (typeof a === "boolean") {
    const node = document.createComment(String(a));
    connect(node, parent);
    return node;
  }

  if (a == null) {
    const node = document.createComment("null");
    connect(node, parent);
    return node;
  }

  if (typeof a?.subscribe === "function") {
    const b = a;
    let value;
    let anchor;
    const unsub = b.subscribe((v) => {
      value = v;
      if (anchor) {
        update(anchor);
      }
    });
    a = (e) => {
      anchor = e;
      e.addEventListener("disconnect", () => {
        unsub?.unsubscribe?.();
      }, { once: true });
      return value;
    };
  }

  if (typeof a === "function") {
    const anchor = document.createComment("$") as any as Anchor;
    // const anchor = document.createComment("$" + i++) as any as Anchor;
    connect(anchor, parent);
    anchor.__render_id = currentUpdateId;
    anchor.__reactive_children = ([] as any[]).concat(build(a(anchor), parent));
    buildRender(anchor, a);
    return anchor;
  }

  connect(a, parent);
  return a;
}

export const Fragment = Symbol("Fragment");

export function createElement(
  type: string | Function,
  props: null | Record<string, any>,
  ...children: any[]
): Node {
  if (typeof type === "string") {
    const element = document.createElement(type);
    if (props) {
      for (const key in props) {
        const value = props[key];
        const attrKey = key === "className" ? "class" : key;
        // subscribable (has .subscribe)
        if (value && typeof value.subscribe === "function") {
          if (attrKey === "style") {
            element.setAttribute("_r", "");
            element.__reactive_attributes ??= new Map<
              string,
              (target: Node) => void
            >();
            let current: any;
            const update = (e: HTMLElement) => {
              const v = current;
              if (v && typeof v === "object") {
                for (const k in v) {
                  (e.style as any)[k] = v[k];
                }
              } else if (v == null) {
                e.removeAttribute("style");
              } else {
                e.setAttribute("style", v);
              }
            };
            element.__reactive_attributes.set("style", update);
            const sub = value.subscribe((v: any) => {
              current = v;
              update(element as any);
            });
            element.addEventListener(
              "disconnect",
              () => {
                sub?.unsubscribe?.();
              },
              { once: true },
            );
          } else if (attrKey === "class") {
            element.setAttribute("_r", "");
            element.__reactive_attributes ??= new Map<
              string,
              (target: Node) => void
            >();
            let current: any;
            const update = (e: HTMLElement) => {
              const v = current;
              if (v && typeof v === "object") {
                for (const cls in v) {
                  if (v[cls]) e.classList.add(cls);
                  else e.classList.remove(cls);
                }
              } else if (v == null) {
                e.removeAttribute("class");
              } else {
                e.setAttribute("class", v);
              }
            };
            element.__reactive_attributes.set("class", update);
            const sub = value.subscribe((v: any) => {
              current = v;
              update(element as any);
            });
            element.addEventListener(
              "disconnect",
              () => {
                sub?.unsubscribe?.();
              },
              { once: true },
            );
          } else {
            let current: any;
            const update = setReactiveAttribute(
              element as any,
              attrKey,
              () => current,
            );
            const sub = value.subscribe((v: any) => {
              current = v;
              update(element as any);
            });
            element.addEventListener(
              "disconnect",
              () => {
                sub?.unsubscribe?.();
              },
              { once: true },
            );
          }
          continue;
        }
        if (attrKey === "style") {
          if (typeof value === "function") {
            // reactive style object or string
            element.setAttribute("_r", "");
            element.__reactive_attributes ??= new Map<
              string,
              (target: Node) => void
            >();
            const update = (e: HTMLElement) => {
              const v = value(e);
              if (v && typeof v === "object") {
                for (const k in v) {
                  (e.style as any)[k] = v[k];
                }
              } else if (v == null) {
                e.removeAttribute("style");
              } else {
                e.setAttribute("style", v);
              }
            };
            element.__reactive_attributes.set("style", update);
            update(element as any);
          } else if (value && typeof value === "object") {
            for (const k in value) {
              (element.style as any)[k] = value[k];
            }
          } else if (value != null) {
            element.setAttribute("style", value);
          }
          continue;
        }
        if (attrKey === "class") {
          if (typeof value === "function") {
            element.setAttribute("_r", "");
            element.__reactive_attributes ??= new Map<
              string,
              (target: Node) => void
            >();
            const update = (e: HTMLElement) => {
              const v = value(e);
              if (v && typeof v === "object") {
                for (const cls in v) {
                  if (v[cls]) e.classList.add(cls);
                  else e.classList.remove(cls);
                }
              } else if (v == null) {
                e.removeAttribute("class");
              } else {
                e.setAttribute("class", v);
              }
            };
            element.__reactive_attributes.set("class", update);
            update(element as any);
          } else if (value && typeof value === "object") {
            for (const cls in value) {
              if (value[cls]) element.classList.add(cls);
              else element.classList.remove(cls);
            }
          } else if (value != null) {
            element.setAttribute("class", value);
          }
          continue;
        }
        if (key.startsWith("on")) {
          element.addEventListener(key.substring(2), value);
        } else if (typeof value === "function") {
          setReactiveAttribute(element as any, attrKey, value)(element as any);
        } else {
          if (value === true) {
            element.setAttribute(attrKey, "");
          } else if (value === false || value == null) {
            continue;
          } else {
            element.setAttribute(attrKey, value);
          }
        }
      }
    }
    build(children, element);
    return element;
  }

  if (typeof type === "function") {
    const host = document.createElement("host") as any as ComponentHost;
    host.__type = type;
    // @TODO: figure out a better solution to this:
    host.__props = { ...props, children };
    host.__component = (anchor) => {
      try {
        if (!host.__instance || props?.key !== host.__props?.key) {
          // host.__props = props;
          return (host.__instance = type.call(host, () => (host.__props)));
        }
        // host.__props = props;
        return host.__instance;
      } catch (error) {
        queueMicrotask(() => {
          if (
            host.dispatchEvent(
              new ErrorEvent("error", {
                error,
                bubbles: true,
                composed: true,
                cancelable: true,
              }),
            )
          ) {
            console.error(type?.name, error);
          }
        });
      }
      return `(ERROR in ${type?.name})`;
    };
    return host;
  }

  if (type === Fragment) {
    return props?.children || [];
  }

  return document.createTextNode("<UNHANDLED>");
}

export function createRoot(target: HTMLElement) {
  const out: { render(el: Child): Node; root: null | Node } = {
    render(el: Child) {
      sendConnectEvent(el);
      return (out.root = build(el, target));
    },
    root: null,
    unmount() {
      if (out.root) {
        disconnect(out.root);
        out.root = null;
      }
    },
  };
  return out;
}

export function update(target: Node) {
  return updateTarget.dispatchEvent(new UpdateEvent(target));
  // return target.dispatchEvent(new Event(updateEventId));
}

export function memo(fn: () => any, shouldMemo: () => boolean) {
  return (anchor) => {
    anchor.__memo = shouldMemo;
    return fn(anchor);
  };
}

// function Counter(this: HTMLElement, props: any) {
//   let count = props().start || 0;
//   console.log('render only once');
//   return (
//     <button
//       style={() =>
//         'color: #' +
//         ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0')
//       }
//       onclick={() => {
//         count++;
//         this.dispatchEvent(new Event('update'));
//       }}
//     >
//       {() => count}
//     </button>
//   );
// }

// function PassThru(this: HTMLElement, props: any) {
//   console.log('FIRST');

//   this.addEventListener('error', (e) => {
//     console.log('ERROR????', e);
//   });

//   return <h1 style="color:orange">{() => props().children}</h1>;
// }

// function Child(this: HTMLElement, props: any) {
//   throw new Error('poop');
//   console.log('SECOND');
//   return <i>Poop</i>;
// }

// function App(this: HTMLElement) {
//   let count = 0;

//   return (
//     <div>
//       <h1>Hello {() => (count % 2 ? 'world' : <i>Mars</i>)}!</h1>
//       <h3>{() => Math.random()}</h3>
//       <h3>{Math.random()}</h3>
//       <div>
//         {'A '}
//         {() => {
//           console.log('A1');
//           const color =
//             '#' +
//             ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
//           return [
//             [
//               [
//                 [
//                   [
//                     String(count),
//                     h(
//                       'strong',
//                       {
//                         style: 'color:' + color,
//                       },
//                       ' B ',
//                       color
//                     ),
//                   ],
//                 ],
//                 ' (',
//                 () => (
//                   console.log('A2'),
//                   () => (console.log('A3'), count % 2 ? 'Hey' : null)
//                 ),
//                 ')',
//               ],
//               1,
//             ],
//           ];
//         }}
//       </div>
//       <PassThru>
//         A <Child /> B
//       </PassThru>
//       <button
//         type="button"
//         onclick={() => {
//           count++;
//           this.dispatchEvent(new Event('update'));
//         }}
//       >
//         asd
//       </button>
//       <hr />
//       {() => (
//         console.log('EVERY TIME', count), (<Counter key={count} start={5} />)
//       )}
//       {memo(
//         () => (
//           console.log('EVERY SECOND', count),
//           (<Counter key={count} start={5} />)
//         ),
//         () => count % 2
//       )}
//     </div>
//   );
// }

// console.clear();
// render(<App />, document.body);
