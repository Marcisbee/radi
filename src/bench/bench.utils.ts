export async function waitUntilElementVisible(
  selector: string,
  target: HTMLElement = document.body,
) {
  function find(target: HTMLElement) {
    return document.evaluate(
      selector,
      target,
      null,
      XPathResult.ANY_TYPE,
      null,
    ).iterateNext();
  }

  const preExisting = find(target);
  if (preExisting) {
    return preExisting;
  }

  return new Promise((resolve) => {
    const preExisting = find(target);
    if (preExisting) {
      return preExisting;
    }

    const obs = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (node instanceof HTMLElement) {
            // const found = node.querySelector(selector);
            const found = find(node);
            if (found) {
              obs.disconnect();
              resolve(found);
              return;
            }
          }
        }
      }
    });

    obs.observe(target, { childList: true, subtree: true });
  });
}
