export default class Renderer {
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.component = component;
    this.html = document.createDocumentFragment();
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    this.html.appendChild(this.component.$view);
    this.html.destroy = () => this.destroyHtml();
    return this.html;
  }

  /**
   * @returns {HTMLElement}
   */
  destroyHtml() {
    // Empty document fragment, so nothing to destroy
    if (!this.html.childNodes) return oldRootEl;
    for (const childNode of this.html.childNodes) {
      this.html.removeChild(childNode);
    }
    return this.html;
  }
}
