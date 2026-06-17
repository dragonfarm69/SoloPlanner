package main

import (
	"log"
	"net/http"

	"github.com/dragonfarm/SoloPlanner/agent"
	"github.com/dragonfarm/SoloPlanner/config"
	"github.com/dragonfarm/SoloPlanner/gateway"
	"github.com/dragonfarm/SoloPlanner/tools"
)

func main() {
	// ── Configuration ─────────────────────────────────────────────────────
	// All values come from environment variables; see config/config.go for
	// the full list and their defaults.
	cfg := config.Load()

	// ── Shared state ──────────────────────────────────────────────────────
	// ConversationStore is the only shared mutable state in the service.
	// It is safe for concurrent use and passed by pointer everywhere.
	history := agent.NewConversationStore()

	// ── Tool registry ─────────────────────────────────────────────────────
	// Register all tools before the orchestrator starts. The registry is
	// read-only after this point, so no locking is needed at runtime.
	registry := tools.NewRegistry()
	tools.NewProjectTools(cfg.JavaBackendURL).RegisterAll(registry)
	tools.NewVectorTools().RegisterAll(registry)

	// ── Orchestrator ──────────────────────────────────────────────────────
	// The orchestrator owns the Ollama client and drives the agent loop.
	orch, err := agent.New(cfg, history, registry)
	if err != nil {
		log.Fatalf("FATAL: failed to initialise orchestrator: %v", err)
	}

	// ── HTTP mux ──────────────────────────────────────────────────────────
	mux := http.NewServeMux()

	// /ws — WebSocket endpoint for the browser (streaming AI chat)
	wsServer := gateway.NewWSServer(orch, history)
	mux.Handle("/ws", wsServer)

	// /health and /admin/* — internal HTTP endpoints for the Java backend
	adminServer := gateway.NewAdminServer(history, cfg)
	adminServer.RegisterRoutes(mux)

	// ── Start server ──────────────────────────────────────────────────────
	addr := ":" + cfg.Port
	log.Printf("AI microservice ready")
	log.Printf("  %-14s ws://localhost%s/ws", "WebSocket:", addr)
	log.Printf("  %-14s http://localhost%s/health", "Health:", addr)
	log.Printf("  %-14s %s  (model: %s)", "Ollama:", cfg.OllamaHost, cfg.OllamaModel)
	log.Printf("  %-14s %s", "Java backend:", cfg.JavaBackendURL)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("FATAL: server exited: %v", err)
	}
}
