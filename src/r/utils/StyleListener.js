import setStyle from './setStyle';

export default class StyleListener {
  /**
   * @param {object} options
   * @param {string} options.styleKey
   * @param {Listener} options.listener
   * @param {Node} options.element
   * @param {number} options.depth
   */
  constructor({ styleKey, listener, element, depth }) {
    this.depth = depth + 1;
    this.styleKey = styleKey;
    this.listener = listener;
    this.element = element;
    this.attached = false;
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  /**
   * Attaches style listener to given element and starts listening.
   * @returns {StyleListener}
   */
  attach() {
    if (!this.element.styleListeners) this.element.styleListeners = [];
    this.element.styleListeners.push(this);
    this.listener.applyDepth(this.depth).init();
    this.listener.onValueChange(this.handleValueChange);
    this.attached = true;
    return this;
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    setStyle(this.element, this.styleKey, value);
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
    this.styleKey = null;
    this.listener = null;
    this.element = null;
    this.attached = false;
    this.handleValueChange = null;
  }
}
