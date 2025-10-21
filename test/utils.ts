import { createRoot } from "../src/main.ts";

export function mount(
  element: Parameters<ReturnType<typeof createRoot>["render"]>[0],
  parent: Parameters<typeof createRoot>[0],
) {
  const promise = new Promise<HTMLElement>((resolve) => {
    // Use a microtask to ensure the element is connected and built
    queueMicrotask(() => {
      resolve(element as HTMLElement);
    });
  });

  const { render } = createRoot(parent);
  render(element);
  return promise;
}
