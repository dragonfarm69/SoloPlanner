package agent

import (
	"sync"

	"github.com/tmc/langchaingo/llms"
)

// ConversationStore is a thread-safe, in-memory store for per-session
// conversation history. Each session holds an ordered slice of
// llms.MessageContent values that form the full chat context sent to Ollama.
//
// Goroutine safety: all exported methods are guarded by an RWMutex. Multiple
// sessions are completely independent — a long read on one session never
// blocks writes on another.
type ConversationStore struct {
	mu       sync.RWMutex
	sessions map[string][]llms.MessageContent
}

// NewConversationStore creates an empty ConversationStore ready for use.
func NewConversationStore() *ConversationStore {
	return &ConversationStore{
		sessions: make(map[string][]llms.MessageContent),
	}
}

// Append adds a single message to the end of the session's history.
func (s *ConversationStore) Append(sessionID string, msg llms.MessageContent) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[sessionID] = append(s.sessions[sessionID], msg)
}

// GetAll returns a shallow copy of the session's full message history.
// A copy is returned so the caller can safely prepend a system prompt or
// append new messages without affecting the stored slice.
// Returns nil if the session has no history yet.
func (s *ConversationStore) GetAll(sessionID string) []llms.MessageContent {
	s.mu.RLock()
	defer s.mu.RUnlock()

	src := s.sessions[sessionID]
	if len(src) == 0 {
		return nil
	}

	out := make([]llms.MessageContent, len(src))
	copy(out, src)
	return out
}

// Clear removes all messages for the given session, freeing the memory.
// A subsequent GetAll on the same session will return nil.
func (s *ConversationStore) Clear(sessionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
}
