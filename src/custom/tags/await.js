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

      return function AwaitContent() {
        // this.onMount = e => {
        //   e.__radiAsync = true;
        // }

        const status = awaitStore('status');
        const ensured = ensureFn(promise[status])(output);
        return {
          type: 'div',
          props: {},
          children: [
            ensured,
          ]
        };
      };
    }

    // this.onMount = e => {
    //   e.__radiAsync = true;
    // }

    return null;
  }
);
