
// const fuseAttrs = (newNode, oldNode) => {
//   let newAttrs = [ ...newNode.attributes ];
//   let oldAttrs = [ ...oldNode.attributes ];
//   let max = Math.max(a1.length, a2.length);

//   for (var i = 0; i < max; i++) {
//     let attr = newAttrs[i] || oldAttrs[i]
//     name = attr.name

//     if (attr oldNode.hasAttribute())
//     if (a1[i] && a2[i]) {
//       if (a1[i].isEqualNode(a2[i])) continue;
//       // Replace
//       fuse(a1[i], a2[i])
//     } else
//     if (a1[i] && !a2[i]) {
//       // Remove
//       a1[i].remove()
//     } else
//     if (!a1[i] && a2[i]) {
//       // Add
//       a1[i].appendChild(a2[i])
//     }
//   }

//   Array.from(oldNode.attributes).forEach(attr => {
//     if (newNode[attributes].name)
//     if (attr.name === 'style') {
//       return;
//     }
//     newNode[attributes].name
//     el.removeAttributeNode(attr);
//   });
// }

function copyAttrs (newNode, oldNode) {
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


/**
 * @param {HTMLElement} newNode
 * @param {HTMLElement} oldNode
 * @returns {ElementListener}
 */
const fuseDom = (newNode, oldNode) => {
  const nt1 = newNode.nodeType;
  const nt2 = oldNode.nodeType;

  if (nt1 === nt2 && (nt1 === 3 || nt2 === 8)) {
    if (!newNode.isEqualNode(oldNode)) {
      newNode.nodeValue = oldNode.nodeValue;
    }
    return newNode;
  }

  if (nt1 === 3 || nt2 === 3) {
    newNode.replaceWith(oldNode);
    return newNode;
  }

  copyAttrs(oldNode, newNode);
  // fuseAttrs(newNode, oldNode);

  let a1 = [ ...newNode.childNodes ];
  let a2 = [ ...oldNode.childNodes ];
  let max = Math.max(a1.length, a2.length);

  for (var i = 0; i < max; i++) {
    if (a1[i] && a2[i]) {
      if (a1[i].isEqualNode(a2[i])) continue;
      // Replace
      // fuse(a1[i], a2[i]);
      a1[i].replaceWith(a2[i])
    } else
    if (a1[i] && !a2[i]) {
      // Remove
      a1[i].remove();
    } else
    if (!a1[i] && a2[i]) {
      // Add
      newNode.appendChild(a2[i]);
    }
  }

  return newNode;
}
