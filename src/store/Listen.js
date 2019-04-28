
/**
 * @param {Store} store
 * @param {Function} transformer
 * @returns {Listener} Function of Listener
 */
export function Listen(store, transformer = (e) => e) {
  return (newTransformer = transformer) => (
    store.listener((data) => (
      newTransformer(transformer(data)))
    )
  );
}
