/**
 * @param {Node} oldEl
 * @param {Node} newEl
 * @return {Node}
 */
const copyAttributeListeners = (oldEl, newEl) => {
  if (!oldEl.attributeListeners) return;
  for (const listener of oldEl.attributeListeners) {
    listener.listener.clearChangeCallbacks();
    listener.listener.onValueChange((value) => {
      newEl.setAttribute(listener.attributeKey, value);
    });
  }
  newEl.attributeListeners = oldEl.attributeListeners;
  return newEl;
};

export default copyAttributeListeners;
