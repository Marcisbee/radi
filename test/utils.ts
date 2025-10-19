import { render } from "../src/main.ts";

export function mount(
  element: Parameters<typeof render>[0],
  parent: Parameters<typeof render>[1],
) {
  const promise = new Promise<HTMLElement>((resolve) => {
    const onConnect = (event: Event) => resolve(event.target as HTMLElement);

    // Attach listener before calling render so we catch synchronous "connect" events
    (element as EventTarget).addEventListener("connect", onConnect, {
      once: true,
    });

    // If the element is already connected, resolve immediately and remove the listener
    if ((element as Node).isConnected) {
      (element as EventTarget).removeEventListener("connect", onConnect);
      resolve(element as HTMLElement);
    }
  });

  render(element, parent);
  return promise;
}
