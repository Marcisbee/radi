# Radi GO starter

Requires Node.js 22+, Linux amd64 with glibc, Go 1.26.10, Clang 21,
and CGO enabled. Other platforms are not qualified by the Go integration.

Set the compiler environment before building:

```sh
export CC=clang-21 CXX=clang++-21 CGO_CXXFLAGS=-nostdinc++
```

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Set `RADI_ADDR` to change the listening address.

Edit `app.tsx` for components or `main.go` for HTTP handling. Restart `npm run dev` after changes. JavaScript is embedded in the Go binary; Node is only needed to install the Radi package for bundling.

```sh
npm run build
npm start
```

Deploy the `server` binary to the supported Linux target; it needs neither Node nor the source files at runtime. Pin matching Go and npm Radi versions when upgrading.

[Documentation](https://radi.js.org) · [Source](https://github.com/Marcisbee/radi)
