// @ts-nocheck
import { assert, test } from '@marcisbee/rion';
import {
  renderToStringRoot,
  createElement as h,
  Fragment,
} from '../../server.ts';

/**
 * SSR escaping & special character tests for Radi (rion test runner).
 *
 * Validates:
 *  - Attribute values are properly escaped (& < > ")
 *  - Text node content is escaped
 *  - Nested components & fragments escape inner text
 *  - Pre-escaped strings (idempotent behavior captured)
 *  - Non-string attribute serialization (number/boolean/null/object)
 *  - Function-valued props are omitted
 *  - Comment node markers for boolean/null primitives
 */

/* -------------------------------------------------------------------------- */
/* Local assertion helpers                                                     */
/* -------------------------------------------------------------------------- */

function includes(html: string, fragment: string) {
  assert.equal(
    html.includes(fragment),
    true,
    `Expected HTML to include fragment:\n${fragment}\n---\nHTML:\n${html}`,
  );
}

function notIncludes(html: string, fragment: string) {
  assert.equal(
    html.includes(fragment),
    false,
    `Did not expect HTML to include fragment:\n${fragment}\n---\nHTML:\n${html}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function Echo(props: any) {
  return h('span', null, props().value);
}

function Wrapper(props: any) {
  return h(
    'div',
    { title: props().raw },
    h(Echo, { value: props().raw }),
    h(Fragment, null, props().raw, ' / ', h('b', null, props().raw)),
  );
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

test('ssr: attribute escaping of <, >, &, "', () => {
  const raw = '<div class="x&y"> & " > <';
  const html = renderToStringRoot(
    h('p', { 'data-raw': raw, title: raw }, 'content'),
  );
  // Appears twice: data-raw and title
  const escapedAttr = '&lt;div class=&quot;x&amp;y&quot;&gt; &amp; &quot; &gt; &lt;';
  includes(html, `data-raw="${escapedAttr}"`);
  includes(html, `title="${escapedAttr}"`);
  includes(html, '<p ');
  includes(html, '>content</p>');
});

test('ssr: text content escaping retains structure', () => {
  const raw = 'A&B <tag "quote">';
  const html = renderToStringRoot(
    h('section', null,
      raw,
      h('em', null, raw),
    ),
  );
  const escaped = 'A&amp;B &lt;tag &quot;quote&quot;&gt;';
  includes(html, escaped);
  includes(html, `<em>${escaped}</em>`);
});

test('ssr: nested component & fragment escaping', () => {
  const raw = '<&"nested">';
  const html = renderToStringRoot(
    h(Wrapper, { raw }),
  );
  const escaped = '&lt;&amp;&quot;nested&quot;&gt;';
  // Component + fragment wrappers
  includes(html, '<radi-component>');
  includes(html, '<radi-fragment>');
  // Escaped attribute
  includes(html, `title="${escaped}"`);
  // Echo span
  includes(html, `<span>${escaped}</span>`);
  // Fragment inner <b>
  includes(html, `<b>${escaped}</b>`);
});

test('ssr: idempotent escaping (pre-escaped string double-escapes)', () => {
  const alreadyEscaped = '&lt;safe&gt;&amp;';
  const html = renderToStringRoot(
    h('div', { title: alreadyEscaped }, alreadyEscaped),
  );
  // Current serializer re-escapes ampersands
  includes(html, 'title="&amp;lt;safe&amp;gt;&amp;amp;"');
  includes(html, '>&amp;lt;safe&amp;gt;&amp;amp;</div>');
});

test('ssr: non-string attribute serialization & function omission', () => {
  const html = renderToStringRoot(
    h('div', {
      num: 123,
      boolTrue: true,
      boolFalse: false,
      nil: null,
      obj: { a: 1 },    // becomes [object Object]
      fn: () => 'ignored', // should not serialize
    }, 'x'),
  );
  includes(html, 'num="123"');
  includes(html, 'boolTrue="true"');
  includes(html, 'boolFalse="false"');
  includes(html, 'nil="null"');
  includes(html, 'obj="[object Object]"');
  notIncludes(html, 'fn=');
});

test('ssr: comment nodes for boolean/null primitives', () => {
  const html = renderToStringRoot(
    h('div', null, true, false, null),
  );
  includes(html, '<!--true-->');
  includes(html, '<!--false-->');
  includes(html, '<!--null-->');
});

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

await test.run();