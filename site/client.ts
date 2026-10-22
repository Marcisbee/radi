import { resume } from "../src/resume.ts";

resume(document, {
  increment: () => import("./handler.js").then((module) => module.increment),
}, {
  onError: () => {
    const status = document.querySelector("[role=status]");
    if (status) {
      status.textContent = "Could not load the counter. Please try again.";
    }
  },
});
