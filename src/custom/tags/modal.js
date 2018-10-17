import { Service } from '../../service';
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

export const ModalService = Service('modal', (...args) => {
  return {
    open: (name) => ModalStore.dispatch(switchModal, name, true),
    close: (name) => ModalStore.dispatch(switchModal, name, false),
    onOpen: (name, fn) =>
      ModalStore.subscribe((n, p) => n[name] === true && n[name] !== p[name] && fn()),
    onClose: (name, fn) =>
      ModalStore.subscribe((n, p) => n[name] === false && n[name] !== p[name] && fn()),
  };
});

customTag('modal',
  function Modal({name = 'default', children}) {
    if (typeof name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
    }

    this.onMount = el => ModalStore.dispatch(registerModal, name);

    return h('portal', {},
      ModalStore(data => (
        data[name] && h('div',
          { class: 'radi-modal', name },
          h('div', {
            class: 'radi-modal-backdrop',
            onclick: () => service.modal.close(name),
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
