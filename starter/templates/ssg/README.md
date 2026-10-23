# Radi SSG starter

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Set `PORT` to change the port.

Edit `pages.tsx` to add pages. Restart `npm run dev` after changes to regenerate them. Both `/` and `/about/` are static HTML with no JavaScript.

```sh
npm run build
npm start
```

Deploy `dist/` to a static host with directory indexes. Asset URLs assume deployment at the domain root. `npm start` is a local preview.

[Documentation](https://radi.js.org) · [Source](https://github.com/Marcisbee/radi)
