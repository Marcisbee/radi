import { Service } from '../../service';
import { html } from '../../html';
import { Store } from '../../store';

const h = html;

export const ModalStore = new Store({}, null);

const registerModal = (store, name) => ({
  ...store,
  [name]: false,
});

const switchModal = (store, name, type) => ({
  ...store,
  [name]: type,
});

export function Modal({ name = 'default', children }) {
  const modal = ModalStore.state;

  if (typeof name === 'undefined') {
    console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
  }

  this.onMount = el => {
    if (!modal[name])
      ModalStore.dispatch(registerModal, name);
  }

  return modal[name] && h('div',
    { class: 'radi-modal', name },
    h('div', {
      class: 'radi-modal-backdrop',
      onclick: () => ModalService.close(name),
    }),
    h('div',
      { class: 'radi-modal-content' },
      ...(children.slice())
    )
  );
}

export const ModalService = Service.add('Modal', () => {
  return {
    open: (name) => ModalStore.dispatch(switchModal, name, true),
    close: (name) => ModalStore.dispatch(switchModal, name, false),
    onOpen: (name, fn) =>
      ModalStore.subscribe((n, p) => n[name] === true && n[name] !== p[name] && fn()),
    onClose: (name, fn) =>
      ModalStore.subscribe((n, p) => n[name] === false && n[name] !== p[name] && fn()),
  };
});
