/**
 * JSX type extensions for the local MiniFramework (fw).
 *
 * Goal:
 * - Allow any prop value to be either its plain value or a function returning that value (Reactive).
 * - Allow children (and any nested child) to be functions to enable reactive updates.
 * - Allow components themselves to return either direct renderables or a function producing renderables.
 *
 * These definitions are intended for usage inside the fw folder and tailor
 * the authoring experience for the custom createElement runtime defined in fw.ts.
 *
 * NOTE:
 * TypeScript global augmentations are project-wide; scoping strictly to a folder
 * is not currently supported. Keep this file colocated with the framework code.
 */

/* eslint-disable @typescript-eslint/consistent-type-definitions */

export {}; // Ensure this file is treated as a module so 'declare global' works.

/**
 * A Reactive<T> allows a value to be provided directly or via a zero-arg function.
 * Functions are evaluated by the framework during update cycles.
 */
type Reactive<T> = T | (() => T) | ((...args: any[]) => T);

/**
 * Primitive values that can appear in the render tree.
 */
type Primitive = string | number | boolean | null | undefined;

/**
 * Renderable represents anything that can appear as a child in JSX for this framework.
 * - DOM Nodes
 * - Primitive values
 * - Arrays of renderables
 * - Functions returning renderables (reactive)
 */
type Renderable =
  | Node
  | Primitive
  | Renderable[]
  | ((...args: any[]) => Renderable | Primitive | Renderable[] | Node | any);

/**
 * Props passed to intrinsic elements:
 * - All props may be reactive.
 * - The special 'style' prop can be an object or reactive object (string also allowed for cssText).
 * - 'children' can be any renderable or array thereof (and reactive).
 */
interface MiniFWIntrinsicElementProps {
  children?: Renderable | Renderable[] | (() => Renderable | Renderable[]);
  style?: Reactive<Record<string, string | number> | string>;
  // Allow any additional attribute / property names to be reactive.
  [prop: string]: unknown;
}

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
  (this: DocumentFragment, props: ComponentProps<P>): Renderable;
}

/**
 * Global JSX namespace augmentation.
 */
declare global {
  namespace JSX {
    /**
     * The Element type encompasses all renderables including functions,
     * to allow returning a function directly from components.
     */
    type Element = Renderable;

    /**
     * IntrinsicElements: every tag name maps to permissive, reactive-capable props.
     * Specific refinement can be added later as needed.
     */
    interface IntrinsicElements {
      [elemName: string]: MiniFWIntrinsicElementProps;
    }

    /**
     * Allow components whose props are made reactive automatically.
     * (This does not change authoring but documents intent.)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ElementChildrenAttribute {
      children: {}; // Enables `children` prop inference.
    }

    /**
     * Optional: Provide a helper to express reactive prop wrapping explicitly.
     */
    type Reactive<T> = T | (() => T) | ((...args: any[]) => T);

    /**
     * Expose the framework component type so users can annotate components explicitly if desired.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Component<P extends Record<string, unknown> = {}> = MiniFWComponent<P>;
  }
}
