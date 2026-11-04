package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func testProxy(baseURL, key string) proxy {
	return proxy{
		key:     key,
		baseURL: baseURL,
		client:  &http.Client{Timeout: time.Second},
		now:     func() time.Time { return time.Date(2026, 11, 4, 12, 0, 0, 0, time.UTC) },
	}
}

func TestProxyForwardsAllowedEvents(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/FLR" || r.URL.Query().Get("api_key") != "test-key" ||
			r.URL.Query().Get("startDate") != "2026-10-06" || r.URL.Query().Get("endDate") != "2026-11-04" {
			t.Errorf("Unexpected upstream request")
		}
		fmt.Fprint(w, `[{"flrID":"flare","beginTime":"2026-11-01T12:00Z","classType":"M1.2"}]`)
	}))
	defer upstream.Close()

	response := httptest.NewRecorder()
	testProxy(upstream.URL, "test-key").ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/events?type=FLR&range=30d", nil))
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"flrID"`) ||
		strings.Contains(response.Body.String(), "test-key") {
		t.Fatalf("Unexpected proxy response: %d %s", response.Code, response.Body.String())
	}
}

func TestProxyRejectsInvalidRequestsAndMissingKey(t *testing.T) {
	tests := []struct {
		method, path, key string
		status            int
	}{
		{http.MethodGet, "/api/events?type=FLR&range=30d", "", http.StatusServiceUnavailable},
		{http.MethodGet, "/api/events?type=other&range=30d", "test-key", http.StatusBadRequest},
		{http.MethodGet, "/api/events?type=FLR&range=30d&api_key=other", "test-key", http.StatusBadRequest},
		{http.MethodGet, "/api/events?type=FLR&type=GST&range=30d", "test-key", http.StatusBadRequest},
		{http.MethodPost, "/api/events?type=FLR&range=30d", "test-key", http.StatusMethodNotAllowed},
		{http.MethodGet, "/other", "test-key", http.StatusNotFound},
	}
	for _, tt := range tests {
		t.Run(tt.path+tt.method, func(t *testing.T) {
			response := httptest.NewRecorder()
			testProxy("http://unused", tt.key).ServeHTTP(response, httptest.NewRequest(tt.method, tt.path, nil))
			if response.Code != tt.status || (tt.key != "" && strings.Contains(response.Body.String(), tt.key)) {
				t.Fatalf("Unexpected status or exposed key: %d %s", response.Code, response.Body.String())
			}
		})
	}
}

func TestProxyHandlesUpstreamErrorsAndMalformedData(t *testing.T) {
	tests := []struct {
		status int
		body   string
		want   int
	}{
		{http.StatusTooManyRequests, "test-key", http.StatusTooManyRequests},
		{http.StatusForbidden, "test-key", http.StatusBadGateway},
		{http.StatusOK, `{"error":"test-key"}`, http.StatusBadGateway},
		{http.StatusOK, `null`, http.StatusBadGateway},
		{http.StatusOK, `[]`, http.StatusOK},
	}
	for _, tt := range tests {
		t.Run(fmt.Sprintf("%d-%s", tt.status, tt.body), func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(tt.status)
				fmt.Fprint(w, tt.body)
			}))
			defer upstream.Close()
			response := httptest.NewRecorder()
			testProxy(upstream.URL, "test-key").ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/events?type=GST&range=7d", nil))
			if response.Code != tt.want || strings.Contains(response.Body.String(), "test-key") {
				t.Fatalf("Unexpected status or exposed key: %d %s", response.Code, response.Body.String())
			}
			if tt.status == http.StatusForbidden && !strings.Contains(response.Body.String(), "NASA API returned HTTP 403") {
				t.Fatal("Upstream status was not reported")
			}
		})
	}
}

func TestProxyHandlesConnectionFailure(t *testing.T) {
	response := httptest.NewRecorder()
	testProxy("http://127.0.0.1:0", "qFbDWpgLCH7gbgTWMghDL8GrWf8TmJmtCrDLrpJp").ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/events?type=CME&range=1y", nil))
	if response.Code != http.StatusBadGateway || strings.Contains(response.Body.String(), "qFbDWpgLCH7gbgTWMghDL8GrWf8TmJmtCrDLrpJp") {
		t.Fatalf("Unexpected status or exposed key: %d %s", response.Code, response.Body.String())
	}
}
