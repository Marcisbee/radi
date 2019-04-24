
/**
 * @param {Store} store
 * @param {Function} transformer
 * @returns {Listener} Function of Listener
 */
export function Listen(store, transformer) {
  return (newTransformer = transformer) => store.listener(newTransformer);
}
