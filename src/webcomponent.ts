import { createElement, createRoot, update } from './client.ts';

export interface WebComponentOptions<
  P extends object = Record<string, unknown>,
> {
  /** Prop names map to kebab-case attributes. Converters run only for present values. */
  attributes?: { [K in keyof P]?: (value: string) => P[K] };
  /** Component callback props exposed as bubbling, composed CustomEvents. */
  events?: {
    [
      K in keyof P as NonNullable<P[K]> extends (...args: never[]) => unknown
        ? K
        : never
    ]?: string;
  };
}

export interface RadiElement<P extends object> extends HTMLElement {
  /** JavaScript props override attributes. Assign a new object to update. */
  props: Partial<P>;
}

/** Convert a Radi component into a class for customElements.define(). */
export function webcomponent<P extends object = Record<string, unknown>>(
  component: (this: HTMLElement, props: () => P) => unknown,
  options: WebComponentOptions<P> = {},
): { new (): RadiElement<P> } {
  const attributes = new Map(
    Object.entries(
      options.attributes ?? {},
    ).map(([prop, convert]) => [
      prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      { prop, convert: convert as (value: string) => unknown },
    ]),
  );
  const events = Object.entries(options.events ?? {}) as [string, string][];
  return class extends HTMLElement implements RadiElement<P> {
    static observedAttributes = [...attributes.keys()];
    #props: Partial<P> = {};
    #values: Record<string, unknown> = Object.fromEntries(
      [...attributes.values()].map(({ prop, convert }) => [
        prop,
        convert === Boolean ? false : undefined,
      ]),
    );
    #events = Object.fromEntries(events.map(([prop, name]) => [
      prop,
      (...args: unknown[]) => {
        this.dispatchEvent(
          new CustomEvent(name, {
            detail: args.length > 1 ? args : args[0],
            bubbles: true,
            composed: true,
          }),
        );
        const callback = (this.#props as Record<string, unknown>)[prop];
        if (typeof callback === 'function') return callback(...args);
      },
    ]));
    #root: ReturnType<typeof createRoot> | undefined;

    get props(): Partial<P> {
      return this.#props;
    }

    set props(value: Partial<P>) {
      this.#props = value;
      this.#update();
    }

    connectedCallback() {
      if (this.#root || !this.isConnected) return;
      // Preserve properties assigned before customElements.define() upgraded us.
      if (Object.prototype.hasOwnProperty.call(this, 'props')) {
        const value = this.props;
        delete (this as Partial<RadiElement<P>>).props;
        this.props = value;
      }
      const element = this;
      this.#root = createRoot(this);
      this.#root.render(createElement(function (this: HTMLElement) {
        return component.call(this, () =>
          ({
            ...element.#values,
            ...element.#props,
            ...element.#events,
          }) as P);
      }, null));
    }

    disconnectedCallback() {
      this.#root?.unmount();
      this.#root = undefined;
      this.replaceChildren();
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      value: string | null,
    ) {
      if (value === oldValue) return;
      const { prop, convert } = attributes.get(name)!;
      this.#values[prop] = convert === Boolean
        ? value !== null
        : value === null
        ? undefined
        : convert(value);
      this.#update();
    }

    #update() {
      if (this.#root?.root) update(this.#root.root);
    }
  };
}
