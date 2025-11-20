export {}; // Ensure this file is treated as a module so 'declare global' works.

type Observable<T> = {
  readonly value: T;
  subscribe(cb: (v: T) => void): { unsubscribe(): void } | (() => void);
};

type Reactive<T> = T | ((el: Node) => T) | Observable<T>;

type StyleValue<T> = Reactive<T>;
type StyleObject = {
  [K in keyof CSSStyleDeclaration]?: StyleValue<CSSStyleDeclaration[K]>;
};

type Primitive = string | number | boolean | null | undefined;

type Renderable =
  | Node
  | Primitive
  | Renderable[]
  | ((element?: HTMLElement) => Renderable);

/**
 * Constructs component prop types where each declared prop can be reactive.
 */
type ComponentProps<P extends Record<string, unknown>> =
  & {
    [K in keyof P]: Reactive<P[K]>;
  }
  & {
    children?: Renderable | Renderable[] | (() => Renderable | Renderable[]);
  };

/**
 * Component function shape for the MiniFramework.
 * - `this` is a DocumentFragment used as the component root container.
 * - Props are reactive-enabled.
 * - Return value can be a Renderable or a function producing a Renderable (for reactive subtree).
 */
interface MiniFWComponent<P extends Record<string, unknown> = {}> {
  (this: DocumentFragment, props: () => ComponentProps<P>): Renderable;
}

type ElementWithChildren<T> =
  & {
    [K in Exclude<keyof T, keyof Node | "style" | "children" | "key">]?:
      Exclude<T[K], null | undefined> extends Function ? T[K]
        : Reactive<T[K]>;
  }
  & {
    style?: Reactive<StyleObject>;
    onupdate?: (this: T, ev: Event & { target: T }) => any;
    onconnect?: (this: T, ev: Event & { target: T }) => any;
    ondisconnect?: (this: T, ev: Event & { target: T }) => any;
    key?: string;
    children?: any | undefined;
  };

type ElementWithoutChildren<T> =
  & {
    [K in Exclude<keyof T, keyof Node | "style" | "children" | "key">]?:
      Exclude<T[K], null | undefined> extends Function ? T[K]
        : Reactive<T[K]>;
  }
  & {
    style?: Reactive<StyleObject>;
    onupdate?: (this: T, ev: Event & { target: T }) => any;
    onconnect?: (this: T, ev: Event & { target: T }) => any;
    ondisconnect?: (this: T, ev: Event & { target: T }) => any;
    key?: string;
  };

/**
 * Global JSX namespace augmentation.
 */
declare global {
  namespace JSX {
    type Props<T extends Record<string, any> = Record<string, any>> = () => T;
    type PropsWithChildren<
      T extends Record<string, any> = Record<string, any>,
    > = () => T & {
      children: any;
    };

    /**
     * The Element type encompasses all renderables including functions,
     * to allow returning a function directly from components.
     */
    type Element = HTMLElement | null;
    type ElementType =
      // All the valid lowercase tags
      | keyof IntrinsicElements
      // Function components
      | ((props: any) => Element)
      | ((props: any) => () => Element);

    /**
     * IntrinsicElements: every tag name maps to permissive, reactive-capable props.
     * Specific refinement can be added later as needed.
     */
    interface IntrinsicElements {
      html: ElementWithChildren<HTMLElement>;
      head: ElementWithChildren<HTMLHeadElement>;
      title: ElementWithChildren<HTMLTitleElement>;
      base: ElementWithoutChildren<HTMLBaseElement>;
      link: ElementWithoutChildren<HTMLLinkElement>;
      meta: ElementWithoutChildren<HTMLMetaElement>;
      style: ElementWithChildren<HTMLStyleElement>;
      body: ElementWithChildren<HTMLBodyElement>;

      // Sectioning / grouping
      address: ElementWithChildren<HTMLElement>;
      article: ElementWithChildren<HTMLElement>;
      aside: ElementWithChildren<HTMLElement>;
      footer: ElementWithChildren<HTMLElement>;
      header: ElementWithChildren<HTMLElement>;
      main: ElementWithChildren<HTMLElement>;
      nav: ElementWithChildren<HTMLElement>;
      section: ElementWithChildren<HTMLElement>;
      div: ElementWithChildren<HTMLDivElement>;

      // Content
      h1: ElementWithChildren<HTMLHeadingElement>;
      h2: ElementWithChildren<HTMLHeadingElement>;
      h3: ElementWithChildren<HTMLHeadingElement>;
      h4: ElementWithChildren<HTMLHeadingElement>;
      h5: ElementWithChildren<HTMLHeadingElement>;
      h6: ElementWithChildren<HTMLHeadingElement>;
      hgroup: ElementWithChildren<HTMLElement>;
      p: ElementWithChildren<HTMLParagraphElement>;
      hr: ElementWithoutChildren<HTMLHRElement>;
      pre: ElementWithChildren<HTMLPreElement>;
      blockquote: ElementWithChildren<HTMLQuoteElement>;
      ol: ElementWithChildren<HTMLOListElement>;
      ul: ElementWithChildren<HTMLUListElement>;
      li: ElementWithChildren<HTMLLIElement>;
      dl: ElementWithChildren<HTMLDListElement>;
      dt: ElementWithChildren<HTMLTermElement>;
      dd: ElementWithChildren<HTMLDescriptionElement>;
      figure: ElementWithChildren<HTMLElement>;
      figcaption: ElementWithChildren<HTMLElement>;

      // Inline / phrasing
      a: ElementWithChildren<HTMLAnchorElement>;
      em: ElementWithChildren<HTMLElement>;
      strong: ElementWithChildren<HTMLElement>;
      small: ElementWithChildren<HTMLElement>;
      s: ElementWithChildren<HTMLElement>;
      cite: ElementWithChildren<HTMLElement>;
      q: ElementWithChildren<HTMLQuoteElement>;
      dfn: ElementWithChildren<HTMLElement>;
      abbr: ElementWithChildren<HTMLElement>;
      data: ElementWithChildren<HTMLDataElement>;
      time: ElementWithChildren<HTMLTimeElement>;
      code: ElementWithChildren<HTMLElement>;
      var: ElementWithChildren<HTMLElement>;
      samp: ElementWithChildren<HTMLElement>;
      kbd: ElementWithChildren<HTMLElement>;
      sub: ElementWithChildren<HTMLElement>;
      sup: ElementWithChildren<HTMLElement>;
      i: ElementWithChildren<HTMLElement>;
      b: ElementWithChildren<HTMLElement>;
      u: ElementWithChildren<HTMLElement>;
      mark: ElementWithChildren<HTMLElement>;
      ruby: ElementWithChildren<HTMLElement>;
      rt: ElementWithChildren<HTMLElement>;
      rp: ElementWithChildren<HTMLElement>;
      bdi: ElementWithChildren<HTMLElement>;
      bdo: ElementWithChildren<HTMLElement>;
      span: ElementWithChildren<HTMLSpanElement>;
      br: ElementWithoutChildren<HTMLBRElement>;
      wbr: ElementWithoutChildren<HTMLElement>;

      // Forms
      form: ElementWithChildren<
        HTMLFormElement & {
          onsubmit: (this: HTMLFormElement, ev: SubmitEvent) => any;
        }
      >;
      label: ElementWithChildren<
        HTMLLabelElement & {
          for: string;
        }
      >;
      input: ElementWithoutChildren<HTMLInputElement>;
      button: ElementWithChildren<HTMLButtonElement>;
      select: ElementWithChildren<HTMLSelectElement>;
      datalist: ElementWithChildren<HTMLDataListElement>;
      optgroup: ElementWithChildren<HTMLOptGroupElement>;
      option: ElementWithChildren<HTMLOptionElement>;
      textarea: ElementWithChildren<HTMLTextAreaElement>;
      output: ElementWithChildren<HTMLElement>;
      progress: ElementWithChildren<HTMLProgressElement>;
      meter: ElementWithChildren<HTMLElement>;
      fieldset: ElementWithChildren<HTMLFieldSetElement>;
      legend: ElementWithChildren<HTMLLegendElement>;

      // Interactive and media
      details: ElementWithChildren<HTMLDetailsElement>;
      summary: ElementWithChildren<HTMLElement>;
      dialog: ElementWithChildren<HTMLDialogElement>;
      menu: ElementWithChildren<HTMLMenuElement>;
      menuitem: ElementWithChildren<HTMLElement>;

      img: ElementWithoutChildren<HTMLImageElement>;
      iframe: ElementWithChildren<HTMLIFrameElement>;
      embed: ElementWithoutChildren<HTMLEmbedElement>;
      object: ElementWithChildren<HTMLObjectElement>;
      param: ElementWithoutChildren<HTMLParamElement>;
      video: ElementWithChildren<HTMLVideoElement>;
      audio: ElementWithChildren<HTMLAudioElement>;
      source: ElementWithoutChildren<HTMLSourceElement>;
      track: ElementWithoutChildren<HTMLTrackElement>;
      canvas: ElementWithChildren<HTMLCanvasElement>;

      // Tables
      table: ElementWithChildren<HTMLTableElement>;
      caption: ElementWithChildren<HTMLTableCaptionElement>;
      colgroup: ElementWithChildren<HTMLTableColElement>;
      col: ElementWithoutChildren<HTMLTableColElement>;
      thead: ElementWithChildren<HTMLTableSectionElement>;
      tbody: ElementWithChildren<HTMLTableSectionElement>;
      tfoot: ElementWithChildren<HTMLTableSectionElement>;
      tr: ElementWithChildren<HTMLTableRowElement>;
      td: ElementWithChildren<HTMLTableCellElement>;
      th: ElementWithChildren<HTMLTableCellElement>;

      // Metadata / scripting
      script: ElementWithChildren<HTMLScriptElement>;
      noscript: ElementWithChildren<HTMLElement>;
      template: ElementWithChildren<HTMLTemplateElement>;

      // Fallback for any other intrinsic element.
      // Specific elements can be added above as needed.
      [elemName: string]: ElementWithChildren<Record<string, unknown>>;
    }

    /**
     * Allow components whose props are made reactive automatically.
     * (This does not change authoring but documents intent.)
     */
    interface ElementChildrenAttribute {
      children: {}; // Enables `children` prop inference.
    }

    // Handle () => props by unwrapping to props.
    type UnwrapGetter<T> = T extends () => infer O ? O : T;
    // Just alias the transformed props; JSX will use this.
    type LibraryManagedAttributes<C, P> = UnwrapGetter<P>;
  }
}
