import { Store } from '../../store';
import { customTag } from '../../html';

function ensureFn(maybeFn) {
  if (typeof maybeFn === 'function') return maybeFn;
  return (e) => maybeFn || e;
}

customTag('await',
  function Await(promise) {
    const { src } = promise;
    const awaitStore = new Store({
      status: 'placeholder',
    });

    const update = (e, status) => ({status});

    if (src &&
      (src instanceof Promise || src.constructor.name === 'LazyPromise')
    ) {
      let output = '';
      src
        .then(data => {
          output = data;
          awaitStore.dispatch(update, 'transform');
        })
        .catch(error => {
          output = error;
          awaitStore.dispatch(update, 'error');
        });

      return awaitStore(({status}) => ensureFn(promise[status])(output));
    }

    return null;
  }
);
