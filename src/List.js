export default class List {
  constructor(radiInstance, data, act) {
    this.radiInstance = radiInstance;
    this.data = data;
    this.act = act;
  }

  create() {
    const { radiInstance, data, act } = this;
    if (!data) return '';
    let link;
    const fragment = document.createDocumentFragment();
    const toplink = EMPTY_NODE.cloneNode();

    fragment.appendChild(toplink);

    const cache = data.source[data.prop] || [];
    const cacheLen = cache.length || 0;

    if (Array.isArray(cache)) {
      for (let i = 0; i < cacheLen; i++) {
        fragment.appendChild(act.call(radiInstance, cache[i], i));
      }
    } else {
      let i = 0;
      for (const key in cache) {
        fragment.appendChild(act.call(radiInstance, cache[key], key, i));
        i++;
      }
    }

    link = fragment.lastChild;

    const w = (a, b) => {
      if (a === 0) return;
      if (a > 0) {
        const len = b.length;
        const start = len - a;
        for (let i = start; i < len; i++) {
          fragment.appendChild(act.call(radiInstance, b[i], i));
        }
        const temp = fragment.lastChild;
        link.parentElement.insertBefore(fragment, link.nextSibling);
        link = temp;
        return;
      }
      for (let i = 0; i < Math.abs(a); i++) {
        const templink = link.previousSibling;
        link.parentElement.removeChild(link);
        link = templink;
      }
    };

    if (cache.__path) {
      let len = cacheLen;
      radiInstance.$eventService.on(cache.__path, (e, v) => {
        w(v.length - len, v);
        len = v.length;
      });
    }

    return fragment;
  }
}
