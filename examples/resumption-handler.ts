import type { ResumeContext } from '../src/resume.ts';

export function increment({ state, boundary }: ResumeContext) {
  const counter = state as { count: number };
  boundary.querySelector('output')!.firstChild!.nodeValue = String(
    ++counter.count,
  );
  boundary.querySelector('[role=status]')!.textContent =
    'Click delivered. Existing counter nodes retained.';
}
