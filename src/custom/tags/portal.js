import { mount } from '../../mount';
import {
  customTag,
  patch,
} from '../../html';

customTag('portal',
  function Portal(data) {
    let $ref;
    let $parent;
    const toRender = data.children || [];

    this.onMount = ($element) => {
      mount(function () {
        this.onMount = ($el, $p) => {
          $ref = $el;
          $parent = $p;
        };

        return () => toRender;
      }, data.on || document.body);
    };

    this.onDestroy = (el, parent) => {
      patch($parent, null, toRender, 0, $ref || el);
    };

    return null;
  }
);
