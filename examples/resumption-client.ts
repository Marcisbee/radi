import { resume } from '../src/resume.ts';

resume(document, {
  // The example server deliberately delays this module response.
  increment: () =>
    import('./resumption-handler.js').then((module) => module.increment),
}, {
  onError: (error) => {
    document.querySelector('[role=status]')!.textContent = String(error);
  },
});
