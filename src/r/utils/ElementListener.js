import listenerToNode from './listenerToNode';

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
    const newNode = listenerToNode(value);
    /* eslint-disable */
    for (const node of newNode) {
      // If listenerAsNode[0] is undefined we're dealing with a fragment so we
      // can just append
      if (!this.listenerAsNode[0]) {
        this.element.appendChild(node);
        continue;
      }
      // TODO: Find a cheap way of finding right node to replace as there
      // can be not only listeners in child
      this.element.insertBefore(node, this.listenerAsNode[0]);
    }

    for (const node of this.listenerAsNode) node.remove();

    this.listenerAsNode = newNode;
    /* eslint-enable */
  }

  /**
   * @param {Node} newElement
   */
  updateElement(newElement) {
    this.element = newElement;
    return this.element;
  }
}
