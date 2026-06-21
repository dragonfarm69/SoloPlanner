package gateway

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/dragonfarm/SoloPlanner/agent"
	"github.com/gorilla/websocket"
)

// WebSocket configuration constants.
const (
	writeTimeout    = 10 * time.Second // max time to write a single frame
	pongWait        = 60 * time.Second // max time between pongs from the client
	pingInterval    = 50 * time.Second // how often the server sends pings
	maxMessageBytes = 32 * 1024        // max inbound message size (32 KB)
	tokenBufSize    = 256              // channel buffer for streaming tokens
	chatTimeout     = 5 * time.Minute  // max total time to produce one AI response
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 4096,
	// Auth is intentionally omitted here — the Java backend validates the
	// user's JWT before the frontend is even shown the AI chat UI. This
	// service is on a trusted internal network.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ── Wire protocol (browser ↔ Go) ──────────────────────────────────────────────

// chatRequest is the JSON the browser sends when the user types a message.
type chatRequest struct {
	Type      string `json:"type"`      // must be "chat"
	UserID    string `json:"userId"`    // Keycloak UUID of the logged-in user
	ProjectID string `json:"projectId"` // optional: UUID of the currently open project
	Message   string `json:"message"`   // the user's text
}

// wsEvent is one WebSocket frame sent from Go to the browser.
//
//	type "token"  — one streaming chunk; chunk field contains the text fragment
//	type "done"   — AI response complete; fullText has the assembled answer
//	type "error"  — something went wrong; message field explains what
type wsEvent struct {
	Type     string `json:"type"`
	Chunk    string `json:"chunk,omitempty"`
	FullText string `json:"fullText,omitempty"`
	Message  string `json:"message,omitempty"`
}

// ── connWriter ────────────────────────────────────────────────────────────────

// connWriter serialises all WebSocket writes through a mutex.
// gorilla/websocket requires that at most one goroutine writes at a time;
// this type makes it safe to write from both the ping goroutine and the
// message-handling goroutine concurrently.
type connWriter struct {
	mu   sync.Mutex
	conn *websocket.Conn
}

func newConnWriter(conn *websocket.Conn) *connWriter {
	return &connWriter{conn: conn}
}

// writeJSON marshals v and sends it as a WebSocket text frame.
func (cw *connWriter) writeJSON(v any) error {
	cw.mu.Lock()
	defer cw.mu.Unlock()
	cw.conn.SetWriteDeadline(time.Now().Add(writeTimeout))
	return cw.conn.WriteJSON(v)
}

// ping sends a WebSocket ping frame to check whether the client is still alive.
func (cw *connWriter) ping() error {
	cw.mu.Lock()
	defer cw.mu.Unlock()
	cw.conn.SetWriteDeadline(time.Now().Add(writeTimeout))
	return cw.conn.WriteMessage(websocket.PingMessage, nil)
}

// ── WSServer ──────────────────────────────────────────────────────────────────

// WSServer upgrades HTTP connections to WebSocket and dispatches chat messages
// to the Orchestrator. It is the only component that knows about WebSocket
// framing — all AI logic lives in the agent package.
type WSServer struct {
	orchestrator *agent.Orchestrator
	history      *agent.ConversationStore
}

// NewWSServer creates a WSServer. Both arguments must be non-nil.
func NewWSServer(orch *agent.Orchestrator, history *agent.ConversationStore) *WSServer {
	return &WSServer{orchestrator: orch, history: history}
}

// ServeHTTP upgrades the incoming request to a WebSocket connection and starts
// the per-connection goroutine. Register this at "/ws" in main.
func (s *WSServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[ws] upgrade failed from %s: %v", r.RemoteAddr, err)
		return
	}
	log.Printf("[ws] connection opened from %s", r.RemoteAddr)
	go s.handleConnection(conn)
}

// handleConnection is the per-connection goroutine. It owns the read loop and
// dispatches each inbound message to a background worker to serialize execution
// per connection. This ensures the main read loop remains unblocked to handle
// pings/pongs and client control frames.
func (s *WSServer) handleConnection(conn *websocket.Conn) {
	// Generate a server-side session ID that is stable for the connection lifetime.
	sessionID := newSessionID()

	cw := newConnWriter(conn)
	requests := make(chan chatRequest, 8)

	// Start worker goroutine to process chat requests sequentially.
	go s.connectionWorker(conn, cw, sessionID, requests)

	defer func() {
		close(requests)
		conn.Close()
		log.Printf("[ws] connection closed — session=%s addr=%s", sessionID, conn.RemoteAddr())
	}()

	// Configure keep-alive: the server resets the read deadline on every pong.
	conn.SetReadLimit(maxMessageBytes)
	conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// Ping goroutine — writes concurrently with handleChatMessage, hence the
	// connWriter mutex.
	go func() {
		ticker := time.NewTicker(pingInterval)
		defer ticker.Stop()
		for range ticker.C {
			if err := cw.ping(); err != nil {
				return // connection is dead; let the read loop notice and exit
			}
		}
	}()

	log.Printf("[ws] session=%s ready", sessionID)

	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[ws] session=%s read error: %v", sessionID, err)
			}
			return
		}

		// Reset read deadline on successful message receipt.
		conn.SetReadDeadline(time.Now().Add(pongWait))

		var req chatRequest
		if err := json.Unmarshal(raw, &req); err != nil {
			cw.writeJSON(wsEvent{Type: "error", Message: "invalid JSON: " + err.Error()})
			continue
		}

		switch req.Type {
		case "chat":
			if strings.TrimSpace(req.Message) == "" {
				cw.writeJSON(wsEvent{Type: "error", Message: "message field must not be empty"})
				continue
			}
			select {
			case requests <- req:
			default:
				cw.writeJSON(wsEvent{Type: "error", Message: "busy processing another request"})
			}

		default:
			cw.writeJSON(wsEvent{Type: "error", Message: "unsupported message type: " + req.Type})
		}
	}
}

// connectionWorker sequentially processes incoming chat requests for this connection.
func (s *WSServer) connectionWorker(conn *websocket.Conn, cw *connWriter, sessionID string, requests <-chan chatRequest) {
	for req := range requests {
		s.handleChatMessage(conn, cw, sessionID, req)
	}
}

// handleChatMessage runs the agent loop for one user message and streams the
// response back. It blocks the read loop (and therefore serialises messages
// per connection) until the AI finishes — this is intentional.
func (s *WSServer) handleChatMessage(conn *websocket.Conn, cw *connWriter, sessionID string, req chatRequest) {
	ctx, cancel := context.WithTimeout(context.Background(), chatTimeout)
	defer cancel()

	tokenCh := make(chan string, tokenBufSize)
	errCh := make(chan error, 1)

	// Run the agent loop in a goroutine so we can drain tokenCh concurrently.
	go func() {
		orchReq := agent.RunRequest{
			SessionID: sessionID,
			UserID:    req.UserID,
			ProjectID: req.ProjectID,
			Message:   req.Message,
		}
		errCh <- s.orchestrator.Run(ctx, orchReq, tokenCh)
		close(tokenCh) // signal the drain loop that streaming is done
	}()

	// Drain the token channel and forward each chunk to the browser.
	var fullText strings.Builder
	for chunk := range tokenCh {
		fullText.WriteString(chunk)
		if err := cw.writeJSON(wsEvent{Type: "token", Chunk: chunk}); err != nil {
			log.Printf("[ws] session=%s token write error: %v — cancelling", sessionID, err)
			cancel() // causes the streaming callback to return ctx.Err()
			// Don't return yet; drain errCh to avoid a goroutine leak.
			break
		}
	}

	// Ensure the token channel is fully drained if we broke out early.
	for range tokenCh {
	}

	// Collect the orchestrator result.
	if err := <-errCh; err != nil {
		log.Printf("[ws] session=%s orchestrator error: %v", sessionID, err)
		cw.writeJSON(wsEvent{Type: "error", Message: err.Error()})
		return
	}

	// bgCtx := context.WithoutCancel(ctx)
	// bgCtx, bgCancel := context.WithTimeout(bgCtx, 3*time.Minute)

	// TODO: save to qdrant
	// go func() {
	// 	defer bgCancel()
	// 	err := s.orchestrator.GenerateAndStoreContext(bgCtx, req.UserID, req.ProjectID, req.Message)

	// 	if err != nil {
	// 		log.Println("[orchestrator] Error when trying to generate context: ", err)
	// 	}

	// 	log.Println("orchestrator] STORED new message in qdrant")
	// }()

	// All tokens sent successfully — tell the browser the response is complete.
	cw.writeJSON(wsEvent{Type: "done", FullText: fullText.String()})
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// newSessionID generates a cryptographically random 16-byte hex string to use
// as a session identifier. Uses only stdlib to avoid extra dependencies.
func newSessionID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		// crypto/rand failures are unrecoverable on any modern OS.
		panic("gateway: crypto/rand unavailable: " + err.Error())
	}
	return hex.EncodeToString(b)
}
