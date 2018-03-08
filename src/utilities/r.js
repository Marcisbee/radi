import { isString } from "../index";
import { memoizeHTML } from "./memoizeHTML";
import { isNode } from "../index";
import { radiArgs } from "../index";
import { GLOBALS } from "../consts/GLOBALS";

export function r(query) {
  // TODO: just use .slice(1)
  var args = [],
    len = arguments.length - 1;
  while (len-- > 0) args[len] = arguments[len + 1];

  var element;

  if (isString(query)) {
    if (typeof GLOBALS.REGISTERED[query] !== "undefined") {
      // TODO: Make props and childs looped,
      // aka don't assume that first obj are props
      var props = args[0] || {};
      return (element = new GLOBALS.REGISTERED[query]().props(props));
    } else {
      element = memoizeHTML(query).cloneNode(false);
    }
  } else if (isNode(query)) {
    element = query.cloneNode(false);
  } else {
    element = document.createDocumentFragment();
  }

  element.key = GLOBALS.R_KEYS;
  GLOBALS.R_KEYS += 1;

  radiArgs.call(this, element, args);

  return element;
}

r.extend = function(query) {
  // TODO: just use .slice(1)
  var args = [],
    len = arguments.length - 1;
  while (len-- > 0) args[len] = arguments[len + 1];

  var clone = memoizeHTML(query);

  return r.bind.apply(r, [this, clone].concat(args));
};
