export default class Renderer {
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.component = component;
    this.$html = document.createDocumentFragment();
  }

  /**
   * @returns {HTMLElement}
   */
  destroyHtml() {
    const oldRootEl = this.$html;
    const newRootEl = oldRootEl.cloneNode(false);
    oldRootEl.parentNode.insertBefore(newRootEl, oldRootEl);
    this.component.unmount();
    oldRootEl.remove();
    return newRootEl;
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    // TODO: component.$view can be a Component too and not an HTMLElement?
    this.$html.appendChild(this.component.$view);
    this.$html.destroy = () => this.destroyHtml();
    return this.$html;
  }
}
