import { destroy } from '../../destroy';
import { mount } from '../../mount';
import { customTag, html } from '../../html';

customTag('portal',
  function Portal(data) {
    const {
      children = [],
      parent = data.on || document.body,
    } = data;
    let $ref;

    this.onMount = (e) => {
      mount(function () {
        this.onMount = (e) => {
          $ref = this.dom;
        }
        return html('portal-body', {}, children)
      }, parent);
    };

    this.onDestroy = (e) => {
      destroy($ref);
    };

    return null;
  }
);
