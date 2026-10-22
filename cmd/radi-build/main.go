// radi-build bundles a TSX entry point for the embedded Go server.
package main

import (
	"flag"
	"os"
	"path/filepath"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	entry := flag.String("entry", "app.tsx", "TSX entry exporting app from defineApp")
	out := flag.String("out", "app.js", "output JavaScript source")
	root := flag.String("radi", "", "Radi source checkout (otherwise resolve installed radi package)")
	flag.Parse()
	aliases := map[string]string{}
	if *root != "" {
		path, err := filepath.Abs(*root)
		if err != nil {
			panic(err)
		}
		aliases["radi/go"] = filepath.Join(path, "src/go.ts")
		aliases["radi/server"] = filepath.Join(path, "src/server.ts")
		aliases["radi/server/jsx-runtime"] = filepath.Join(path, "src/server/jsx-runtime.ts")
	}
	result := api.Build(api.BuildOptions{EntryPoints: []string{*entry}, Outfile: *out, Bundle: true, Write: true, Format: api.FormatIIFE, GlobalName: "Radi", Platform: api.PlatformNeutral, Target: api.ES2022, TsconfigRaw: `{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "radi/server" } }`, JSX: api.JSXAutomatic, JSXImportSource: "radi/server", Alias: aliases, LogLevel: api.LogLevelInfo})
	if len(result.Errors) > 0 {
		os.Exit(1)
	}
}
