export default class Renderer {
  constructor(component) {
    this.component = component;
    this.$html = document.createDocumentFragment();
  }

  destroyHtml() {
    const oldRootEl = this.$html;
    const newRootEl = oldRootEl.cloneNode(false);
    oldRootEl.parentNode.insertBefore(newRootEl, oldRootEl);
    this.component.unmount();
    oldRootEl.remove();
  }

  render() {
    this.$html.appendChild(this.component.$view);
    this.$html.destroy = () => this.destroyHtml();
    return this.$html;
  }
}
