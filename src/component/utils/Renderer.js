export default class Renderer {
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.component = component;
    this.html = document.createDocumentFragment();
    this.node = {};
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    this.html.appendChild(this.node = this.component.$view);
    this.html.destroy = this.node.destroy = () => this.component.destroy();
    return this.html;
  }

  /**
   * @returns {HTMLElement}
   */
  destroyHtml() {
    if (this.node.childNodes) {
      this.node.childNodes.forEach(childNode => {
        this.node.removeChild(childNode);
      });
    }

    if (this.html.childNodes) {
      this.html.childNodes.forEach(childNode => {
        this.html.removeChild(childNode);
      });
    }

    this.html = document.createDocumentFragment();
    this.node = {};

    return this.node;
  }
}
