package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/dragonfarm/SoloPlanner/agent"
	"github.com/dragonfarm/SoloPlanner/config"
	"github.com/dragonfarm/SoloPlanner/gateway"
	pb "github.com/dragonfarm/SoloPlanner/proto"
	"github.com/dragonfarm/SoloPlanner/tools"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
)

// connectToAIEventStream opens a long-lived gRPC server-streaming call to the
// Java backend and processes incoming AIEvent messages.
//
// It retries on any error with a 5-second backoff so the service is resilient
// to Java backend restarts. gRPC keepalive handles silent dead-connection
// detection at the transport layer — no application-level heartbeat needed.
func connectToAIEventStream(client pb.ProjectGrpcServiceClient, orch *agent.Orchestrator) {
	for {
		log.Println("[gRPC] Opening AI event stream...")

		// A cancellable context lets us tear down the stream cleanly if needed.
		ctx, cancel := context.WithCancel(context.Background())

		stream, err := client.SubscribeAIEvents(ctx, &pb.AIEventSubscribeRequest{})
		if err != nil {
			log.Printf("[gRPC] Failed to open AI event stream: %v — retrying in 5s", err)
			cancel()
			time.Sleep(5 * time.Second)
			continue
		}

		log.Println("[gRPC] AI event stream connected — waiting for events")

		for {
			event, err := stream.Recv()
			if err != nil {
				log.Printf("[gRPC] AI event stream closed: %v — reconnecting in 5s", err)
				break
			}
			log.Printf("[gRPC] AI event received: project=%s user=%s content=%q",
				event.GetProjectId(), event.GetUserId(), event.GetContent())

			// TODO: pass event to the orchestrator/agent loop.
			// Example: orch.HandleAIEvent(event.GetProjectId(), event.GetUserId(), event.GetContent())
			_ = orch
		}

		cancel()
		time.Sleep(5 * time.Second)
	}
}

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
	projectTools, err := tools.NewProjectTools(cfg.GrpcBackendAddr)
	if err != nil {
		log.Fatalf("FATAL: failed to connect to Java gRPC backend: %v", err)
	}
	projectTools.RegisterAll(registry)
	vectorTools, err := tools.NewVectorTools(cfg.QdrantAddr)
	if err != nil {
		log.Fatalf("FATAL: failed to connect to Qdrant: %v", err)
	}
	vectorTools.RegisterAll(registry)

	if err := vectorTools.EnsureCollection(context.Background()); err != nil {
		log.Printf("Warning: could not ensure Qdrant collection: %v", err)
	}

	// ── Orchestrator ──────────────────────────────────────────────────────
	// The orchestrator owns the Ollama client and drives the agent loop.
	orch, err := agent.New(cfg, history, registry, vectorTools)
	if err != nil {
		log.Fatalf("FATAL: failed to initialise orchestrator: %v", err)
	}

	// ── gRPC event stream ─────────────────────────────────────────────────
	// Open a dedicated gRPC connection for the long-lived streaming call.
	// Keepalive ensures the transport detects dead connections within ~15s
	// without any application-level heartbeat code.
	streamConn, err := grpc.NewClient(
		cfg.GrpcBackendAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                300 * time.Second, // send keepalive ping every 300s of inactivity
			Timeout:             5 * time.Second,   // wait 5s for pong before declaring connection dead
			PermitWithoutStream: false,             // no active RPCs, don't ping
		}),
	)
	if err != nil {
		log.Fatalf("FATAL: failed to create gRPC stream connection: %v", err)
	}
	streamClient := pb.NewProjectGrpcServiceClient(streamConn)
	go connectToAIEventStream(streamClient, orch)

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
	log.Printf("  %-14s %s (REST)", "Java backend:", cfg.JavaBackendURL)
	log.Printf("  %-14s %s (gRPC)", "Java gRPC:", cfg.GrpcBackendAddr)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("FATAL: server exited: %v", err)
	}
}
