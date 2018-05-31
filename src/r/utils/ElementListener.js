import listenerToNode from './listenerToNode';
import insertAfter from './insertAfter';
import fuseDom from './fuseDom';
import appendChild from '../appendChild';

export default class ElementListener {
  /**
   * @param {object} options
   * @param {Listener} options.listener
   * @param {Node} options.element
   * @param {number} options.depth
   */
  constructor({ listener, element, depth }) {
    this.depth = depth + 1;
    this.pointer = document.createTextNode('');
    this.pointer.isPointer = true;
    this.pointer.destroy = () => {
      if (this.listenerAsNode && this.listenerAsNode.length) {
        for (var i = 0; i < this.listenerAsNode.length; i++) {
          if (this.listenerAsNode[i]) fuseDom.destroy(this.listenerAsNode[i]);
        }
      }
      this.listenerAsNode = null;
      if (this.pointer && this.pointer.remove) this.pointer.remove();
      this.pointer = null;
    };
    this.listener = listener;
    this.element = element.real || element;
    this.listenerAsNode = [];
    this.attached = false;
  }

  /**
   * Inserts new nodes after pointer.
   * @param {Node} after
   * @param {[*]} value
   * @returns {Node}
   */
  insert(after, value) {
    for (var i = 0; i < value.length; i++) {
      insertAfter(value[i - 1] || after, value[i]);
    }
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    if (!this.attached || this.listenerAsNode === null) return false;
    const newNodeContainer = document.createDocumentFragment();
    listenerToNode(value, this.element instanceof SVGElement, this.depth, this.pointer, element => {
      newNodeContainer.appendChild(element);
      return element;
    });
    let newNode = Array.from(newNodeContainer.childNodes);

    let length = Math.min(newNode.length, this.listenerAsNode.length);

    for (var i = 0; i < length; i++) {
      newNode[i] = fuseDom.fuse(this.listenerAsNode[i], newNode[i]);
    }

    let diff = this.listenerAsNode.length - newNode.length;

    if (diff > 0) {
      for (var n = i; n < i + diff; n++) {
        fuseDom.destroy(this.listenerAsNode[n]);
      }
    } else
    if (diff < 0) {
      this.insert(i > 0 ? newNode[i - 1] : this.pointer, newNode.slice(i, newNode.length));
    }

    this.listenerAsNode = newNode;
  }

  /**
   * Attaches listener to given element and starts listening.
   * @returns {ElementListener}
   */
  attach(element = this.element) {
    element.appendChild(this.pointer);
    if (!element.listeners) element.listeners = [];
    element.listeners.push(this);
    this.listener.applyDepth(this.depth).init();
    this.attached = true;
    this.listener.onValueChange(value => this.handleValueChange(value));
    return this;
  }

  /**
   * Deattaches and destroys listeners
   */
  deattach() {
    this.listener.deattach();
    this.listener = null;
    this.element = null;
    if (this.listenerAsNode && this.listenerAsNode.length) {
      for (var i = 0; i < this.listenerAsNode.length; i++) {
        if (this.listenerAsNode[i]) fuseDom.destroy(this.listenerAsNode[i]);
      }
    }
    this.listenerAsNode = null;
    if (this.pointer && this.pointer.remove) this.pointer.remove();
    this.pointer = null;
    this.attached = false;
    this.handleValueChange = () => {};
  }
}
