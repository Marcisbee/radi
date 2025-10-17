import {
  type Browser,
  chromium,
  type ConsoleMessage,
  type Page,
  type Request,
} from "npm:playwright@1.56.1";

declare global {
  interface Window {
    __done?: () => void;
  }
}

export async function startBrowser(html: string, watch: boolean) {
  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage();

  // Relay browser console logs
  page.on("console", async (msg: ConsoleMessage) => {
    const type = msg.type();

    const args = await Promise.all(msg.args().map((arg) => arg.jsonValue()));

    if (!args.length) {
      await msg.page()?.consoleMessages();
    }

    if (type === "table") {
      console.table(...args);
      return;
    }

    if (type === "startGroup") {
      console.group(...args);
      return;
    }
    if (type === "startGroupCollapsed") {
      console.groupCollapsed(...args);
      return;
    }
    if (type === "endGroup") {
      console.groupEnd();
      return;
    }

    console.log(...args);
  });

  // Relay page errors
  page.on("pageerror", (err: Error) => {
    console.error(`[pageerror] ${err.message}\n${err.stack}`);
  });

  // Network request failures
  page.on("requestfailed", (req: Request) => {
    console.error(
      `[requestfailed] ${req.url()} ${req.failure()?.errorText || ""}`,
    );
  });

  // Expose done relay to page
  await page.exposeFunction("__done", async (isFailing: boolean) => {
    try {
      await browser.close();
    } catch (_) {
      // ignore
    } finally {
      if (!watch) {
        Deno.exit(isFailing ? 1 : 0);
      }
    }
  });

  await page.setContent(html);
}
