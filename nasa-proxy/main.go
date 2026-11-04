package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const maxResponseBytes = 50 << 20

type proxy struct {
	key     string
	baseURL string
	client  *http.Client
	now     func() time.Time
}

func (p proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if r.URL.Path != "/api/events" {
		http.NotFound(w, r)
		return
	}
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, "Method not allowed.", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query()
	eventTypes := map[string]bool{"FLR": true, "GST": true, "CME": true}
	ranges := map[string]int{"7d": 7, "30d": 30, "90d": 90, "1y": 365}
	if len(query) != 2 || len(query["type"]) != 1 || len(query["range"]) != 1 ||
		!eventTypes[query.Get("type")] || ranges[query.Get("range")] == 0 {
		http.Error(w, "Invalid event type or date range.", http.StatusBadRequest)
		return
	}
	if p.key == "" {
		http.Error(w, "NASA API key is not configured on the server.", http.StatusServiceUnavailable)
		return
	}

	end := p.now().UTC()
	params := url.Values{
		"api_key":   {p.key},
		"startDate": {end.AddDate(0, 0, 1-ranges[query.Get("range")]).Format("2006-01-02")},
		"endDate":   {end.Format("2006-01-02")},
	}
	request, err := http.NewRequestWithContext(r.Context(), http.MethodGet,
		p.baseURL+"/"+query.Get("type")+"?"+params.Encode(), nil)
	if err != nil {
		log.Print("Could not construct NASA request")
		http.Error(w, "Unable to contact NASA.", http.StatusBadGateway)
		return
	}
	response, err := p.client.Do(request)
	if err != nil {
		if !errors.Is(err, r.Context().Err()) {
			log.Print("NASA request failed")
		}
		http.Error(w, "Unable to contact NASA. Please try again later.", http.StatusBadGateway)
		return
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		log.Printf("NASA returned HTTP %d", response.StatusCode)
		if response.StatusCode == http.StatusTooManyRequests {
			http.Error(w, "NASA API rate limit reached. Please try again later.", http.StatusTooManyRequests)
		} else {
			http.Error(w, fmt.Sprintf("NASA API returned HTTP %d. Check the server configuration or try again later.", response.StatusCode), http.StatusBadGateway)
		}
		return
	}

	body, err := io.ReadAll(io.LimitReader(response.Body, maxResponseBytes+1))
	if err != nil || len(body) > maxResponseBytes {
		log.Print("Could not read NASA response")
		http.Error(w, "Unable to read NASA data.", http.StatusBadGateway)
		return
	}
	var events []json.RawMessage
	if err := json.Unmarshal(body, &events); err != nil || events == nil {
		log.Print("NASA returned an invalid event list")
		http.Error(w, "NASA returned invalid event data.", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(body); err != nil {
		log.Print("Could not send NASA response")
	}
}

func main() {
	key := "qFbDWpgLCH7gbgTWMghDL8GrWf8TmJmtCrDLrpJp"
	if key == "" {
		log.Print("NASA_API_KEY is not configured; NASA requests will return HTTP 503")
	}
	handler := proxy{
		key:     key,
		baseURL: "https://api.nasa.gov/DONKI",
		client: &http.Client{
			Timeout: 60 * time.Second,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		now: time.Now,
	}
	server := &http.Server{
		Addr:              ":8080",
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Print("NASA proxy listening on port 8080")
	log.Fatal(server.ListenAndServe())
}
