import { Radi } from "../src/main.ts";

export function mount(...args: Parameters<typeof Radi.render>) {
  const container = Radi.render(...args);
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
