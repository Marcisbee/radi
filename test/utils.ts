import { createRoot } from "../src/main.ts";

export function mount(
  element: Parameters<ReturnType<typeof createRoot>["render"]>[0],
  parent: Parameters<typeof createRoot>[0],
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

  const { render } = createRoot(parent);
  render(element);
  return promise;
}
