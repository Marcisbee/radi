import type { ResumeContext } from "../src/resume.ts";

export function increment({ state, boundary }: ResumeContext) {
  const counter = state as { count: number };
  boundary.querySelector("output")!.textContent = String(++counter.count);
  boundary.querySelector("[role=status]")!.textContent =
    "Updated in place. The rest of the page stays static.";
}
