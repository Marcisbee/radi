import setAttributes from '../setAttributes';

export default class AttributeListener {
  /**
   * @param {object} options
   * @param {string} options.attributeKey
   * @param {Listener} options.listener
   * @param {Node} options.element
   */
  constructor({ attributeKey, listener, element }) {
    this.attributeKey = attributeKey;
    this.listener = listener;
    this.element = element;
    this.attached = false;
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  /**
   * Attaches attribute listener to given element and starts listening.
   * @returns {AttributeListener}
   */
  attach() {
    if (!this.element.attributeListeners) this.element.attributeListeners = [];
    this.element.attributeListeners.push(this);
    this.listener.onValueChange(this.handleValueChange);
    this.attached = true;

    if (this.attributeKey === 'model') {
      if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
        this.element.onchange = (e) => {
          this.listener.component[this.listener.key] = e.target.checked;
        };
      } else {
        this.element.oninput = (e) => {
          this.listener.component[this.listener.key] = e.target.value;
        };
      }
    }
    return this;
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    if (this.attributeKey === 'value' || this.attributeKey === 'model') {
      if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
        this.element.checked = value;
      } else {
        this.element.value = value;
      }
    } else {
      setAttributes(this.element, { [this.attributeKey]: value });
    }
  }

  /**
   * @param {Node} newElement
   */
  updateElement(newElement) {
    this.element = newElement;
    return this.element;
  }
}
