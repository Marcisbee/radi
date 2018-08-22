/* eslint-disable no-restricted-syntax */

// import GLOBALS from '../consts/GLOBALS';
import Component from '../component/Component';
import flatten from '../utils/flatten';
import patch from './patch';
import getElementFromQuery from './utils/getElementFromQuery';
import textNode from './utils/textNode';
import explode from './utils/explode';
import filterNode from './utils/filterNode';
import isComponent from '../component/utils/isComponent';
import Listener from '../listen/Listener';
import setAttributes from './setAttributes';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @param {number} depth
 */
class Structure {
  constructor(query, props = {}, children, depth = 0) {
    // console.log('H', query, children)
    this.query = query;
    this.props = Boolean !== props ? props : {};
    if (isComponent(query) || query instanceof Component) {
      this.$compChildren = flatten(children || []).map(filterNode);
      this.children = [];
    } else {
      this.children = flatten(children || []).map(filterNode);
      this.$compChildren = [];
    }
    this.html = null;
    this.$attrListeners = [];
    this.$styleListeners = [];
    this.$pointer = null;
    this.$component = null;
    this.$listener = null;
    this.$redirect = null;
    this.$destroyed = false;
    this.$isSvg = query === 'svg';
    this.$depth = depth;
  }

  mount() {
    this.$destroyed = false;
    // console.warn('[mounted]', this)

    if (this.$component instanceof Component) {
      this.$component.mount();
    }
  }

  destroy(childrenToo = true) {
    if (this.$destroyed) return false;
    // console.warn('[destroyed]', this, this.html, this.$redirect)

    for (const l in this.$styleListeners) {
      if (this.$styleListeners[l]
        && typeof this.$styleListeners[l].deattach === 'function') {
        this.$styleListeners[l].deattach();
      }
    }

    for (const l in this.$attrListeners) {
      if (this.$attrListeners[l]
        && typeof this.$attrListeners[l].deattach === 'function') {
        this.$attrListeners[l].deattach();
      }
    }

    if (this.$redirect) {
      for (let i = 0; i < this.$redirect.length; i++) {
        if (typeof this.$redirect[i].destroy === 'function') {
          this.$redirect[i].destroy();
        }
      }
    }

    if (childrenToo && this.children) {
      for (let i = 0; i < this.children.length; i++) {
        if (typeof this.children[i].destroy === 'function') {
          this.children[i].destroy();
        }
      }
    }

    if (this.html) {
      const items = this.html;
      for (let i = 0; i < this.html.length; i++) {
        if (items[i].parentNode) {
          const destroyHTML = () => items[i].parentNode.removeChild(items[i]);
          if (typeof items[i].beforedestroy === 'function') {
            items[i].beforedestroy(destroyHTML);
          } else {
            destroyHTML();
          }
        }
      }
    }

    if (this.$component instanceof Component) {
      this.$component.destroy();
    }

    if (this.$listener instanceof Listener) {
      this.$listener.deattach();
    }

    if (this.$pointer && this.$pointer.parentNode) {
      this.$pointer.parentNode.removeChild(this.$pointer);
    }
    this.$pointer = null;
    this.$redirect = null;
    this.$component = null;
    this.render = () => {};
    this.html = null;
    this.$destroyed = true;
    return true;
  }

  render(next, parent, depth = 0, isSvg = false) {
    // console.log('RENDER', isSvg, parent, parent && parent.$isSvg)
    this.$depth = Math.max(this.$depth, depth);
    this.$isSvg = isSvg || (parent && parent.$isSvg) || this.query === 'svg';

    if (this.query === '#text') {
      this.html = [textNode(this.props)];
      return next(this.html);
    }

    if (typeof this.query === 'string' || typeof this.query === 'number') {
      this.html = [getElementFromQuery(this.query, this.$isSvg)];

      setAttributes(this, this.props, {});

      return next(this.html);
    }

    if (this.query instanceof Listener) {
      if (!this.$listener) {
        this.$listener = this.query.applyDepth(this.$depth).init();
        this.mount();
      }
      return this.query.onValueChange(v => {
        if (this.html) {
          const tempParent = this.html[0];

          if (this.$pointer) {
            this.$redirect = patch(this.$redirect, v, this.$pointer,
              true, this.$isSvg, this.$depth + 1);
          } else {
            this.$redirect = patch(this.$redirect, v, tempParent,
              true, this.$isSvg, this.$depth + 1);
          }

          // let a = {
          //   $redirect: [],
          //   children: [],
          // };
          //
          // explode(v, a, output => {
          //   // this.html = output;
          //   if (this.$pointer) {
          //     this.$redirect = patch(this.$redirect, a.$redirect,
          // this.$pointer, true, this.$isSvg, this.$depth + 1);
          //   } else {
          //     this.$redirect = patch(this.$redirect, a.$redirect,
          // tempParent, true, this.$isSvg, this.$depth + 1);
          //   }
          //   // next(output);
          // }, this.$depth + 1, this.$isSvg);
        } else {
          explode(v, parent || this, output => {
            // console.warn('change HTML', this.html)
            this.html = output;
            next(output);
          }, this.$depth + 1, this.$isSvg);
        }
      });
    }

    if (this.query instanceof Promise
      || this.query.constructor.name === 'LazyPromise') {
      return this.query.then(v => {
        const normalisedValue = v.default || v;
        explode(normalisedValue, parent || this, output => {
          this.html = output;
          next(output);
        }, this.$depth, this.$isSvg);
      });
    }

    if (this.query instanceof Component
      && typeof this.query.render === 'function') {
      this.$component = this.query;
      return explode(this.$component.render(), parent || this, v => {
        this.html = v;
        next(v);
        this.mount();
      }, this.$depth, this.$isSvg);
    }

    if (isComponent(this.query)) {
      if (!this.$component) {
        this.$component =
          new this.query(this.$compChildren).setProps(this.props); // eslint-disable-line
      }
      if (typeof this.$component.render === 'function') {
        explode(this.$component.render(), parent || this, v => {
          this.html = v;
          next(v);
        }, this.$depth, this.$isSvg);
        this.mount();
      }
      return null;
    }

    if (typeof this.query === 'function') {
      return explode(this.query(this.props), parent || this, v => {
        this.html = v;
        next(v);
      }, this.$depth, this.$isSvg);
    }

    return next(textNode(this.query));
  }

  isStructure() {
    return true;
  }
}

export default Structure;
