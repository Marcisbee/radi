/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
// import fuseDom from '../r/utils/fuseDom';

export default class Listener {
  /**
   * @param {Component} component
   * @param {...string} path
   */
  constructor(component, ...path) {
    this.component = component;
    [this.key] = path;
    this.path = path.slice(1, path.length);
    this.depth = 0;
    this.attached = true;
    this.processValue = value => value;
    this.changeListener = () => {};
    this.addedListeners = [];
  }

  /**
   * Applies values and events to listener
   */
  init() {
    this.value = this.getValue(this.component.state[this.key]);
    this.component.addListener(this.key, this, this.depth);
    this.handleUpdate(this.component.state[this.key]);
    return this;
  }

  /**
   * Removes last active value with destroying listeners and
   * @param {*} value
   */
  unlink() {
    if (this.value instanceof Node) {
      // Destroy this Node
      // fuseDom.destroy(this.value);
    } else
    if (this.value instanceof Listener) {
      // Deattach this Listener
      this.value.deattach();
    }
  }


  clone(target, source) {
    const out = {};

    for (const i in target) {
      out[i] = target[i];
    }
    for (const i in source) {
      out[i] = source[i];
    }

    return out;
  }

  setPartialState(path, value, source) {
    const target = {};
    if (path.length) {
      target[path[0]] =
        path.length > 1
          ? this.setPartialState(path.slice(1), value, source[path[0]])
          : value;
      return this.clone(source, target);
    }
    return value;
  }

  /**
   * Updates state value
   * @param {*} value
   */
  updateValue(value) {
    const source = this.component.state[this.key];
    return this.component.setState({
      [this.key]: this.setPartialState(this.path, value, source),
    });
  }

  extractListeners(value) {
    // if (this.value instanceof Listener && value instanceof Listener) {
    //   console.log('middle')
    // } else
    if (value instanceof Listener) {
      // if (this.value instanceof Listener) {
      //   this.value.processValue = value.processValue;
      //   // this.value = value;
      // this.handleUpdate(value.getValue(value.component.state[value.key]));
      // console.log(value, value.getValue(value.component.state[value.key]));
      // value.deattach();
      // }
      // value.component.addListener(value.key, value, value.depth);
      // value.handleUpdate = () => {
      //   console.log('inner handler')
      // }
      const tempListener = {
        depth: value.depth,
        attached: true,
        processValue: value => value,
        handleUpdate: () => {
          if (this.component) {
            this.handleUpdate(this.getValue(this.component.state[this.key]));
          }
          tempListener.attached = false;
        },
        changeListener: () => {},
      };
      this.addedListeners.push(tempListener);
      value.component.addListener(value.key, tempListener, value.depth);
      // value.init()
      // value.handleUpdate = () => {
      //   console.log('inner handler')
      // }
      // value.onValueChange((v) => {
      //   this.handleUpdate(this.getValue(this.component.state[this.key]));
      //   console.log('me got changed', v)
      // });
      const newValue = value.processValue(
        value.getValue(value.component.state[value.key])
      );
      value.deattach();
      return this.extractListeners(newValue);
    }
    return value;

    // return this.processValue(this.getValue(value));
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    const newValue = this.processValue(this.getValue(value));
    // if (this.value instanceof Listener && newValue instanceof Listener) {
    //   this.value.processValue = newValue.processValue;
    //   // this.value = newValue;
    //   this.value.handleUpdate(newValue.component.state[newValue.key]);
    //   console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
    //   newValue.deattach();
    // } else
    if (newValue instanceof Listener) {
      // if (this.value instanceof Listener) {
      //   this.value.processValue = newValue.processValue;
      //   // this.value = newValue;
      //   this.value.handleUpdate(newValue.component.state[newValue.key]);
      //   console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
      //   newValue.deattach();
      // } else {
      for (let i = 0; i < this.addedListeners.length; i++) {
        this.addedListeners[i].attached = false;
      }
      this.addedListeners = [];
      this.value = this.extractListeners(newValue);
      this.changeListener(this.value);
      // }
      // // console.log(this.value.processValue('P'), newValue.processValue('A'));
      // // console.log(this.extractListeners(newValue));
      // // newValue.handleUpdate(newValue.component.state[newValue.key]);
      // // this.value = newValue;
      // // this.value.processValue = newValue.processValue;
      // this.value = this.extractListeners(newValue);
      // this.changeListener(this.value);
      // // this.value.processValue = newValue.processValue;
      // // // this.value = newValue;
      // // this.value.handleUpdate(newValue.component.state[newValue.key]);
      // // console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
      // // newValue.deattach();
    } else {
      this.unlink();
      this.value = newValue;
      this.changeListener(this.value);
    }
  }

  /**
   * @param {*} source
   * @returns {*}
   */
  getValue(source) {
    let i = 0;
    while (i < this.path.length) {
      if (source === null
        || (!source[this.path[i]]
        && typeof source[this.path[i]] !== 'number')) {
        source = null;
      } else {
        source = source[this.path[i]];
      }
      i += 1;
    }
    return source;
  }

  /**
   * @param {number} depth
   * @returns {Listener}
   */
  applyDepth(depth) {
    this.depth = depth;
    return this;
  }

  /**
   * @param {function(*)} changeListener
   */
  onValueChange(changeListener) {
    this.changeListener = changeListener;
    this.changeListener(this.value);
  }

  /**
   * @param {function(*): *} processValue
   * @returns {function(*): *}
   */
  process(processValue) {
    this.processValue = processValue;
    return this;
  }

  deattach() {
    this.component = null;
    this.attached = false;
    this.key = null;
    this.childPath = null;
    this.path = null;
    this.unlink();
    this.value = null;
    this.changeListener = () => {};
    this.processValue = () => {};
  }
}
