// let observer: MutationObserver | null = null;
const pendingPromises: Map<string, (element: Element) => void> = new Map();

function getElement(xpath: string) {
  return document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue as Element | null;
}

const observer = new MutationObserver(() => {
  for (const [xpath, resolve] of pendingPromises) {
    const el = getElement(xpath);
    if (el) {
      pendingPromises.delete(xpath);
      resolve(el);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
});

export async function waitForXPath(xpath: string): Promise<Element> {
  const el = getElement(xpath);
  if (el) {
    return el;
  }

  return new Promise((resolve, reject) => {
    // Check immediately
    const el = getElement(xpath);
    if (el) {
      return el;
    }

    // Add to pending promises
    pendingPromises.set(xpath, resolve);
  });
}
