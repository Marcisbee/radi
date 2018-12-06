import { destroy } from '../../destroy';
import { html } from '../../html';
import { mount } from '../../mount';

export function Portal(data) {
  const {
    children,
    parent = data.on || document.body,
  } = data;
  if (this.pointer && this.pointer.__radiUpdateChild) {
    this.pointer.__radiUpdateChild(undefined, children);
  }
  this.onMount = (e) => {
    mount(html(function (props) {
      this.onMount = (ev) => {
        e.target.__radiUpdateChild = this.update;
        e.target.__radiPoint.dom[0].__radiRef = ev.target.__radiPoint;
      };
      return props.children.length > 0 ? props.children : children;
    }), parent);
  };

  this.onDestroy = (e) => {
    destroy(e.target.__radiPoint.dom[0].__radiRef.dom);
  };

  return null;
}
