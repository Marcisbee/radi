import { render } from "../src/main.ts";

export function mount(...args: Parameters<typeof render>) {
  const container = render(...args);
  return new Promise<HTMLElement>((resolve) =>
    container.addEventListener(
      "connect",
      (event) => resolve(event.target as any),
      {
        once: true,
      },
    )
  );
}
