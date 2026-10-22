import type { ResumeState } from './resume-state.ts';
export type { ResumeState } from './resume-state.ts';

export interface ResumeContext {
  boundary: Element;
  element: Element;
  event: MouseEvent;
  state: ResumeState;
  signal: AbortSignal;
}
export type ResumeHandler = (context: ResumeContext) => void | Promise<void>;
export type ResumeLoaders = Record<string, () => Promise<ResumeHandler>>;
export interface ResumeOptions {
  /** Maximum queued/running clicks across this root. Default 64. */
  maxPending?: number;
  /** Maximum wait for streamed HTML and handler code. Default 30 seconds. */
  timeout?: number;
  onError?: (error: unknown) => void;
}

interface Boundary {
  state: ResumeState;
  tail: Promise<void>;
}
const roots = new WeakSet<Document | Element>();

function waitForBoundary(
  boundary: Element,
  signal: AbortSignal,
): Promise<void> {
  const ready = () =>
    boundary.lastElementChild?.matches('template[data-radi-ready]');
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (ready()) finish();
    });
    const abort = () => finish(signal.reason);
    const finish = (error?: unknown) => {
      observer.disconnect();
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve();
    };
    observer.observe(boundary, { childList: true });
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() =>
      signal.removeEventListener('abort', abort)
    );
    if (signal.aborted) abort();
  });
}

class ResumeRuntime {
  lifetime = new AbortController();
  boundaries = new WeakMap<Element, Boundary>();
  handlers = new Map<string, Promise<ResumeHandler>>();
  pending = 0;
  maxPending: number;
  timeout: number;
  report: (error: unknown) => void;

  constructor(
    readonly root: Document | Element,
    readonly loaders: ResumeLoaders,
    options: ResumeOptions,
  ) {
    if (roots.has(root)) {
      throw new Error('Resumption already installed on this root');
    }
    this.maxPending = options.maxPending ?? 64;
    this.timeout = options.timeout ?? 30000;
    if (
      !Number.isSafeInteger(this.maxPending) || this.maxPending < 1 ||
      !Number.isFinite(this.timeout) || this.timeout <= 0
    ) {
      throw new RangeError('Invalid resumption limits');
    }
    this.report = options.onError ?? ((error: unknown) => console.error(error));
    roots.add(root);
    root.addEventListener('click', this.capture, true);
  }

  load(key: string): Promise<ResumeHandler> {
    let handler = this.handlers.get(key);
    if (!handler) {
      handler = Promise.resolve().then(() => this.loaders[key]()).then(
        (value) => {
          if (typeof value !== 'function') {
            throw new TypeError('Invalid resume handler');
          }
          return value;
        },
      ).catch((error) => {
        this.handlers.delete(key);
        throw error;
      });
      this.handlers.set(key, handler);
    }
    return handler;
  }

  async deliver(context: ResumeContext, key: string) {
    const { lifetime, timeout, root } = this;
    const controller = new AbortController();
    const abort = () => controller.abort(lifetime.signal.reason);
    lifetime.signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(
      () => controller.abort(new Error('Resumption timed out')),
      timeout,
    );
    context.signal = controller.signal;
    try {
      const [handler] = await abortable(
        Promise.all([
          this.load(key),
          waitForBoundary(context.boundary, controller.signal),
        ]),
        controller.signal,
      );
      clearTimeout(timer);
      if (
        !root.contains(context.element) ||
        !context.boundary.contains(context.element)
      ) return;
      await abortable(Promise.resolve(handler(context)), controller.signal);
    } finally {
      clearTimeout(timer);
      lifetime.signal.removeEventListener('abort', abort);
      controller.abort();
    }
  }

  capture = (event: Event) => {
    const target = event.target;
    if (!(event instanceof MouseEvent) || !(target instanceof Element)) return;
    const element = target.closest('[data-radi-click]');
    const boundary = target.closest('[data-radi-state]');
    if (
      !element || !boundary || !boundary.contains(element) ||
      !this.root.contains(boundary)
    ) return;
    const key = element.getAttribute('data-radi-click')!;
    if (!Object.hasOwn(this.loaders, key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.pending >= this.maxPending) {
      this.report(new Error('Resumption queue is full'));
      return;
    }
    let record = this.boundaries.get(boundary);
    try {
      if (!record) {
        record = {
          state: JSON.parse(boundary.getAttribute('data-radi-state')!),
          tail: Promise.resolve(),
        };
        this.boundaries.set(boundary, record);
      }
    } catch (error) {
      this.report(error);
      return;
    }
    this.enqueue(record, {
      boundary,
      element,
      event,
      state: record.state,
      signal: this.lifetime.signal,
    }, key);
  };

  enqueue(record: Boundary, context: ResumeContext, key: string) {
    const { lifetime } = this;
    this.pending++;
    record.tail = record.tail.then(async () => {
      if (lifetime.signal.aborted) return;
      context.state = record.state;
      try {
        await this.deliver(context, key);
      } finally {
        record.state = context.state;
      }
    }).catch((error) => {
      if (!lifetime.signal.aborted) this.report(error);
    }).finally(() => {
      this.pending--;
    });
  }

  dispose = () => {
    if (this.lifetime.signal.aborted) return;
    this.root.removeEventListener('click', this.capture, true);
    this.lifetime.abort();
    this.handlers.clear();
    roots.delete(this.root);
  };
}

/** Install before interactive HTML is parsed. Returns an idempotent disposer. */
export function resume(
  root: Document | Element,
  loaders: ResumeLoaders,
  options: ResumeOptions = {},
): () => void {
  return new ResumeRuntime(root, loaders, options).dispose;
}
