// let observer: MutationObserver | null = null;
// const pendingPromises: Map<string, (element: Element) => void> = new Map();

function getElement(xpath: string) {
  return document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue as Element | null;
}

// const observer = new MutationObserver(() => {
//   for (const [xpath, resolve] of pendingPromises) {
//     const el = getElement(xpath);
//     if (el) {
//       pendingPromises.delete(xpath);
//       resolve(el);
//     }
//   }
// });

// observer.observe(document.documentElement, {
//   childList: true,
//   subtree: true,
//   attributes: true,
// });

export function waitForXPath<T extends Node>(
  xpath: string,
  timeoutMs: number = 4000,
): Promise<T> {
  const el = getElement(xpath) as any;
  if (el) {
    return Promise.resolve(el);
  }

  // deno-lint-ignore no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    // Double-check immediately to avoid races
    const immediate = getElement(xpath) as any;
    if (immediate) {
      resolve(immediate);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      reject(new Error(`Timeout waiting for XPath: ${xpath}`));
    }, timeoutMs);

    let el: any;
    while (!(cancelled || (el = getElement(xpath)))) {
      await new Promise<void>((res) => requestAnimationFrame(res as any));
      clearTimeout(timer);
      resolve(el!);
    }
  });
}
