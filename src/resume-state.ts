export type ResumeState = null | boolean | number | string | ResumeState[] | {
  [key: string]: ResumeState;
};

/** Reject values JSON would silently discard or change. State is public HTML. */
export function serializeState(state: ResumeState): string {
  const ancestors = new Set<object>();
  function validate(value: unknown): void {
    if (
      value === null || typeof value === 'string' || typeof value === 'boolean'
    ) return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (
      typeof value === 'object' &&
      (Array.isArray(value) ||
        Object.getPrototypeOf(value) === Object.prototype)
    ) {
      if (ancestors.has(value)) {
        throw new TypeError('Circular resumption state');
      }
      ancestors.add(value);
      for (const child of Array.isArray(value) ? value : Object.values(value)) {
        validate(child);
      }
      ancestors.delete(value);
      return;
    }
    throw new TypeError('Resumption state must contain only JSON values');
  }
  validate(state);
  return JSON.stringify(state);
}
