
const onMountEvent = document.createEvent('Event');
onMountEvent.initEvent('mount', true, true);

const onLoadEvent = document.createEvent('Event');
onLoadEvent.initEvent('load', true, true);

/**
 * Append dom node to dom tree (after - (true) should append after 'to' element
 * or (false) inside it)
 * @param {HTMLElement} node
 * @param {HTMLElement} to
 * @param {Boolean} after
 * @returns {HTMLElement}
 */
const append = (node, to, after) => {
  if (typeof node.dispatchEvent === 'function') {
    node.dispatchEvent(onLoadEvent);
  }

  if (after && to) {
    if (to.parentNode) {
      to.parentNode.insertBefore(node, to);
      if (typeof node.dispatchEvent === 'function') {
        node.dispatchEvent(onMountEvent);
      }
      // if (!to.nextSibling) {
      //   to.parentNode.appendChild(node);
      // } else {
      //   to.parentNode.insertBefore(node, to.nextSibling || to);
      // }
    }
    return node;
  }

  to.appendChild(node);

  if (typeof node.dispatchEvent === 'function') {
    node.dispatchEvent(onMountEvent);
  }

  return node;
};

export default append;
