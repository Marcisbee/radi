/**
 * ISC License
 *
 * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * @param parentNode The container where children live
 * @param a The list of current/live children
 * @param b The list of future children
 * @param get The callback invoked per each entry related DOM operation.
 * @param before The optional node used as anchor to insert before.
 * @returns The same list of future children.
 */
export const diff = (
  parentNode: ParentNode | null,
  a: Node[],
  b: Node[],
  get: (entry: Node, action: number) => Node,
  before?: Node | null,
): Node[] => {
  if (!parentNode) return [];
  const bLength = b.length;
  let aEnd = a.length;
  let bEnd = bLength;
  let aStart = 0;
  let bStart = 0;
  let map: Map<Node, number> | null = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (aEnd === aStart) {
      const node = bEnd < bLength
        ? (bStart ? (get(b[bStart - 1], -0).nextSibling) : get(b[bEnd], 0))
        : before ?? null;
      while (bStart < bEnd) parentNode.insertBefore(get(b[bStart++], 1), node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) {
          parentNode.removeChild(get(a[aStart], -1));
        }
        aStart++;
      }
    } else if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
    } else if (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    } else if (
      a[aStart] === b[bEnd - 1] &&
      b[bStart] === a[aEnd - 1]
    ) {
      const node = get(a[--aEnd], -0).nextSibling;
      parentNode.insertBefore(
        get(b[bStart++], 1),
        get(a[aStart++], -0).nextSibling,
      );
      parentNode.insertBefore(get(b[--bEnd], 1), node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = new Map<Node, number>();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      if (map.has(a[aStart])) {
        const index = map.get(a[aStart]) as number;
        if (bStart < index && index < bEnd) {
          let i = aStart;
          let sequence = 1;
          while (
            ++i < aEnd &&
            i < bEnd &&
            map.get(a[i]) === (index + sequence)
          ) {
            sequence++;
          }
          if (sequence > (index - bStart)) {
            const node = get(a[aStart], 0);
            while (bStart < index) {
              parentNode.insertBefore(get(b[bStart++], 1), node);
            }
          } else {
            parentNode.replaceChild(
              get(b[bStart++], 1),
              get(a[aStart++], -1),
            );
          }
        } else {
          aStart++;
        }
      } else {
        parentNode.removeChild(get(a[aStart++], -1));
      }
    }
  }
  return b;
};

/**
 * VNode-aware diff:
 * Accepts arrays of VNodes (as produced by createElement) and patches element props
 * before delegating structural reconciliation to the DOM diff above.
 *
 * Keeps original structural diff while layering prop sync for string element VNodes.
 *
 * Limitations:
 * - No key-based reordering yet.
 * - Components / fragments are realized (their .ref) before diffing.
 * - Prop removal when new prop missing or null/undefined.
 */
type VNodeLike = {
  __v: true;
  ref: Node | Node[];
  type: unknown;
  props?: Record<string, unknown> | null;
};
type AnyEl = Element & { [key: string]: unknown };
function isVNodeLike(v: unknown): v is VNodeLike {
  return !!v &&
    typeof v === "object" &&
    "__v" in (v as Record<string, unknown>) &&
    (v as { __v?: unknown }).__v === true;
}
export const vdiff = (
  parentNode: ParentNode | null,
  aVNodes: VNodeLike[],
  bVNodes: VNodeLike[],
  before?: Node | null,
): Node[] => {
  if (!parentNode) return [];
  const toNode = (vn: VNodeLike | Node): Node => {
    if (isVNodeLike(vn)) {
      const ref = vn.ref;
      return Array.isArray(ref) ? ref[0] as Node : ref as Node;
    }
    return vn as Node;
  };

  const len = Math.min(aVNodes.length, bVNodes.length);
  for (let i = 0; i < len; i++) {
    const oldV: VNodeLike = aVNodes[i];
    const newV: VNodeLike = bVNodes[i];
    if (
      oldV && newV &&
      typeof oldV === "object" && typeof newV === "object" &&
      oldV.__v && newV.__v &&
      oldV.type === newV.type &&
      typeof newV.type === "string"
    ) {
      const el = toNode(oldV);
      if (el && (el as Node).nodeType === 1) {
        patchProps(
          el as AnyEl,
          (oldV.props || {}) as Record<string, unknown>,
          (newV.props || {}) as Record<string, unknown>,
        );
      }
    }
  }

  const aNodes: Node[] = aVNodes.map(toNode);
  const bNodes: Node[] = bVNodes.map(toNode);

  diff(
    parentNode,
    aNodes,
    bNodes,
    (entry: Node, _action: number) => entry,
    before,
  );

  return bNodes;
};

function patchProps(
  el: AnyEl,
  oldProps: Record<string, unknown>,
  newProps: Record<string, unknown>,
): void {
  for (const k in oldProps) {
    if (!(k in newProps)) {
      try {
        if (k.startsWith("on") && typeof oldProps[k] === "function") {
          const eventName = k.slice(2).toLowerCase();
          el.removeEventListener(
            eventName,
            oldProps[k] as unknown as EventListener,
          );
        } else {
          (el as AnyEl)[k] = "";
          const elem = el as unknown as Element;
          if (elem.hasAttribute?.(k)) elem.removeAttribute(k);
        }
      } catch {
        /* ignore */
      }
    }
  }
  for (const k in newProps) {
    const nv = newProps[k];
    const ov = oldProps[k];
    if (nv === ov) continue;
    try {
      if (k.startsWith("on") && typeof nv === "function") {
        const eventName = k.slice(2).toLowerCase();
        if (typeof ov === "function") {
          el.removeEventListener(eventName, ov as unknown as EventListener);
        }
        el.addEventListener(eventName, nv as unknown as EventListener);
      } else {
        if (nv == null) {
          (el as AnyEl)[k] = "";
          const elem = el as unknown as Element;
          if (elem.hasAttribute?.(k)) elem.removeAttribute(k);
        } else {
          (el as AnyEl)[k] = nv;
        }
      }
    } catch {
      /* ignore */
    }
  }
}
