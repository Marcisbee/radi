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
  interface GlobalThis {
    __instrumentedPages?: WeakSet<Page>;
  }
}

interface StartBrowserOptions {
  headless?: boolean;
}

/**
 * Launch a Playwright Chromium browser.
 * - headless toggle (use --ui to run headed)
 * - in watch+UI mode reuse a single browser & page; reload the page then inject new content
 */
let sharedBrowser: Browser | null = null;
let lastPage: Page | null = null;
const doneExposed = new WeakSet<Page>();
export async function startBrowser(
  html: string,
  watch: boolean,
  { headless = true }: StartBrowserOptions = {},
) {
  // Launch / reuse browser:
  // - Headless: new browser per run (allows clean exits)
  // - Headed + watch: reuse single browser instance & single page (reload each run)
  // - Headed + no watch: new browser once (caller likely invokes once)
  let browser: Browser;
  if (watch && !headless) {
    if (!sharedBrowser) {
      sharedBrowser = await chromium.launch({
        headless: false,
        devtools: true,
        args: [
          "--enable-precise-memory-info",
          "--enable-benchmarking",
          "--disable-background-timer-throttling",
          "--disable-renderer-backgrounding",
          "--disable-backgrounding-occluded-windows",
        ],
      });
    }
    browser = sharedBrowser;
    if (lastPage) {
      try {
        await lastPage.reload({ waitUntil: "domcontentloaded" });
      } catch {
        // Fallback: if reload fails create a fresh page
        try {
          lastPage = await browser.newPage({ bypassCSP: true });
        } catch { /* noop */ }
      }
    }
  } else {
    browser = await chromium.launch({
      headless,
      devtools: !headless,
      args: [
        "--enable-precise-memory-info",
        "--enable-benchmarking",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
      ],
    });
  }
  let page: Page;
  if (watch && !headless && lastPage) {
    page = lastPage;
  } else {
    page = await browser.newPage({ bypassCSP: true });
    if (!headless && watch) {
      lastPage = page;
    }
  }

  await page.clock.install();

  // Ensure we only instrument a page once to avoid duplicate console logs
  const g = globalThis as typeof globalThis & {
    __instrumentedPages?: WeakSet<Page>;
  };
  if (!g.__instrumentedPages) {
    g.__instrumentedPages = new WeakSet<Page>();
  }
  const instrumentedPages = g.__instrumentedPages;

  if (!instrumentedPages.has(page)) {
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
      if (type === "clear") {
        console.clear();
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

    instrumentedPages.add(page);
  }

  if (!doneExposed.has(page)) {
    await page.exposeFunction("__done", async (isFailing: boolean) => {
      if (headless) {
        // Allow pending console events to flush before closing
        await new Promise((r) => setTimeout(r, 75));
        try {
          await browser.close();
        } catch { /* noop */ }
        if (!watch) {
          Deno.exit(isFailing ? 1 : 0);
        }
      } else if (!watch) {
        // Headed single-run: leave browser open for inspection
      } else {
        // Headed watch mode: page is reloaded & reused between runs
      }
    });
    doneExposed.add(page);
  }

  await page.setContent(html, { waitUntil: "load" });
}
