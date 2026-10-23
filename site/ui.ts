import { createElement as h } from '../src/server.ts';
import { codeToTokens } from 'npm:shiki@3.13.0';

export async function code(
  label: string,
  source: string,
  lang: 'tsx' | 'json' | 'bash' | 'html' | 'go' = 'tsx',
) {
  const { tokens } = await codeToTokens(source, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
  });
  const lines = tokens.map((line) =>
    line.map((token) =>
      h('span', {
        style: `--code-light:${token.htmlStyle?.color};--code-dark:${
          token.htmlStyle?.['--shiki-dark']
        }`,
      }, token.content)
    )
  );
  return h(
    'figure',
    { class: 'code' },
    h(
      'figcaption',
      null,
      h('span', null, label),
      h('button', {
        class: 'copy',
        type: 'button',
        'data-copy': '',
        hidden: true,
        'aria-label': `Copy ${label}`,
        'aria-live': 'polite',
      }, 'Copy'),
    ),
    h(
      'pre',
      { tabindex: '0', 'aria-label': label },
      h(
        'code',
        { 'data-language': lang },
        lines.flatMap((line, index) => index ? ['\n', ...line] : line),
      ),
    ),
  );
}

export function section(
  id: string,
  title: string,
  ...content: Parameters<typeof h>[2][]
) {
  return h(
    'section',
    { id },
    h(
      'h2',
      null,
      h(
        'a',
        { href: `#${id}`, class: 'heading-link' },
        title,
        h('span', { 'aria-hidden': 'true', class: 'anchor-mark' }, '#'),
      ),
    ),
    ...content,
  );
}

const groups = [
  ['Getting started', [['overview', 'Introduction'], [
    'start',
    'Installation',
  ]]],
  ['Essentials', [['components', 'Components'], ['reactivity', 'Reactivity'], [
    'lifecycle',
    'Lifecycle',
  ]]],
  ['Building apps', [
    ['lists', 'Lists and local state'],
    ['forms', 'Forms and shared state'],
    ['async', 'Async work and cleanup'],
    ['performance', 'Keep updates small'],
  ]],
  ['Rendering', [
    ['routing', 'Client routing'],
    ['server', 'Server rendering'],
    ['go-server', 'Go + embedded V8'],
    ['static', 'Static sites'],
    [
      'islands',
      'Interactive islands',
    ],
  ]],
  ['Reference', [
    ['router-api', 'radi/router'],
    ['go-api', 'radi/go'],
    ['reference', 'radi / radi/client'],
    ['server-api', 'radi/server'],
    ['resume-api', 'radi/resume'],
    ['static-api', 'radi/static'],
    ['state-api', 'radi/signal'],
    ['state-api-createChannel', 'radi/channel'],
    ['renderer-api', 'radi/renderer'],
    ['jsx-api', 'radi/jsx-runtime'],
    ['jsx-api-shared-types', 'radi/types'],
    ['jsx-api-symbols', 'radi/symbols'],
  ]],
] as const;

export function navigation(label: string) {
  return h(
    'nav',
    { 'aria-label': label },
    groups.map(([name, entries]) =>
      h(
        'div',
        { class: 'nav-group' },
        h('p', null, name),
        entries.map(([id, title]) =>
          h('a', {
            href: `#${id}`,
            'data-section-link': '',
            ...(id === 'overview' ? { 'aria-current': 'location' } : {}),
          }, title)
        ),
      )
    ),
  );
}

export function sidebarBrand() {
  return h(
    'div',
    { class: 'sidebar-brand' },
    h(
      'a',
      { class: 'brand', href: '/', 'aria-label': 'Radi home' },
      h('img', { src: '/radi-logo.png', width: 32, height: 32, alt: '' }),
      'Radi',
    ),
  );
}

export function githubLink() {
  return h(
    'a',
    { class: 'github', href: 'https://github.com/Marcisbee/radi' },
    'GitHub ↗',
  );
}
