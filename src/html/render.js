import { Component } from '../component';
import { Listener } from '../store';
import { flatten } from '../utils';
import { mount } from '../mount';
import { setProps } from '../html';

/**
 * @param {HTMLElement|HTMLElement[]} node
 * @param {HTMLElement} $parent
 * @returns {HTMLElement|HTMLElement[]}
 */
export function render(node, $parent) {
  if (Array.isArray(node)) {
    const output = node.map(render);

    // Always must render some element
    // In case of empty array we simulate empty element as null
    if (output.length === 0) return render([null], $parent);

    return output;
  }

  if (node && typeof node.type === 'function') {
    const compNode = new Component(node.type, node.props, node.children);
    const renderedComponent = compNode.render(node.props, node.children, $parent);

    let $styleRef;

    if (renderedComponent && typeof renderedComponent.addEventListener === 'function') {
      renderedComponent.addEventListener('mount', () => {
        if (typeof compNode.style === 'string') {
          $styleRef = document.createElement('style');
          $styleRef.innerHTML = compNode.style;
          document.head.appendChild($styleRef);
        }
        compNode.trigger('mount', renderedComponent);
      }, {
        passive: true,
        once: true,
      }, false);

      renderedComponent.addEventListener('destroy', () => {
        compNode.trigger('destroy', renderedComponent);
        if ($styleRef instanceof Node) {
          document.head.removeChild($styleRef);
        }
      }, {
        passive: true,
        once: true,
      }, false);
    }

    if (renderedComponent instanceof Node) {
      renderedComponent.__radiRef = (data, ii) => {
        if (ii && Array.isArray(compNode.dom)) {
          return compNode.dom[ii] = data;
        }
        return compNode.dom = data;
      };
    }

    return renderedComponent;
  }

  if (node instanceof Node) {
    return node;
  }

  if (node instanceof Listener) {
    return node.render();
  }

  if (node instanceof Promise) {
    return render({ type: 'await', props: {src: node}, children: [] }, $parent);
  }

  if (typeof node === 'function') {
    return render(node(), $parent);
  }

  // if the node is text, return text node
  if (['string', 'number'].indexOf(typeof node) > -1) { return document.createTextNode(node); }

  // We still have to render nodes that are hidden, to preserve
  // node tree and ref to components
  if (!node) {
    return document.createComment('');
  }

  // create element
  let element;
  if (node.type === 'svg' || $parent instanceof SVGElement) {
    element = document.createElementNS(
      'http://www.w3.org/2000/svg',
      node.type
    );
  } else {
    element = document.createElement(node.type);
  }
  // const element = document.createElement(node.type);

  // set attributes
  setProps(element, node.props);

  // build and append children
  if (node.children) {
    flatten(node.children || []).forEach(child => {
      const childNode = child instanceof Node ? child : render(child, element);
      mount(childNode, element);
    });
  }

  return element;
}
