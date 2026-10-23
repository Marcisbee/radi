export const devtoolsHook: {
  render?: (node: Node, phase: 'mount' | 'update') => (() => void) | undefined;
} = {};
