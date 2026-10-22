import { createElement as h } from '../src/server.ts';
import { codeToTokens } from 'npm:shiki@3.13.0';

export async function code(
  label: string,
  source: string,
  lang: 'tsx' | 'json' | 'bash' = 'tsx',
) {
  const { tokens } = await codeToTokens(source, {
    lang,
    theme: 'github-light',
  });
  const lines = tokens.map((line) =>
    line.map((token) =>
      h('span', { style: `color:${token.color}` }, token.content)
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
        null,
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
  ['Rendering', [['server', 'Server rendering'], ['static', 'Static sites'], [
    'islands',
    'Interactive islands',
  ]]],
  ['Reference', [['reference', 'Client API']]],
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

export function header() {
  return h(
    'header',
    { class: 'site-header' },
    h(
      'div',
      { class: 'header-inner' },
      h(
        'a',
        { class: 'brand', href: '/', 'aria-label': 'Radi home' },
        'radi',
        h('span', { 'aria-hidden': 'true' }, '.'),
      ),
      h('span', { class: 'header-divider', 'aria-hidden': 'true' }),
      h('span', { class: 'header-label' }, 'Documentation'),
      h(
        'a',
        { class: 'github', href: 'https://github.com/Marcisbee/radi' },
        'GitHub ↗',
      ),
    ),
  );
}
