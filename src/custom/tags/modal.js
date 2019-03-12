import { Service } from '../../service';
import { Store, Action } from '../../store';
import { html } from '../../html';

const h = html;

const registerModal = Action('Register Modal');
const switchModal = Action('Switch Modal');

export const ModalStore = Store({}, null)
  .on(registerModal, (store, name) => ({
    ...store,
    [name]: false,
  }))
  .on(switchModal, (store, name, type) => ({
    ...store,
    [name]: type,
  }));

export function Modal({ name = 'default', children }) {
  const modal = ModalStore.state;

  if (typeof name === 'undefined') {
    console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
  }

  this.onMount = () => {
    if (!modal[name]) {
      registerModal(name);
    }
  };

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

export const ModalService = Service.add('Modal', () => (
  {
    open: (name) => switchModal(name, true),
    close: (name) => switchModal(name, false),
    onOpen: (name, fn) => (
      ModalStore.subscribe((n, p) => n[name] === true && n[name] !== p[name] && fn())
    ),
    onClose: (name, fn) => (
      ModalStore.subscribe((n, p) => n[name] === false && n[name] !== p[name] && fn())
    ),
  }
));
