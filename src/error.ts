// Centralized render error dispatch.
// Emits a bubbling, cancelable CustomEvent('error') with { detail: { error } }.
// If not prevented, logs the error to console.

export function dispatchRenderError(origin: Element, error: unknown): void {
  const event = new CustomEvent("error", {
    detail: { error },
    bubbles: true,
    cancelable: true,
  });

  try {
    origin.dispatchEvent(event);
  } catch (dispatchErr) {
    // Dispatch failures are unexpected; log them separately.
    console.error(dispatchErr);
  }

  // Log the original error if no handler prevented default and didn't stop bubbling.
  const canceled = event.defaultPrevented || (event as any).cancelBubble;
  if (!canceled) {
    console.error(error);
  }
}
