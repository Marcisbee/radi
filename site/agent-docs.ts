// @deno-types="npm:@types/turndown@5.0.5"
import TurndownService from 'npm:turndown@7.2.0';
import { join } from 'node:path';

export async function writeAgentDocs(outDir: string, html: string) {
  const converter = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  converter.remove(['button', 'footer', 'script', 'figcaption']);
  converter.addRule('decorations', {
    filter: (node) =>
      node.getAttribute('aria-hidden') === 'true' || node.className === 'demo',
    replacement: () => '',
  });
  converter.addRule('absoluteLinks', {
    filter: 'a',
    replacement: (content, node) => {
      const anchor = node as HTMLElement;
      if (anchor.className === 'heading-link') return content;
      const href =
        new URL(anchor.getAttribute('href')!, 'https://radi.js.org/').href;
      return `[${content}](${href}) `;
    },
  });
  converter.addRule('codeExamples', {
    filter: 'pre',
    replacement: (_content, node) =>
      `\n\n\`\`\`${
        node.firstElementChild?.getAttribute('data-language') ?? ''
      }\n${node.textContent}\n\`\`\`\n\n`,
  });
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  if (!main) throw new Error('The generated guide has no main content');
  await Deno.writeTextFile(
    join(outDir, 'index.md'),
    converter.turndown(main) + '\n',
  );
  await Deno.mkdir(join(outDir, 'docs'), { recursive: true });
  for (
    const name of [
      'server-rendering',
      'go-server',
      'resumption',
      'static-sites',
    ]
  ) {
    await Deno.copyFile(
      new URL(`../docs/${name}.md`, import.meta.url),
      join(outDir, `docs/${name}.md`),
    );
  }
  await Deno.copyFile(
    new URL('./llms.txt', import.meta.url),
    join(outDir, 'llms.txt'),
  );
}
