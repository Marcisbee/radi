import { destroyTree } from './destroyTree';
import { fireEvent } from './fireEvent';
import { patchComponent } from './renderComponent';
import { render } from './render';
import { setAttribute } from './setAttribute';

function beforeDestroy(node, next) {
  if (typeof node.beforedestroy === 'function') {
    return node.beforedestroy(next);
  }

  return next();
}

export function patch(dom, vdom, parent = dom.parentNode) {
  const replace = parent ? el => (parent.replaceChild(el, dom) && el) : (el => el);
  if (typeof vdom === 'object' && typeof vdom.type === 'function') {
    return patchComponent(dom, vdom, parent);
  } else if (typeof vdom !== 'object' && dom instanceof Text) {
    return dom.textContent !== vdom ? replace(render(vdom, parent)) : dom;
  } else if (typeof vdom === 'object' && dom instanceof Text) {
    return replace(render(vdom, parent));
  } else if (typeof vdom === 'object' && dom.nodeName !== vdom.type.toUpperCase()) {
    return replace(render(vdom, parent));
  } else if (typeof vdom === 'object' && dom.nodeName === vdom.type.toUpperCase()) {
    const pool = {};
    const active = document.activeElement;
    [].concat(...dom.childNodes).filter(n => !n.__radiRemoved).forEach((child, index) => {
      const key = child.__radiKey || `__index_${index}`;
      pool[key] = child;
    });
    [].concat(...vdom.children).forEach((child, index) => {
      const key = child.props && (child.props.key || `__index_${index}`);
      if (pool[key]) {
        fireEvent('update', patch(pool[key], child));
        delete pool[key];
      } else {
        const temp = pool[key] ? patch(pool[key], child) : render(child, dom);
        if (temp) {
          dom.appendChild(temp);
          delete pool[key];
        }
      }
    });
    for (const key in pool) {
      pool[key].__radiRemoved = true;
      beforeDestroy(pool[key], () => {
        // This is for async node removals
        destroyTree(pool[key]);
        pool[key].remove();
      });
    }
    for (const attr of dom.attributes) dom.removeAttribute(attr.name);
    for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);
    active.focus();
    return dom;
  }
  return null;
}
