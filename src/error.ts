export function bubbleError(error: any, target: Node, name?: string) {
  if (
    target.dispatchEvent(
      new ErrorEvent("error", {
        error,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    )
  ) {
    console.error(name || target, error);
  }
}
