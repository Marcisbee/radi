// import Component from '../component/Component';
import GLOBALS from '../consts/GLOBALS';
import flatten from '../utils/flatten';
import filterNode from './utils/filterNode';
import Structure from './Structure';
import patch from './patch';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {object}
 */
const r = (query, props, ...children) => {
  if (typeof GLOBALS.CUSTOM_TAGS[query] !== 'undefined') {
    return GLOBALS.CUSTOM_TAGS[query].onmount(
      props || {},
      (children && flatten([children]).map(filterNode)) || [],
      filterNode,
      v => (GLOBALS.CUSTOM_TAGS[query].saved = v),
    ) || null;
  }

  if (query === 'await') {
    let output = null;

    if (props.src && props.src instanceof Promise) {
      props.src.then(v => {
        const nomalizedData = filterNode(
          typeof props.transform === 'function'
            ? props.transform(v)
            : v
        );

        if (output) {
          output = patch(output, nomalizedData, output.html[0].parentNode);
        } else {
          output = nomalizedData;
        }
      }).catch(error => {
        const placerror = filterNode(
          typeof props.error === 'function'
            ? props.error(error)
            : props.error
        );

        if (output) {
          output = patch(output, placerror, output.html[0].parentNode);
        } else {
          output = placerror;
        }
      });
    }

    if (!output) {
      output = filterNode(props.placeholder);
    }

    return output;
  }

  if (query === 'template') {
    // return flatten([children]).map(filterNode);
    return new Structure('section', props, flatten([children]).map(filterNode));
  }

  return new Structure(query, props, flatten([children]).map(filterNode));
};

export default r;
