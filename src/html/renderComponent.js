import { Component, componentStore } from '../component';

import { patch } from './patch';
import { render } from './render';

function evaluate(comp, fn) {
  const temp = componentStore.currentComponent;
  componentStore.currentComponent = comp;
  const evaluated = fn();
  componentStore.currentComponent = temp;
  return evaluated;
}

export function renderComponent(vdom, parent) {
  const props = Object.assign({}, vdom.props, { children: vdom.children });

  const lifecycles = new Component(vdom.type);

  lifecycles.update = () => patchComponent(lifecycles.dom, vdom, parent);
  lifecycles.render = (instance = lifecycles) => (
    evaluate(instance, () => vdom.type.call(lifecycles, props))
  );
  lifecycles.dom = render(
    lifecycles.render(),
    parent
  );

  let $styleRef;

  if (lifecycles.dom && typeof lifecycles.dom.addEventListener === 'function') {
    lifecycles.on('mount', () => {
      if (typeof lifecycles.style === 'string') {
        $styleRef = document.createElement('style');
        $styleRef.innerHTML = lifecycles.style;
        document.head.appendChild($styleRef);
      }
    }, {
      passive: true,
      once: true,
    }, false);

    lifecycles.on('destroy', () => {
      if ($styleRef instanceof Node) {
        document.head.removeChild($styleRef);
      }
    }, {
      passive: true,
      once: true,
    }, false);
  }

  lifecycles.dom.__radiInstance = lifecycles;
  lifecycles.trigger('mount', lifecycles.dom, parent);
  return lifecycles.dom;
}

export function patchComponent(dom, vdom, parent = dom.parentNode) {
  const props = Object.assign({}, vdom.props, { children: vdom.children });
  const instance = dom.__radiInstance;
  if (instance && instance.self === vdom.type) {
    return patch(dom, instance.render(), parent);
  } else if (instance.isPrototypeOf(vdom.type)) {
    const ndom = renderComponent(vdom, parent);
    return parent ? (parent.replaceChild(ndom, dom) && ndom) : (ndom);
  } else if (!instance.isPrototypeOf(vdom.type)) {
    return patch(dom, vdom.type(props), parent);
  }
  return null;
}
