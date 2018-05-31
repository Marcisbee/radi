
function getElementAttributes(el) {
	return el.attributes;
}

function fuseAttributes(el, toEl, elAttributes) {
	let toElAttributes = toEl.attributes;

	for (let i = 0, l = toElAttributes.length; i < l; i++) {
		let toElAttr = toElAttributes.item(i);
		let toElAttrNamespaceURI = toElAttr.namespaceURI;
		let elAttr = toElAttrNamespaceURI ?
			elAttributes.getNamedItemNS(toElAttrNamespaceURI, toElAttr.name) :
			elAttributes.getNamedItem(toElAttr.name);

		if (elAttr && elAttr.name === 'style') {
			for (let style of toEl.style) {
				if (el.style[style] !== toEl.style[style]) {
					el.style[style] = toEl.style[style];
				}
			}
			continue;
		}

		if (!elAttr || elAttr.value != toElAttr.value) {
			if (toElAttrNamespaceURI) {
				el.setAttributeNS(toElAttrNamespaceURI, toElAttr.name, toElAttr.value);
			} else {
				el.setAttribute(toElAttr.name, toElAttr.value);
			}
		}
	}

	for (let i = elAttributes.length; i;) {
		let elAttr = elAttributes.item(--i);
		let elAttrNamespaceURI = elAttr.namespaceURI;

		if (elAttrNamespaceURI) {
			if (!toElAttributes.getNamedItemNS(elAttrNamespaceURI, elAttr.name)) {
				el.removeAttributeNS(elAttrNamespaceURI, elAttr.name);
			}
		} else {
			if (!toElAttributes.getNamedItem(elAttr.name)) {
				el.removeAttribute(elAttr.name);
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
	let bulk = [];
	while((el = treeWalker.nextNode())) {
		if (el.listeners) {
			for (var i = 0; i < el.listeners.length; i++) {
				el.listeners[i].deattach();
			}
		}
		el.listeners = null;
		if (el.attributeListeners) {
			for (var i = 0; i < el.attributeListeners.length; i++) {
				el.attributeListeners[i].deattach();
			}
		}
		el.attributeListeners = null;
		if (el.styleListeners) {
			for (var i = 0; i < el.styleListeners.length; i++) {
				el.styleListeners[i].deattach();
			}
		}
		el.styleListeners = null;
		bulk.push((el => {
			if (el && el.destroy) el.destroy();
			if (el && el.parentNode) {
				el.parentNode.removeChild(el);
			}
		}).bind(null, el))
	}
	if (node.listeners) {
		for (var i = 0; i < node.listeners.length; i++) {
			node.listeners[i].deattach();
		}
	}
	node.listeners = null;
	if (node.attributeListeners) {
		for (var i = 0; i < node.attributeListeners.length; i++) {
			node.attributeListeners[i].deattach();
		}
	}
	node.attributeListeners = null;
	if (node.styleListeners) {
		for (var i = 0; i < node.styleListeners.length; i++) {
			node.styleListeners[i].deattach();
		}
	}
	node.styleListeners = null;

	node.styleListeners = null;
	if (node.destroy) node.destroy();
	if (node.parentNode) {
		node.parentNode.removeChild(node);
		// node.remove()
	}

	// Removes all dom elements
	for (var i = 0; i < bulk.length; i++) {
		bulk[i]();
	}
	bulk = null;
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

		if (toNode.isPointer || fromNode.isPointer || toNode.destroy || fromNode.destroy) {
			toNode.parentNode.insertBefore(fromNode, toNode);
			destroy(toNode);
			return fromNode;
		}

		if (nt1 === nt2 && (nt1 === 3 || nt2 === 8)) {
			if (toNode.nodeValue !== fromNode.nodeValue) {
				toNode.nodeValue = fromNode.nodeValue;
				destroy(fromNode);
			}
			return toNode;
		}

		// if (nt1 === 1 || nt2 === 1) {
		// 	toNode.replaceWith(fromNode);
		// 	destroy(toNode);
		// 	return fromNode;
		// }
		if ((nt1 === 1 || nt2 === 1)
			&& (toNode.tagName !== fromNode.tagName)
			|| (toNode.__async || fromNode.__async)
			|| (toNode.listeners && toNode.listeners.length || fromNode.listeners && fromNode.listeners.length)) {
			if (toNode.parentNode) {
				toNode.parentNode.insertBefore(fromNode, toNode);
				destroy(toNode);
				return fromNode;
			} else {
				toNode.replaceWith(fromNode);
				destroy(toNode);
				return fromNode;
			}
		}

		fuseAttributes(toNode, fromNode, getElementAttributes(toNode));
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
