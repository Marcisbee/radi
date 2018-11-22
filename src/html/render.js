// TODO: use Component class
import { Component } from '../component';
import GLOBALS from '../consts/GLOBALS';
import TYPE from '../consts/types';
import { mount } from '../mount';
import { setProps } from '../html';

export function render(node, parent) {
  if (Array.isArray(node)) {
    return node.map((item) => render(item, parent));
  }

  if (node.type === TYPE.TEXT) {
    return document.createTextNode(node.query);
  }

  if (node.type === TYPE.NODE) {
    let element;
    if (node.query === 'svg' || parent instanceof SVGElement) {
      element = document.createElementNS(
        'http://www.w3.org/2000/svg',
        node.query
      );
    } else {
      element = document.createElement(node.query);
    }

    mount(node.children, element);

    // set attributes
    setProps(element, node.props);

    return element;
  }

  if (node.type === TYPE.COMPONENT) {
    if (!node.pointer) {
      node.pointer = document.createTextNode('');
      node.pointer.__radiPoint = node;
    }

    node.source = new Component(node);

    let $styleRef;

    node.pointer.addEventListener('mount', (e) => {
      node.update();
      if (typeof node.source.style === 'string') {
        $styleRef = document.createElement('style');
        $styleRef.innerHTML = node.source.style;
        document.head.appendChild($styleRef);
      }
      node.source.trigger('mount', e);
      node.mounted = true;
    }, {
      passive: true,
      once: true,
    }, false);

    node.pointer.addEventListener('destroy', (e) => {
      node.source.trigger('destroy', e);
      if ($styleRef instanceof Node) {
        document.head.removeChild($styleRef);
      }
      node.mounted = false;
    }, {
      passive: true,
      once: true,
    }, false);

    return node.pointer;
  }

  return document.createTextNode(node.toString());
}
