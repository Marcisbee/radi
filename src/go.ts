import { renderToChunks } from './server-html.ts';
import type { ServerChild } from './server-html.ts';

declare const __radiData: (id: number, name: string, input: string) => void;

export interface GoRequest {
  method: string;
  url: string;
  headers: Record<string, string[]>;
}

const pending = new Map<number, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();
let sequence = 0;

/** Calls an explicitly registered Go operation in the current request context. */
export function data<T = unknown>(
  name: string,
  input: unknown = null,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    try {
      __radiData(id, name, JSON.stringify(input));
    } catch (error) {
      pending.delete(id);
      reject(error);
    }
  });
}

/** Export as `app`, then bundle as an IIFE with global name `Radi`. */
export function defineApp(render: (request: GoRequest) => ServerChild) {
  let chunks: AsyncGenerator<string>;
  return {
    start(request: string, maxTextLength: number): void {
      chunks = renderToChunks(render(JSON.parse(request)), maxTextLength);
    },
    async pull(): Promise<string> {
      return JSON.stringify(await chunks.next());
    },
    settle(message: string): void {
      const { id, value, error } = JSON.parse(message);
      const operation = pending.get(id);
      if (!operation) return;
      pending.delete(id);
      if (error) operation.reject(new Error(error));
      else operation.resolve(value);
    },
  };
}
