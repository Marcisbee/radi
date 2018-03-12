import listenerToNode from './listenerToNode';

/**
 * @param {Listener} listener
 * @param {HTMLElement} element
 */
const appendListenerToElement = (listener, element) => {
  let asNode = listenerToNode(listener.value);

  for (const node of asNode) {
    element.appendChild(node);
  }

  listener.onValueChange((value) => {
    const newNode = listenerToNode(value);

    for (const node of newNode) {
      // If asNode[0] is undefined we're dealing with a fragment so we can
      // just append
      if (!asNode[0]) {
        element.appendChild(node);
        continue;
      }
      element.insertBefore(node, asNode[0]);
    }

    for (const node of asNode) node.remove();

    asNode = newNode;

    // Trigger attached listeners manually
    if (typeof element.forceUpdate === 'function') {
      element.forceUpdate();
    }
  });
};

export default appendListenerToElement;
