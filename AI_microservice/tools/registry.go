package tools

import (
	"fmt"

	"github.com/tmc/langchaingo/llms"
)

// ToolFunc is the signature every tool implementation must satisfy.
// sessionID identifies the active WebSocket session so the tool can
// retrieve its ambient user/project context via SetSessionContext.
// args is a JSON string matching the tool's declared parameter schema.
// The return value should be a JSON string that Gemma will read as the
// tool result; it is appended verbatim to the conversation context.
type ToolFunc func(sessionID, args string) (string, error)

// ContextSetter is implemented by tool providers that need the active
// user/project identity injected before each conversation turn.
type ContextSetter interface {
	SetSessionContext(sessionID, userID, projectID string)
}

// entry pairs one tool's LangChain definition with its Go implementation.
type entry struct {
	definition llms.Tool
	handler    ToolFunc
}

// Registry maps tool names to their definitions and Go implementations.
// It is the single source of truth for what tools Gemma can call.
// All tools must be registered before the orchestrator starts.
type Registry struct {
	entries        []entry
	byName         map[string]ToolFunc
	contextSetters []ContextSetter // tool providers that accept session context
}

// NewRegistry creates an empty Registry.
func NewRegistry() *Registry {
	return &Registry{byName: make(map[string]ToolFunc)}
}

// Register adds a tool to the registry.
// The tool name is taken from def.Function.Name.
// Panics if a tool with the same name is registered twice.
func (r *Registry) Register(def llms.Tool, fn ToolFunc) {
	name := def.Function.Name
	if _, exists := r.byName[name]; exists {
		panic(fmt.Sprintf("tools: duplicate registration for %q", name))
	}
	r.entries = append(r.entries, entry{definition: def, handler: fn})
	r.byName[name] = fn
}

// RegisterContextSetter records a tool provider that implements ContextSetter.
// Call this once per provider at startup, after registering its tools.
func (r *Registry) RegisterContextSetter(cs ContextSetter) {
	r.contextSetters = append(r.contextSetters, cs)
}

// SetSessionContext propagates the current session's user/project identity to
// all registered ContextSetters. Call this at the start of every agent turn,
// before any tool is executed.
func (r *Registry) SetSessionContext(sessionID, userID, projectID string) {
	for _, cs := range r.contextSetters {
		cs.SetSessionContext(sessionID, userID, projectID)
	}
}

// Definitions returns the ordered list of tool definitions to be passed to
// Gemma via llms.WithTools. The order matches registration order.
func (r *Registry) Definitions() []llms.Tool {
	defs := make([]llms.Tool, len(r.entries))
	for i, e := range r.entries {
		defs[i] = e.definition
	}
	return defs
}

// Execute looks up the named tool and calls it with the provided JSON args.
// sessionID is forwarded to the handler so it can retrieve its stored
// session context (user/project identity) if the model did not supply it.
// Returns an error wrapping a descriptive message if the tool is not found
// or if the implementation returns an error.
func (r *Registry) Execute(sessionID, name, args string) (string, error) {
	fn, ok := r.byName[name]
	if !ok {
		return "", fmt.Errorf("tools: unknown tool %q — Gemma may have hallucinated a tool name", name)
	}
	return fn(sessionID, args)
}
