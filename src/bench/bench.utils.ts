function getElement(xpath: string) {
  return document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue as Element | null;
}

export function waitForXPath<T extends Node>(
  xpath: string,
  timeoutMs: number = 4000,
): Promise<T> {
  const el = getElement(xpath) as any;
  if (el?.isConnected) {
    return Promise.resolve(el);
  }

  // deno-lint-ignore no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    // Double-check immediately to avoid races
    const immediate = getElement(xpath) as any;
    if (immediate?.isConnected) {
      resolve(immediate);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      reject(new Error(`Timeout waiting for XPath: ${xpath}`));
    }, timeoutMs);

    try {
      while (!cancelled) {
        const candidate = getElement(xpath) as any;
        if (candidate?.isConnected) {
          if (!cancelled) {
            cancelled = true;
            clearTimeout(timer);
            resolve(candidate);
          }
          return;
        }
        await new Promise<void>((res) => requestAnimationFrame(res as any));
      }
    } catch (err) {
      if (!cancelled) {
        cancelled = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}
