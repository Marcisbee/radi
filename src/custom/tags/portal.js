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

    this.onMount = () => {
      $ref = mount(html('radi-portal', {}, children), parent);
    };

    this.onDestroy = () => {
      destroy($ref);
    };

    return null;
  }
);
