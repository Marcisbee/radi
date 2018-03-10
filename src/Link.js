export default class Link {
  constructor(radiInstance, fn, watch, text) {
    this.radiInstance = radiInstance;
    this.fn = fn;
    this.watch = watch;
    this.text = text;
  }

  init() {
    const { radiInstance, fn, watch, text } = this;
    const args = {
      s: null, a: [], t: [], f: fn.toString(),
    };

    if (
      txt.length === 1 &&
      fn
        .toString()
        .replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
        .trim() === txt[0]
    ) {
      return new Watchable(watch[0][0], watch[0][1], () => radiInstance);
    }

    const len = watch.length;

    args.s = fn.call(radiInstance);
    args.a = new Array(len);
    args.t = new Array(len);
    args.__path = `$link-${linkNum}`;
    Link.linkNum++;

    for (let i = 0; i < len; i++) {
      const radiInstance = watch[i][0];
      const field = watch[i][1];
      args.a[i] = radiInstance[field];
      args.t[i] = `$rdi[${i}]`;
      args.f = args.f.replace(txt[i], args.t[i]);

      const path = `${radiInstance.__path}.${field}`;
      const p = `${args.__path}.s`;

      radiInstance.$eventService.on(path, (path, value) => {
        args.a[i] = value;
        const cache = args.f.call(radiInstance, args.a);

        if (args.s !== cache) {
          args.s = cache;
          radiInstance.$eventService.emit(p, args.s);
        }
      });
    }

    args.f = new Function('$rdi', 'return ' + args.f + '();')

    if (len <= 0) return args.s;
    return new Watchable(args, 's', () => radiInstance);
  };
}

Link.linkNum = 0;
