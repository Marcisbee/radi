package main

import (
	"context"
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	radi "github.com/Marcisbee/radi/go"
)

//go:generate go run ../../cmd/radi-build -entry app.tsx -out app.js -radi ../..
//go:generate go run build.go
//go:embed app.js
var source string

//go:embed assets
var assets embed.FS

type page struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Visits int    `json:"visits"`
}

func main() {
	var mu sync.Mutex
	pages := map[string]page{"home": {ID: "home", Title: "Home"}, "about": {ID: "about", Title: "About"}}
	renderer, err := radi.New(radi.Config{Source: source, Queue: 8, Operations: map[string]radi.Operation{
		"page": func(ctx context.Context, input json.RawMessage) (any, error) {
			var args struct {
				ID string `json:"id"`
			}
			if err := json.Unmarshal(input, &args); err != nil {
				return nil, err
			}
			mu.Lock()
			defer mu.Unlock()
			return pages[args.ID], ctx.Err()
		},
	}})
	if err != nil {
		log.Fatal(err)
	}
	mux := http.NewServeMux()
	files, err := fs.Sub(assets, "assets")
	if err != nil {
		log.Fatal(err)
	}
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServerFS(files)))
	mux.HandleFunc("/api/pages/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		if r.Method != "GET" && r.Method != "POST" {
			w.Header().Set("Allow", "GET, POST")
			writeError(w, 405, "Method not allowed")
			return
		}
		if r.Method == "POST" {
			origin, err := url.Parse(r.Header.Get("Origin"))
			if err != nil || origin.Host != r.Host || (origin.Scheme != "http" && origin.Scheme != "https") {
				writeError(w, 403, "Invalid origin")
				return
			}
		}
		mu.Lock()
		defer mu.Unlock()
		value, ok := pages[r.PathValue("id")]
		if !ok {
			writeError(w, 404, "Page not found")
			return
		}
		if r.Method == "POST" {
			value.Visits++
			pages[value.ID] = value
		}
		json.NewEncoder(w).Encode(value)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		id := ""
		if r.URL.Path == "/" {
			id = "home"
		} else if strings.HasPrefix(r.URL.Path, "/pages/") {
			id = strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/pages/"), "/")
		}
		mu.Lock()
		_, ok := pages[id]
		mu.Unlock()
		if !ok {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		renderer.ServeHTTP(w, r)
	})
	addr := os.Getenv("RADI_ADDR")
	if addr == "" {
		addr = "127.0.0.1:4321"
	}
	server := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		log.Printf("Routing example at http://%s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Print(err)
			stop()
		}
	}()
	<-ctx.Done()
	shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdown); err != nil {
		server.Close()
	}
	if err := renderer.Close(shutdown); err != nil {
		log.Print(err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
