import { flatten } from '../utils';
import TYPE from '../consts/types';
import { renderComponent } from './renderComponent';
import GLOBALS from '../consts/GLOBALS';

export function isNode(value) {
  return value && typeof value === 'object'
    && typeof value.query !== 'undefined'
    && typeof value.props !== 'undefined'
    && typeof value.children !== 'undefined';
}

function updater(comp) {
  return (...args) => {
    const tempComponent = GLOBALS.CURRENT_COMPONENT;
    GLOBALS.CURRENT_COMPONENT = comp;
    const output = renderComponent.call(comp, ...args);

    GLOBALS.CURRENT_COMPONENT = tempComponent;
    return output
  }
}

export function evaluate(node) {
  if (Array.isArray(node)) {
    return flatten(node).map(evaluate);
  }

  if (typeof node === 'function') {
    return evaluate(node());
  }

  if (node instanceof Promise || (node && node.constructor.name === 'LazyPromise')) {
    return evaluate({
      query: 'await',
      props: {
        src: node,
      },
      children: [],
    });
  }

  if (node && typeof node.type === 'number') return node;
  if (isNode(node)) {

    if (typeof node.query === 'function') {
      const comp = {
        ...node,
        type: TYPE.COMPONENT,
        pointer: null,
        dom: null,
      };
      comp.update = updater(comp);
      return comp;
    }

    if (typeof GLOBALS.CUSTOM_TAGS[node.query] !== 'undefined') {
      const comp = {
        ...node,
        query: GLOBALS.CUSTOM_TAGS[node.query].render,
        type: TYPE.COMPONENT,
        pointer: null,
        dom: null,
      };
      comp.update = updater(comp);
      return comp;
    }

    return {
      ...node,
      type: TYPE.NODE,
      children: evaluate(flatten(node.children)),
    }
  }

  if (!node && typeof node !== 'string' && typeof node !== 'number') {
    return {
      // query: node,
      query: '',
      type: TYPE.TEXT,
    }
  }

  return {
    query: node.toString(),
    type: TYPE.TEXT,
  }
}
