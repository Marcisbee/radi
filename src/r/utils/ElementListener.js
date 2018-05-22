import listenerToNode from './listenerToNode';
import insertAfter from './insertAfter';
import fuseDom from './fuseDom';

export default class ElementListener {
  /**
   * @param {object} options
   * @param {Listener} options.listener
   * @param {Node} options.element
   */
  constructor({ listener, element }) {
    this.listener = listener;
    this.element = element;
    this.listenerAsNode = [];
    this.attached = false;
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  /**
   * Attaches listener to given element and starts listening.
   * @returns {ElementListener}
   */
  attach() {
    if (!this.element.listeners) this.element.listeners = [];
    this.element.listeners.push(this);
    this.listener.onValueChange(this.handleValueChange);
    this.attached = true;
    return this;
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    const newNode = listenerToNode(value, this.element instanceof SVGElement);

    var i = 0
    for (const node of newNode) {
      if (!this.listenerAsNode[i]) {
        if (this.listenerAsNode[i - 1]) {
          this.listenerAsNode.push(node);
          insertAfter(this.listenerAsNode[i - 1], node);
        } else {
          this.listenerAsNode.push(this.element.appendChild(node));
        }
      } else {
        this.listenerAsNode[i] = fuseDom.fuse(this.listenerAsNode[i], node);
      }
      i+=1
    }

    if (i < this.listenerAsNode.length) {
      var nodesLeft = this.listenerAsNode.splice(i-this.listenerAsNode.length);
      for (const node of nodesLeft) {
        fuseDom.destroy(node);
        // node.remove();
      }
    }
  }

  /**
   * @param {Node} newElement
   */
  updateElement(newElement) {
    this.element = newElement;
    return this.element;
  }

  deattach() {
    this.listener.deattach();
    this.listener = null;
    this.element = null;
    this.listenerAsNode = null;
    this.attached = false;
    this.handleValueChange = () => {};
  }
}
