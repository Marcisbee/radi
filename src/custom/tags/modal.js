import { service } from '../../component';
import { html, customTag } from '../../html';
import { Store } from '../../store';

const h = html;

export const ModalStore = new Store({});

const registerModal = (store, name) => ({
  [name]: false,
});

const switchModal = (store, name, type) => ({
  [name]: type,
});

export const ModalService = service('modal', (...args) => {
  return {
    open: (name) => ModalStore.dispatch(switchModal, name, true),
    close: (name) => ModalStore.dispatch(switchModal, name, false),
  };
});

customTag('modal',
  function Modal({name = 'default', children}) {
    if (typeof name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
    }

    this.style = `
      .--radi-modal {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
      }
      .--radi-modal-backdrop {
        display: block;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        background-color: rgba(0, 0, 0, 0.7);
      }
      .--radi-modal-content {
        display: block;
        position: relative;
        width: 600px;
        max-width: 98%;
        z-index: 1;
        margin: 40px auto;
        border-radius: 8px;
        box-shadow: 0 5px 0px rgba(0, 0, 0, 0.1), 0 20px 50px rgba(0, 0, 0, 0.3);
        background-color: #fff;
        padding: 26px;
      }
    `
    this.onMount = el => ModalStore.dispatch(registerModal, name);

    return h('portal', {},
      ModalStore(data => (
        data[name] && h('div',
          { class: 'radi-modal', name },
          h('div', {
            class: 'radi-modal-backdrop',
            onclick: () => this.$modal.close(name),
          }),
          h('div',
            { class: 'radi-modal-content' },
            ...(children.slice())
          )
        )
      ))
    );
  }
);
