//go:build ignore

package main

import (
	"os"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"client.ts"}, Outdir: "assets", Bundle: true,
		Write: true, Splitting: true, Format: api.FormatESModule,
		Platform: api.PlatformBrowser, Target: api.ES2022, MinifyWhitespace: true,
		TsconfigRaw: `{}`, LogLevel: api.LogLevelInfo,
	})
	if len(result.Errors) > 0 {
		os.Exit(1)
	}
	css, err := os.ReadFile("style.css")
	if err != nil {
		panic(err)
	}
	if err = os.WriteFile("assets/style.css", css, 0644); err != nil {
		panic(err)
	}
}
