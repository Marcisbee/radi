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

interface StartBrowserOptions {
  headless?: boolean;
}

/**
 * Launch a Playwright Chromium browser.
 * - headless toggle (use --ui to run headed)
 */
export async function startBrowser(
  html: string,
  watch: boolean,
  { headless = true }: StartBrowserOptions = {},
) {
  // Launch configuration:
  // - Headless by default
  // - In UI mode (headless === false) open DevTools and keep browser open after tests
  const browser: Browser = await chromium.launch({
    headless,
    devtools: !headless,
    args: [
      "--enable-precise-memory-info",
      "--enable-benchmarking",
      // optional stability helpers:
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
    ],
  });
  const page: Page = await browser.newPage({
    bypassCSP: true,
  });

  await page.clock.install();

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

  page.on("pageerror", (err: Error) => {
    console.error(`[pageerror] ${err.message}\n${err.stack}`);
  });

  page.on("requestfailed", (req: Request) => {
    console.error(
      `[requestfailed] ${req.url()} ${req.failure()?.errorText || ""}`,
    );
  });

  await page.exposeFunction("__done", async (isFailing: boolean) => {
    if (headless) {
      // Allow any pending console events to flush before closing (jsonValue calls)
      await new Promise((r) => setTimeout(r, 75));
      try {
        await browser.close();
      } catch {
        // ignore
      }
      if (!watch) {
        Deno.exit(isFailing ? 1 : 0);
      }
    }
  });

  await page.setContent(html, { waitUntil: "load" });
}
