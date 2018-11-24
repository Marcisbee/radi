import { customTag, html } from '../../html';

function ensureFn(maybeFn) {
  if (typeof maybeFn === 'function') return maybeFn;
  return (e) => maybeFn || e;
}

let sharedPlaceholder;

export function Await(props) {
  let placeholderTimeout;
  let {
    src,
    waitMs,
    transform = e => e,
    error = e => e,
    placeholder = sharedPlaceholder,
    value = null,
    loaded = false
  } = props;

  this.cached = true;

  if (!(src &&
    (src instanceof Promise || src.constructor.name === 'LazyPromise')
  )) {
    console.warn('[Radi] <await/> must have `src` as a Promise');
    return null;
  }

  if (!loaded) {
    if (placeholder !== value) {
      if (waitMs) {
        placeholderTimeout = setTimeout(() => {
          this.update({ ...props, value: placeholder });
        }, waitMs);
      } else {
        value = placeholder;
      }
    }

    src
      .then((value) => {
        if (value && typeof value === 'object' && typeof value.default === 'function') {
          value = html(value.default);
        }

        clearTimeout(placeholderTimeout);

        const tempPlaceholder = sharedPlaceholder;
        sharedPlaceholder = placeholder;

        this.update({ ...props, value: ensureFn(transform)(value), loaded: true });

        sharedPlaceholder = tempPlaceholder;
      })
      .catch((err) => {
        console.error(err);
        clearTimeout(placeholderTimeout);
        this.update({ ...props, value: ensureFn(error)(err), loaded: true });
      })
  }

  return value;
}

customTag('await', Await);
