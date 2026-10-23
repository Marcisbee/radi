# Radi SSR starter

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Set `PORT` to change the port.

Edit `app.tsx` for the page or `server.tsx` for HTTP handling. Restart `npm run dev` after changes. HTML is rendered per request; this starter sends no browser JavaScript.

```sh
npm run build
npm start
```

Deploy `dist/`, `package.json`, and `package-lock.json`; run `npm ci --omit=dev` and `npm start` behind your HTTP proxy.

[Documentation](https://radi.js.org) · [Source](https://github.com/Marcisbee/radi)
