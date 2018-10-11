import {
  fireEvent,
  insertAfter,
  setProps,
} from './index';

import { Component } from '../component';
import { mount } from '../mount';

/**
 * @param  {Object} node
 * @param  {HTMLElement} $parent
 * @return {HTMLElement|null}
 */
export function createElement(node, $parent) {
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(node);
  }

  if (node === undefined || node === false || node === null) {
    return document.createComment('');
  }

  if (Array.isArray(node)) {
    const $pointer = document.createTextNode('');

    $pointer.addEventListener('mount', () => {
      for (let i = 0; i < node.length; i++) {
        mount(node[i], $parent);
      }
    });

    return $pointer;
  }

  if (typeof node === 'function' || typeof node.type === 'function') {
    const fn = node.type || node;

    const lifecycles = new Component(fn);

    const $element = createElement(
      fn.call(lifecycles, {
        ...(node.props || {}),
        children: node.children || [],
      }),
      $parent
    );

    let $styleRef;

    if ($element && typeof $element.addEventListener === 'function') {
      $element.addEventListener('mount', () => {
        if (typeof lifecycles.style === 'string') {
          $styleRef = document.createElement('style');
          $styleRef.innerHTML = lifecycles.style;
          document.head.appendChild($styleRef);
        }
        lifecycles.trigger('mount', $element, $parent);
      }, {
        passive: true,
        once: true,
      }, false);

      $element.addEventListener('destroy', () => {
        lifecycles.trigger('destroy', $element, $parent);
        if ($styleRef instanceof Node) {
          document.head.removeChild($styleRef);
        }
      }, {
        passive: true,
        once: true,
      }, false);
    }

    return $element;
  }

  if (typeof node === 'object') {
    if (node.type) {
      let $el;
      if (node.type === 'svg' || $parent instanceof SVGElement) {
        $el = document.createElementNS(
          'http://www.w3.org/2000/svg',
          node.type
        );
      } else {
        $el = document.createElement(node.type);
      }
      const $lastEl = null;
      setProps($el, node.props);
      const applyChildren = $child => n => {
        const $n = createElement(n, $child);
        if ($n) {
          if ($lastEl) {
            insertAfter($n, $lastEl, $child);
          } else {
            $child.appendChild.call($el, $n);
            fireEvent('mount', $n);
          }
        }
      };
      node.children.map(applyChildren($el));
      return $el;
    }
    return createElement(JSON.stringify(node), $parent);
  }

  // console.error('Unhandled node', node);
  return document.createTextNode(`${node}`);
}
