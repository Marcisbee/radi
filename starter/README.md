# Create Radi

Create a Radi project with Node.js 22+:

```sh
npm create radi@latest -- my-app --template spa
cd my-app
npm install
npm run dev
```

Choose `spa`, `ssr`, `ssg`, or `go`. Open http://127.0.0.1:3000.
The Go template also requires Linux amd64 with glibc, Go 1.26.10, Clang 21,
and CGO enabled; follow its generated README before building.

The generator refuses nonempty destinations and does not install dependencies
automatically. Each generated README describes editing and deployment.

[Documentation](https://radi.js.org) · [Source](https://github.com/Marcisbee/radi)
