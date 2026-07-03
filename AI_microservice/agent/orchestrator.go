package agent

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/dragonfarm/SoloPlanner/config"
	"github.com/dragonfarm/SoloPlanner/tools"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/llms/openai"
)

// maxIterations caps the agent loop to prevent runaway tool chains.
// If Gemma keeps requesting tools beyond this limit, the call fails with an
// error rather than looping forever.
const maxIterations = 6

// baseSystemPrompt is the identity and behaviour contract given to Gemma at
// the start of every fresh session. It is extended at runtime with user/project
// context in buildSystemPrompt.
const baseSystemPrompt = `You are a Project Management assistant embedded in the user's active project session.

## ROLE
Act as a collaborative, expert Project Manager. Be concise, friendly, and focused.

You cannot run code, scripts, or any interpreter. Only use the tools listed above.

## TASK CREATION FLOW
Follow these steps in strict order. Do not skip any step.

### Step 1 — GATHER
Before doing anything else, collect missing details from the user:
- Propose a deadline based on today's date and explain your reasoning.
- Suggest a priority (Low / Medium / High) and explain why.
- Offer to expand the description with acceptance criteria.
Ask the user to confirm or adjust these suggestions. Wait for their reply.

### Step 2 — PRESENT SUMMARY (REQUIRED, never skip)
Before calling any tool, you MUST present a task summary card to the user:

---
Task Summary — please confirm before I create this:
- Title: <title>
- Description: <description>
- Priority: <priority>
- Deadline: <deadline>

Reply "confirm" to create, or tell me what to change.
---

Do not call create_task until the user replies with an explicit confirmation such as:
"confirm", "yes", "create it", "looks good", "go ahead", or "decide for me".

### Step 3 — EXECUTE (only after explicit user confirmation)
After the user confirms:
a. Call get_project_task_blueprint to retrieve available columns.
b. Select the default column automatically. Never ask the user which column to use.
c. Call create_task with all confirmed details.

## COLUMN SELECTION RULE
Never ask the user which column to place a task in. Always call get_project_task_blueprint and pick the default column yourself.

## ID RULES
- Never ask the user for a Project ID, User ID, or any UUID.
- All IDs are resolved automatically by the backend.
- Never expose or reference raw IDs in responses.

## DATA RULES
- Always fetch live data before answering questions about projects or tasks.
- Never invent project names, task titles, or statuses. Fetch first.
- If a tool needs no user input, call it immediately.

## RESPONSE RULES
- Never return an empty message. Always respond with text or a tool call.
- Keep responses short and focused.
- If you cannot complete a request, explain clearly what information you need.`

// RunRequest contains all the context the orchestrator needs to handle one
// user message within a conversation session.
type RunRequest struct {
	// SessionID uniquely identifies the WebSocket connection / conversation.
	// It is server-generated per connection and stable for the connection lifetime.
	SessionID string
	// UserID is the Keycloak UUID of the authenticated user.
	// Passed in each message so tools that need a user identity have it.
	UserID string
	// ProjectID is the UUID of the project the frontend is currently displaying.
	// Optional — empty string is valid when the user has no project open.
	ProjectID string
	// Message is the raw user message text.
	Message string
}

// Orchestrator drives the agent loop. It is responsible for:
//  1. Building the full message context (system prompt + history + user message)
//  2. Calling Ollama (with streaming and tool definitions)
//  3. Detecting tool calls in the response and executing them via the Registry
//  4. Looping until Gemma produces a final text answer or the iteration cap is hit
//  5. Streaming answer tokens to the caller through a channel
type Orchestrator struct {
	llm         llms.Model
	vectorLLM   llms.Model
	history     *ConversationStore
	tools       *tools.Registry
	vectorTools *tools.VectorTools
}

// New creates an Orchestrator, initialising the Ollama client.
// Returns an error if Ollama cannot be reached with the given configuration.
func New(cfg *config.Config, history *ConversationStore, toolReg *tools.Registry, vectorTools *tools.VectorTools) (*Orchestrator, error) {
	llm, err := openai.New(
		openai.WithModel(cfg.OllamaModel),
		openai.WithBaseURL(cfg.OllamaHost+"/v1"),
		openai.WithToken("ollama"),
	)
	if err != nil {
		return nil, fmt.Errorf("orchestrator: init openai client: %w", err)
	}

	vectorLLM, err := ollama.New(
		ollama.WithModel("znbang/bge:small-en-v1.5-f32"),
		ollama.WithServerURL(cfg.OllamaHost),
	)
	if err != nil {
		return nil, fmt.Errorf("orchestrator: init ollama vector client: %w", err)
	}

	return &Orchestrator{llm: llm, vectorLLM: vectorLLM, history: history, tools: toolReg, vectorTools: vectorTools}, nil
}

// Run handles a single user turn of the conversation.
//
// Each Ollama call in the loop streams its output through the streaming
// callback. When Ollama returns tool calls (no visible text), the tokens are
// empty and the loop continues silently. When Ollama returns the final text
// answer, tokens arrive token-by-token and are forwarded to tokenCh so the
// WebSocket layer can push them to the browser in real time.
//
// tokenCh must have a buffer large enough to absorb burst writes without
// blocking the streaming callback (256 is a safe default). The caller is
// responsible for draining tokenCh concurrently and must NOT close it — Run
// will return when it is done.
func (o *Orchestrator) Run(ctx context.Context, req RunRequest, tokenCh chan<- string) error {
	// Push the active user/project identity into all registered tools so they
	// can inject it automatically without requiring the model to supply it.
	o.tools.SetSessionContext(req.SessionID, req.UserID, req.ProjectID)

	messages := o.buildInitialMessages(req)
	toolDefs := o.tools.Definitions()

	for iter := 0; iter < maxIterations; iter++ {
		log.Printf("[orchestrator] session=%s iter=%d → Ollama", req.SessionID, iter)

		var streamBuf strings.Builder
		var streamChunks []string

		log.Printf("[orchestrator] sending %d tool definitions", len(toolDefs))
		for _, td := range toolDefs {
			log.Printf("  tool: %s", td.Function.Name)
		}

		resp, err := o.llm.GenerateContent(ctx, messages,
			llms.WithTools(toolDefs),
			llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
				text := string(chunk)
				streamBuf.WriteString(text)
				streamChunks = append(streamChunks, text)
				return nil
			}),
		)
		log.Printf("DEBUG: streamBuf=%q", streamBuf.String())
		if err != nil {
			return fmt.Errorf("orchestrator: generate (iter %d): %w", iter, err)
		}
		if len(resp.Choices) == 0 {
			return fmt.Errorf("orchestrator: Ollama returned no choices on iter %d", iter)
		}

		choice := resp.Choices[0]
		log.Printf("DEBUG: Raw Content: %q | ToolCalls: %+v", choice.Content, choice.ToolCalls)

		// ── Tool call branch ───────────────────────────────────────────────
		// Ollama does not stream text when it decides to call tools, so
		// streamBuf will be empty here. We record the AI's decision in the
		// history, execute each tool, append the results, and loop.
		if len(choice.ToolCalls) > 0 {
			log.Printf("[orchestrator] session=%s iter=%d got %d tool call(s)",
				req.SessionID, iter, len(choice.ToolCalls))

			// Persist the AI's tool-call decision in the conversation history.
			aiMsg := buildAIToolCallMessage(choice)
			messages = append(messages, aiMsg)
			o.history.Append(req.SessionID, aiMsg)

			// Execute every tool Gemma requested and feed results back.
			for _, tc := range choice.ToolCalls {
				result := o.executeTool(req.SessionID, tc)
				log.Printf("[orchestrator] session=%s tool=%s result_bytes=%d",
					req.SessionID, tc.FunctionCall.Name, len(result))

				toolMsg := buildToolResultMessage(tc, result)
				messages = append(messages, toolMsg)
				o.history.Append(req.SessionID, toolMsg)
			}

			continue // next iteration: re-prompt Gemma with tool results in context
		}

		// ── Final answer branch ────────────────────────────────────────────
		// Gemma produced a text response (no tool calls).
		// Determine the canonical response text and persist it.
		finalText := streamBuf.String()
		if finalText == "" {
			// Fallback for Ollama builds that don't stream the final answer.
			finalText = choice.Content
		}

		if err := streamFinalResponse(ctx, tokenCh, streamChunks, finalText); err != nil {
			return err
		}

		assistantMsg := llms.MessageContent{
			Role:  llms.ChatMessageTypeAI,
			Parts: []llms.ContentPart{llms.TextPart(finalText)},
		}
		o.history.Append(req.SessionID, assistantMsg)
		log.Printf("[orchestrator] session=%s done after %d iter(s)", req.SessionID, iter+1)

		//test
		log.Println("Message: ", finalText)
		// message, _ := o.generateMessageContext(ctx, finalText)
		// println("Message context: ", message)
		return nil
	}

	return fmt.Errorf("orchestrator: agent loop exceeded %d iterations for session %s — aborting",
		maxIterations, req.SessionID)
}

// ── Private helpers ───────────────────────────────────────────────────────────

// buildInitialMessages assembles the full message slice for the current turn:
//   - System prompt (only on the very first message of a session)
//   - All prior messages from history
//   - The current user message
//
// The user message is also persisted to history here so it is included in
// future turns automatically.
func (o *Orchestrator) buildInitialMessages(req RunRequest) []llms.MessageContent {
	history := o.history.GetAll(req.SessionID)

	var messages []llms.MessageContent
	if len(history) == 0 {
		// Inject system prompt at the start of a fresh session.
		messages = append(messages, llms.MessageContent{
			Role:  llms.ChatMessageTypeSystem,
			Parts: []llms.ContentPart{llms.TextPart(buildSystemPrompt(req))},
		})
	} else {
		messages = history
	}

	userMsg := llms.MessageContent{
		Role:  llms.ChatMessageTypeHuman,
		Parts: []llms.ContentPart{llms.TextPart(req.Message)},
	}
	messages = append(messages, userMsg)
	o.history.Append(req.SessionID, userMsg)

	return messages
}

// buildSystemPrompt constructs the system prompt by appending any available
// runtime context (user ID, current project) to the base prompt. This gives
// Gemma concrete IDs it can pass directly to tools without asking the user.
func buildSystemPrompt(req RunRequest) string {
	var sb strings.Builder
	sb.WriteString(baseSystemPrompt)

	if req.UserID != "" {
		fmt.Fprintf(&sb, "\n\nContext — current user ID: %s", req.UserID)
	}
	if req.ProjectID != "" {
		fmt.Fprintf(&sb, "\nContext — currently open project ID: %s", req.ProjectID)
	}
	return sb.String()
}

// buildAIToolCallMessage creates the assistant message that records Gemma's
// decision to call tools. This is added to the history so the model can see
// its own prior tool requests when it reads the conversation context.
func buildAIToolCallMessage(choice *llms.ContentChoice) llms.MessageContent {
	parts := make([]llms.ContentPart, 0, len(choice.ToolCalls)+1)
	if choice.Content != "" {
		parts = append(parts, llms.TextPart(choice.Content))
	}
	// llms.ToolCall implements llms.ContentPart via its GetType() method.
	for i := range choice.ToolCalls {
		parts = append(parts, choice.ToolCalls[i])
	}
	return llms.MessageContent{
		Role:  llms.ChatMessageTypeAI,
		Parts: parts,
	}
}

// buildToolResultMessage wraps the raw tool output in the llms.MessageContent
// format that Ollama expects when tool results are fed back into the context.
func buildToolResultMessage(tc llms.ToolCall, result string) llms.MessageContent {
	return llms.MessageContent{
		Role: llms.ChatMessageTypeTool,
		Parts: []llms.ContentPart{
			llms.ToolCallResponse{
				ToolCallID: tc.ID,
				Name:       tc.FunctionCall.Name,
				Content:    result,
			},
		},
	}
}

// executeTool calls the registry and returns a JSON-safe result string.
// sessionID is forwarded so tools can look up their stored session context
// and inject user/project IDs that the model did not supply.
// On failure it returns a JSON error object instead of propagating the error,
// so Gemma can reason about the failure and explain it to the user gracefully.
func (o *Orchestrator) executeTool(sessionID string, tc llms.ToolCall) string {
	log.Println("CALLING ", tc.FunctionCall.Name)
	result, err := o.tools.Execute(sessionID, tc.FunctionCall.Name, tc.FunctionCall.Arguments)
	if err != nil {
		log.Printf("[orchestrator] tool %s failed: %v", tc.FunctionCall.Name, err)
		return fmt.Sprintf(`{"error":%q}`, err.Error())
	}
	return result
}

func (o *Orchestrator) GenerateMessageContext(ctx context.Context, message string) (string, error) {
	prompt := fmt.Sprintf("Summarize the following chat message to extract the main intent, topic, and context for semantic storage. Keep the response concise, representing only the core meaning:\n\n%s", message)
	resp, err := o.llm.GenerateContent(ctx, []llms.MessageContent{
		{
			Role:  llms.ChatMessageTypeHuman,
			Parts: []llms.ContentPart{llms.TextPart(prompt)},
		},
	})
	if err != nil {
		return "", fmt.Errorf("generateMessageContext: %w", err)
	}
	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("generateMessageContext: model returned no choices")
	}
	// Extract the summarized text response
	summary := resp.Choices[0].Content
	return strings.TrimSpace(summary), nil
}

// Generate vector for storing in qdrant
func (o *Orchestrator) GenerateEmbedding(ctx context.Context, text string) ([]float32, error) {
	embedder, ok := o.vectorLLM.(interface {
		CreateEmbedding(ctx context.Context, text []string) ([][]float32, error)
	})

	if !ok {
		return nil, fmt.Errorf("generateEmbedding: vectorLLM does not support embedding creation")
	}

	vectors, err := embedder.CreateEmbedding(ctx, []string{text})
	if err != nil {
		return nil, fmt.Errorf("generateEmbedding: %w", err)
	}
	if len(vectors) == 0 {
		return nil, fmt.Errorf("generateEmbedding: model returned empty embedding")
	}

	return vectors[0], nil
}

func (o *Orchestrator) GenerateAndStoreContext(ctx context.Context, userID, projectId, message string) error {
	vector, err := o.GenerateEmbedding(ctx, message)
	if err != nil {
		return fmt.Errorf("GenerateAndStoreContext: embed: %w", err)
	}

	if err := o.vectorTools.UpsertMessageContext(ctx, userID, projectId, message, vector); err != nil {
		return fmt.Errorf("GenerateAndStoreContext: upsert: %w", err)
	}
	return nil
}

// streamFinalResponse streams the final text response back to the client via tokenCh.
// It sends the accumulated chunks with a tiny delay to simulate real-time typing,
// falling back to sending the full text at once if no chunks were captured.
func streamFinalResponse(ctx context.Context, tokenCh chan<- string, chunks []string, fallbackText string) error {
	if len(chunks) > 0 {
		for _, chunk := range chunks {
			select {
			case tokenCh <- chunk:
			case <-ctx.Done():
				return ctx.Err()
			}
			time.Sleep(10 * time.Millisecond)
		}
		return nil
	}

	if fallbackText != "" {
		select {
		case tokenCh <- fallbackText:
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}
