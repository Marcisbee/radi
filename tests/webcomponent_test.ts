/// <reference lib="deno.unstable" />
import { chromium } from 'npm:playwright@1.64.1';

for (
  const entrypoint of [
    'webcomponent-browser',
    'webcomponent-frameworks-browser',
  ]
) {
  Deno.test(entrypoint, async () => {
    const bundle = await Deno.bundle({
      entrypoints: [`tests/${entrypoint}.ts`],
      platform: 'browser',
      write: false,
    });
    if (!bundle.success) throw new Error(JSON.stringify(bundle.errors));
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      if (entrypoint === 'webcomponent-browser') await page.clock.install();
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
        console.error(error.stack);
      });
      page.on('console', (message) => console.log(message.text()));
      await page.setContent('<body></body>');
      await page.addScriptTag({
        content: bundle.outputFiles![0].text(),
        type: 'module',
      });
      await page.waitForFunction(
        () => 'webcomponentTestResult' in globalThis,
        null,
        { timeout: 5000 },
      );
      const result = await page.evaluate<{ failed: number; total: number }>(
        'globalThis.webcomponentTestResult',
      );
      if (result.failed || !result.total || errors.length) {
        throw new Error(JSON.stringify({ result, errors }));
      }
    } finally {
      await browser.close();
    }
  });
}
