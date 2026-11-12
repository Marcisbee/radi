import { createElement, createRoot, update } from './client.ts';

export interface WebComponentOptions {
  /** Attribute names passed to the component as strings (null when removed). */
  attributes?: readonly string[];
}

export interface RadiElement<P extends object> extends HTMLElement {
  /** JavaScript props override attributes. Assign a new object to update. */
  props: Partial<P>;
}

/** Convert a Radi component into a class for customElements.define(). */
export function webcomponent<P extends object = Record<string, unknown>>(
  component: (this: HTMLElement, props: () => P) => unknown,
  options: WebComponentOptions = {},
): { new (): RadiElement<P> } {
  const attributes = [...(options.attributes ?? [])];
  return class extends HTMLElement implements RadiElement<P> {
    static observedAttributes = attributes;
    #props: Partial<P> = {};
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
            ...Object.fromEntries(
              attributes.map((name) => [name, element.getAttribute(name)]),
            ),
            ...element.#props,
          }) as P);
      }, null));
    }

    disconnectedCallback() {
      this.#root?.unmount();
      this.#root = undefined;
      this.replaceChildren();
    }

    attributeChangedCallback() {
      this.#update();
    }

    #update() {
      if (this.#root?.root) update(this.#root.root);
    }
  };
}
