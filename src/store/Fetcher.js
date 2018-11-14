import { Store } from './Store';

export function Fetcher(resolver, success, error) {
  return (defaults) => {
    const fetcherStore = new Store(defaults);

    if (resolver instanceof Promise) {
      resolver
        .then(success || ((returned) => {
          fetcherStore.dispatch(() => returned);
        }))
        .catch(error || ((err) => {
          console.error(err);
        }));
    }

    return fetcherStore;
  };
}
