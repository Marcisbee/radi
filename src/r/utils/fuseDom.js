
const copyAttrs = (newNode, oldNode) => {
  var oldAttrs = oldNode.attributes;
  var newAttrs = newNode.attributes;
  var attrNamespaceURI = null;
  var attrValue = null;
  var fromValue = null;
  var attrName = null;
  var attr = null;

  for (var i = newAttrs.length - 1; i >= 0; --i) {
    attr = newAttrs[i];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    attrValue = attr.value;
    // TODO: Change only specific parts of style
    // if (attr.name === 'style') {
    //   for (var item of newNode.style) {
    //     if (oldNode.style[item] !== newNode.style[item]) oldNode.style[item] = newNode.style[item]
    //   }
    //   continue;
    // }
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      fromValue = oldNode.getAttributeNS(attrNamespaceURI, attrName);
      if (fromValue !== attrValue) {
        oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
      }
    } else {
      if (!oldNode.hasAttribute(attrName)) {
        oldNode.setAttribute(attrName, attrValue);
      } else {
        fromValue = oldNode.getAttribute(attrName);
        if (fromValue !== attrValue) {
          // apparently values are always cast to strings, ah well
          if (attrValue === 'null' || attrValue === 'undefined') {
            oldNode.removeAttribute(attrName);
          } else {
            oldNode.setAttribute(attrName, attrValue);
          }
        }
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  for (var j = oldAttrs.length - 1; j >= 0; --j) {
    attr = oldAttrs[j];
    if (attr.specified !== false) {
      attrName = attr.name;
      attrNamespaceURI = attr.namespaceURI;

      if (attrNamespaceURI) {
        attrName = attr.localName || attrName;
        if (!newNode.hasAttributeNS(attrNamespaceURI, attrName)) {
          oldNode.removeAttributeNS(attrNamespaceURI, attrName);
        }
      } else {
        if (!newNode.hasAttributeNS(null, attrName)) {
          oldNode.removeAttribute(attrName);
        }
      }
    }
  }
}

const destroy = node => {
  if (!(node instanceof Node)) return;
  let treeWalker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_ALL,
    el => true,
    false
  );

  let el;
  while((el = treeWalker.nextNode())) {
    if (el.listeners) {
      for (var i = 0; i < el.listeners.length; i++) {
        el.listeners[i].deattach();
      }
    }
    el.listeners = null;
    if (el.attributeListeners) {
      for (var i = 0; i < el.styleListeners.length; i++) {
        el.styleListeners[i].deattach();
      }
    }
    el.attributeListeners = null;
    if (el.styleListeners) {
      for (var i = 0; i < el.styleListeners.length; i++) {
        el.styleListeners[i].deattach();
      }
    }
    el.styleListeners = null;
    if (el.destroy) el.destroy();
    el.remove();
  }
  if (node.listeners) {
    for (var i = 0; i < node.listeners.length; i++) {
      node.listeners[i].deattach();
    }
  }
  node.listeners = null;
  if (node.attributeListeners) {
    for (var i = 0; i < node.styleListeners.length; i++) {
      node.styleListeners[i].deattach();
    }
  }
  node.attributeListeners = null;
  if (node.styleListeners) {
    for (var i = 0; i < node.styleListeners.length; i++) {
      node.styleListeners[i].deattach();
    }
  }
  node.remove();
}

/**
 * @param {HTMLElement} newNode
 * @param {HTMLElement} oldNode
 * @returns {ElementListener}
 */
const fuse = (toNode, fromNode, childOnly) => {
  if (Array.isArray(fromNode) || Array.isArray(toNode)) childOnly = true;

  if (!childOnly) {
    const nt1 = toNode.nodeType;
    const nt2 = fromNode.nodeType;

    if (nt1 === nt2 && (nt1 === 3 || nt2 === 8)) {
      if (!toNode.isEqualNode(fromNode)) {
        toNode.nodeValue = fromNode.nodeValue;
        destroy(fromNode);
      }
      return toNode;
    }

    if (fromNode.destroy || toNode.destroy || fromNode.__async || fromNode.__async
      || toNode.listeners || fromNode.listeners
      || nt1 === 3 || nt2 === 3) {
      if (!toNode.isEqualNode(fromNode)) {
        toNode.parentNode.insertBefore(fromNode, toNode);
        destroy(toNode);
      }
      return fromNode;
    }

    copyAttrs(fromNode, toNode);
  }

  let a1 = [ ...toNode.childNodes || toNode ];
  let a2 = [ ...fromNode.childNodes || fromNode ];
  let max = Math.max(a1.length, a2.length);

  for (var i = 0; i < max; i++) {
    if (a1[i] && a2[i]) {
      // Fuse
      fuse(a1[i], a2[i]);
    } else
    if (a1[i] && !a2[i]) {
      // Remove
      destroy(a1[i]);
    } else
    if (!a1[i] && a2[i]) {
      // Add
      toNode.appendChild(a2[i]);
    }
  }

  destroy(fromNode);
  return toNode;
}

class FuseDom {
  fuse(...args) {
    return fuse(...args);
  }
  destroy(...args) {
    return destroy(...args);
  }
}

export default new FuseDom();
