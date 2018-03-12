import setAttributes from '../setAttributes';

export default class AttributeListener {
  /**
   * @param {object} obj
   * @param {string} obj.attributeKey
   * @param {Listener} obj.listener
   * @param {Node} element
   */
  constructor({ attributeKey, listener, element }) {
    this.attributeKey = attributeKey;
    this.listener = listener;
    this.element = element;
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  /**
   * Attaches attribute listener to given element and starts listening.
   */
  attach() {
    if (!this.element.attributeListeners) this.element.attributeListeners = [];
    this.element.attributeListeners.push(this);
    this.listener.onValueChange(this.handleValueChange);
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    setAttributes(this.element, { [this.attributeKey]: value });
  }

  /**
   * @param {Node} newElement
   */
  updateElement(newElement) {
    this.element = newElement;
    return this.element;
  }
}
