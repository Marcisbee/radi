import mount from '../mount';

const getLast = (child) => {
  if (child.$redirect && child.$redirect[child.$redirect.length - 1]) {
    return getLast(child.$redirect[child.$redirect.length - 1]);
  }

  // if (child.children && child.children.length > 0) {
  //   return child.children;
  // }

  return child;
};

/**
 * @param {Structure} child
 */
const mountChildren = (child, isSvg, depth = 0) => {
  if (!child) return;

  if (child.$redirect && child.$redirect.length > 0) {
    mountChildren(getLast(child), isSvg, depth + 1);
  } else if (child.children && child.children.length > 0) {
    if (child.html && child.html.length === 1) {
      mount(child.children,
        child.html[0],
        child.html[0].nodeType !== 1,
        child.$isSvg,
        child.$depth);
    } else {
      mount(child.children,
        child.$pointer,
        true,
        child.$isSvg,
        child.$depth);
    }
  }
};

export default mountChildren;
