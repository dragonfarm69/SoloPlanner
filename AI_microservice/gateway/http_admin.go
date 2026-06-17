package gateway

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/dragonfarm/SoloPlanner/agent"
	"github.com/dragonfarm/SoloPlanner/config"
)

// AdminServer exposes internal HTTP endpoints that the Java backend calls for
// administrative operations. All /admin/* routes are protected by a shared
// secret header so they cannot be called by untrusted clients.
type AdminServer struct {
	history *agent.ConversationStore
	secret  string
}

// NewAdminServer creates an AdminServer.
func NewAdminServer(history *agent.ConversationStore, cfg *config.Config) *AdminServer {
	return &AdminServer{history: history, secret: cfg.InternalSecret}
}

// RegisterRoutes attaches all admin routes to the given ServeMux.
// Call this once at startup, before starting the HTTP server.
func (a *AdminServer) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", a.handleHealth)
	mux.HandleFunc("/admin/sessions/", a.requireSecret(a.handleClearSession))
}

// handleHealth responds 200 OK with a simple JSON body.
// Java polls this endpoint to confirm the AI service is ready before routing
// any chat traffic to it.
//
// GET /health
func (a *AdminServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// handleClearSession removes the conversation history for the specified session,
// effectively giving the user a blank-slate context on their next message.
// Java calls this when it detects a user explicitly resets the AI chat.
//
// DELETE /admin/sessions/{sessionId}
func (a *AdminServer) handleClearSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := strings.TrimPrefix(r.URL.Path, "/admin/sessions/")
	if sessionID == "" {
		http.Error(w, "sessionId is required in path", http.StatusBadRequest)
		return
	}

	a.history.Clear(sessionID)
	log.Printf("[admin] cleared conversation history for session=%s", sessionID)
	w.WriteHeader(http.StatusNoContent)
}

// requireSecret is a middleware that checks the X-Internal-Secret header.
// Returns 401 Unauthorized if the header is absent or does not match the
// configured secret value.
func (a *AdminServer) requireSecret(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Internal-Secret") != a.secret {
			http.Error(w, "unauthorized — missing or incorrect X-Internal-Secret header", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
