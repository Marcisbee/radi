import { bubbleError } from "./error.ts";
import { ATTRS, CLEANUP, REACTIVE_ATTRIBUTES } from "./symbols.ts";

type Observable<T> = {
  readonly current: T;
  subscribe(cb: (v: T) => void): { unsubscribe(): void };
};
type Reactive<T> = (() => T) | Observable<T>;

const isFunc = (v: any): v is Function => typeof v === "function";
const isObs = <T>(v: any): v is Observable<T> =>
  v && typeof v === "object" && "subscribe" in v && isFunc(v.subscribe);

const PROP_TO_ATTR: Record<string, string> = {
  className: "class",
  htmlFor: "for",
};

const markReactive = (el: HTMLElement) => {
  if (!el.hasAttribute("_r")) {
    el.setAttribute("_r", "");
    el.addEventListener("update", () => {
      const fns = (el as any)[REACTIVE_ATTRIBUTES] as Function[] ?? [];
      for (const fn of fns) fn();
    });
  }
};

const unmarkReactive = (el: HTMLElement) => {
  if (el.hasAttribute("_r") && !(el as any)[REACTIVE_ATTRIBUTES]?.length) {
    el.removeAttribute("_r");
    el.removeEventListener("update", () => {});
  }
};

export function setProps(el: HTMLElement, propsNew: Record<string, any>) {
  const style = el.style;
  const old = (el as any)[ATTRS] ?? {};
  (el as any)[ATTRS] = propsNew;

  // cleanup removed props
  for (const k in old) {
    if (k in propsNew) continue;
    if (k === "style") style.cssText = "";
    else if (k.length > 2 && k.startsWith("on")) {
      (el as any)[k.toLowerCase()] = null;
    } else if (k in PROP_TO_ATTR) {
      (el as any)[k] = k === "className" ? "" : null;
    } else el.removeAttribute(PROP_TO_ATTR[k] || k);
  }

  // reactive storage (filter old reactives)
  const reacts: Function[] = (el as any)[REACTIVE_ATTRIBUTES] = [];
  const cleanup: Function[] = [];

  // apply new/updated props
  for (const key in propsNew) {
    const vNew = propsNew[key];
    const vOld = old[key];
    if (vNew === vOld) continue;

    // style object
    if (key === "style" && typeof vNew === "object" && vNew) {
      const sOld = vOld ?? {};
      const sNew = vNew;

      for (const sk in sOld) if (!(sk in sNew)) style.removeProperty(sk);
      for (const sk in sNew) {
        const val = sNew[sk];
        const setter = (v: any) => {
          v == null ? style.removeProperty(sk) : (style as any)[sk] = v;
        };
        if (isFunc(val)) {
          const fn = () => {
            try {
              return setter(val(el));
            } catch (error) {
              if (el.isConnected) bubbleError(error, el, "attr:" + key);
              else queueMicrotask(() => bubbleError(error, el, "attr:" + key));
            }
          };
          reacts[reacts.push(fn) - 1]();
        } else if (isObs(val)) {
          cleanup.push(val.subscribe(setter).unsubscribe);
        } else if (sOld[sk] !== val) {
          (style as any)[sk] = val ?? "";
        }
      }
      continue;
    }

    // special DOM properties
    if (
      key === "className" || key === "value" || key === "checked" ||
      key === "htmlFor"
    ) {
      const setter = (v: any) => {
        (el as any)[key] = v ??
          (key === "className" ? "" : key === "checked" ? false : null);
      };
      if (isFunc(vNew)) {
        const fn = () => {
          try {
            return setter(vNew(el));
          } catch (error) {
            if (el.isConnected) bubbleError(error, el, "attr:" + key);
            else queueMicrotask(() => bubbleError(error, el, "attr:" + key));
          }
        };
        reacts[reacts.push(fn) - 1]();
      } else if (isObs(vNew)) {
        cleanup.push(vNew.subscribe(setter).unsubscribe);
      } else {
        (el as any)[key] = vNew ??
          (key === "className" ? "" : key === "checked" ? false : null);
      }
      continue;
    }

    // event handlers
    if (key.length > 2 && key.startsWith("on")) {
      (el as any)[key.toLowerCase()] = isFunc(vNew) ? vNew : null;
      continue;
    }

    // default: attribute
    const attrName = PROP_TO_ATTR[key] || key;
    const setter = (v: any) => {
      if (v == null || v === false) el.removeAttribute(attrName);
      else if (v === true) el.setAttribute(attrName, "");
      else el.setAttribute(attrName, v);
    };
    if (isFunc(vNew)) {
      const fn = () => {
        try {
          return setter(vNew(el));
        } catch (error) {
          if (el.isConnected) bubbleError(error, el, "attr:" + key);
          else queueMicrotask(() => bubbleError(error, el, "attr:" + key));
        }
      };
      reacts[reacts.push(fn) - 1]();
    } else if (isObs(vNew)) {
      cleanup.push(vNew.subscribe(setter).unsubscribe);
    } else {
      if (vNew == null || vNew === false) el.removeAttribute(attrName);
      else if (vNew === true) el.setAttribute(attrName, "");
      else el.setAttribute(attrName, vNew);
    }
  }

  // manage listener & cleanup old subs
  if (reacts.length || cleanup.length) markReactive(el);
  else unmarkReactive(el);

  // cleanup previous unsubscribes
  for (const unsub of ((el as any)[CLEANUP] ?? [])) unsub();
  (el as any)[CLEANUP] = cleanup;
}
