package tools

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/tmc/langchaingo/llms"
)

// sharedHTTPClient is reused across all tool invocations to benefit from
// connection pooling. The timeout is intentionally generous since the Java
// backend might need to hit the database.
var sharedHTTPClient = &http.Client{Timeout: 15 * time.Second}

// SessionContext holds the ambient user/project identity for one WebSocket session.
// It is populated at the start of every agent turn from the chatRequest fields
// so that tools can fall back to it when the model omits those IDs.
type SessionContext struct {
	UserID    string
	ProjectID string
}

// ProjectTools provides tools that interact with the Java backend REST API.
// It is safe for concurrent use — the sessions map uses sync.Map.
type ProjectTools struct {
	baseURL  string   // e.g. "http://localhost:8081", no trailing slash
	sessions sync.Map // sessionID → SessionContext
}

// NewProjectTools creates a ProjectTools targeting javaBaseURL.
func NewProjectTools(javaBaseURL string) *ProjectTools {
	return &ProjectTools{baseURL: strings.TrimRight(javaBaseURL, "/")}
}

// SetSessionContext stores the active user/project identity for the given session.
// This satisfies the tools.ContextSetter interface and is called by the registry
// at the start of every agent turn, before any tool is executed.
func (pt *ProjectTools) SetSessionContext(sessionID, userID, projectID string) {
	pt.sessions.Store(sessionID, SessionContext{UserID: userID, ProjectID: projectID})
}

// sessionContext retrieves the stored context for a session.
// Returns a zero-value SessionContext if none has been set yet.
func (pt *ProjectTools) sessionContext(sessionID string) SessionContext {
	if v, ok := pt.sessions.Load(sessionID); ok {
		return v.(SessionContext)
	}
	return SessionContext{}
}

// resolveIDs returns the effective userID and projectID for a tool call.
// Model-supplied values take priority; the server-side session context fills
// any gaps so the model never has to ask the user for these IDs.
func (pt *ProjectTools) resolveIDs(sessionID, argsUserID, argsProjectID string) (userID, projectID string) {
	ctx := pt.sessionContext(sessionID)
	userID = argsUserID
	if userID == "" {
		userID = ctx.UserID
	}
	projectID = argsProjectID
	if projectID == "" {
		projectID = ctx.ProjectID
	}
	return
}

// RegisterAll registers every project tool on the given Registry and records
// this provider as a ContextSetter so session context is injected each turn.
// Call this once at startup.
func (pt *ProjectTools) RegisterAll(r *Registry) {
	r.Register(pt.getProjectTasksDef(), pt.GetProjectTasks)
	r.Register(pt.createTaskDef(), pt.CreateTask)
	// r.Register(pt.createColumnDef(), pt.CreateColumn)
	r.Register(pt.getProjectTaskBlueprintDef(), pt.GetProjectTaskBlueprint)
	r.RegisterContextSetter(pt)
}

// ── Tool definitions (what Gemma sees) ───────────────────────────────────────
func (pt *ProjectTools) getProjectTasksDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "get_project_tasks",
			Description: "Get all tasks and columns for the currently open project. The projectId is injected automatically by the server; do not ask the user for it.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"projectId": map[string]any{
						"type":        "string",
						"description": "UUID of the project. Omit — the server injects this automatically from the active session.",
					},
				},
				"required": []string{},
			},
		},
	}
}

func (pt *ProjectTools) getProjectTaskBlueprintDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "get_project_task_blueprint",
			Description: "CRITICAL: Fetches the required system configuration parameters before task creation. Returns the current system time, allowed priority values, valid column IDs, and tag UUIDs. You MUST call this before create_task. The projectId is injected automatically; call this tool immediately without asking the user.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"projectId": map[string]any{
						"type":        "string",
						"description": "UUID of the project. Omit — the server injects this automatically from the active session.",
					},
				},
				"required": []string{},
			},
		},
	}
}

func (pt *ProjectTools) createColumnDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "create_task",
			Description: "Creates a new task inside a project column and assigns it to the current user. The projectId and userId are injected automatically by the server; do not ask the user for them.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"projectId": map[string]any{
						"type":        "string",
						"description": "UUID of the project. Omit — the server injects this automatically from the active session.",
					},
					"title": map[string]any{
						"type":        "string",
						"description": "Title of the new column.",
					},
					"userId": map[string]any{
						"type":        "string",
						"description": "UUID of the user the task is assigned to. Omit — the server injects this automatically from the active session.",
					},
				},
				"required": []string{"title"},
			},
		},
	}
}

func (pt *ProjectTools) createTaskDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "create_task",
			Description: "Creates a new task inside a project column and assigns it to the current user. The projectId and userId are injected automatically by the server; do not ask the user for them.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"projectId": map[string]any{
						"type":        "string",
						"description": "UUID of the project. Omit — the server injects this automatically from the active session.",
					},
					"columnId": map[string]any{
						"type":        "string",
						"description": "UUID of the column where the task will be created. Get this from the blueprint.",
					},
					"deadline": map[string]any{
						"type":        "string",
						"format":      "date-time",
						"description": "Strict ISO-8601 UTC date-time string matching the pattern YYYY-MM-DDTHH:mm:ssZ (e.g., '2026-06-23T09:00:00Z'). Calculate this relative to the currentSystemTime provided in the blueprint.",
					},
					"tags": map[string]any{
						"type":        "string",
						"description": "Optional tags for the task. Default to null.",
					},
					"title": map[string]any{
						"type":        "string",
						"description": "Title of the new task.",
					},
					"userId": map[string]any{
						"type":        "string",
						"description": "UUID of the user the task is assigned to. Omit — the server injects this automatically from the active session.",
					},
					"description": map[string]any{
						"type":        "string",
						"description": "Optional longer description for the task.",
					},
					"priority": map[string]any{
						"type":        "string",
						"description": "Priority of the task: LOW, MEDIUM, HIGH, or URGENT. Default to LOW if not specified.",
					},
				},
				// projectId and userId are intentionally absent from required[] —
				// the server injects them from the active session context.
				"required": []string{"columnId", "title", "deadline"},
			},
		},
	}
}

// ── Tool implementations (what Go executes) ───────────────────────────────────

// GetUserProjects calls GET /projects?userId={id} on the Java backend.
// userId is resolved from the model's args first, then the stored session context.
func (pt *ProjectTools) GetUserProjects(sessionID, args string) (string, error) {
	var params struct {
		UserID string `json:"userId"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("get_user_projects: parse args: %w", err)
	}

	userID, _ := pt.resolveIDs(sessionID, params.UserID, "")
	if userID == "" {
		return "", fmt.Errorf("get_user_projects: userId is required but was not provided by the model or the active session")
	}

	url := fmt.Sprintf("%s/projects?userId=%s", pt.baseURL, userID)
	return doGet(url)
}

// GetProjectTasks calls GET /projects/{projectId}/board on the Java backend.
// projectId is resolved from the model's args first, then the stored session context.
func (pt *ProjectTools) GetProjectTasks(sessionID, args string) (string, error) {
	log.Println("[tools] GetProjectTasks called")
	var params struct {
		ProjectID string `json:"projectId"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("get_project_tasks: parse args: %w", err)
	}

	_, projectID := pt.resolveIDs(sessionID, "", params.ProjectID)
	if projectID == "" {
		return "", fmt.Errorf("get_project_tasks: projectId is required but was not provided by the model or the active session")
	}

	url := fmt.Sprintf("%s/projects/%s/board", pt.baseURL, projectID)
	return doGet(url)
}

// GetProjectTaskBlueprint calls GET /helper/task/blueprint/{projectId}.
// projectId is resolved from the model's args first, then the stored session context.
func (pt *ProjectTools) GetProjectTaskBlueprint(sessionID, args string) (string, error) {
	var params struct {
		ProjectID string `json:"projectId"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("get_project_task_blueprint: parse args: %w", err)
	}

	_, projectID := pt.resolveIDs(sessionID, "", params.ProjectID)
	if projectID == "" {
		return "", fmt.Errorf("get_project_task_blueprint: projectId is required but was not provided by the model or the active session")
	}

	url := fmt.Sprintf("%s/helper/task/blueprint/%s", pt.baseURL, projectID)
	return doGet(url)
}

// CreateTask calls POST /projects/{projectId}/{columnId}/tasks on the Java backend.
// projectId and userId are resolved from the model's args first, then the stored
// session context, so the model never needs to ask the user for those values.
func (pt *ProjectTools) CreateTask(sessionID, args string) (string, error) {
	var params struct {
		ProjectID   string `json:"projectId"`
		ColumnID    string `json:"columnId"`
		Title       string `json:"title"`
		UserID      string `json:"userId"`
		Description string `json:"description,omitempty"`
		Deadline    string `json:"deadline,omitempty"`
		Priority    string `json:"priority,omitempty"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("create_task: parse args: %w", err)
	}

	// Resolve projectId and userId from args, falling back to the stored session context.
	userID, projectID := pt.resolveIDs(sessionID, params.UserID, params.ProjectID)
	if projectID == "" {
		return "", fmt.Errorf("create_task: projectId is required but was not provided by the model or the active session")
	}
	if userID == "" {
		return "", fmt.Errorf("create_task: userId is required but was not provided by the model or the active session")
	}

	task_priority := params.Priority

	if task_priority == "" {
		task_priority = "LOW"
	}

	// Build the request body that Java's ProjectTaskRequest expects.
	reqBody, err := json.Marshal(map[string]any{
		"title":       params.Title,
		"userId":      userID,
		"description": params.Description,
		"deadline":    params.Deadline,
		"priority":    task_priority,
	})
	if err != nil {
		return "", fmt.Errorf("create_task: marshal body: %w", err)
	}

	url := fmt.Sprintf("%s/projects/%s/%s/tasks", pt.baseURL, projectID, params.ColumnID)
	return doPost(url, reqBody)
}

func (pt *ProjectTools) CreateColumn(sessionID, args string) (string, error) {
	var params struct {
		Title     string `json:"name"`
		ProjectID string `json:"projectId"`
		UserID    string `json:"userId"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("create_task: parse args: %w", err)
	}

	// Resolve projectId and userId from args, falling back to the stored session context.
	userID, projectID := pt.resolveIDs(sessionID, params.UserID, params.ProjectID)
	if projectID == "" {
		return "", fmt.Errorf("create_task: projectId is required but was not provided by the model or the active session")
	}
	if userID == "" {
		return "", fmt.Errorf("create_task: userId is required but was not provided by the model or the active session")
	}

	// Build the request body that Java's ProjectTaskRequest expects.
	reqBody, err := json.Marshal(map[string]any{
		"name": params.Title,
	})
	if err != nil {
		return "", fmt.Errorf("create_task: marshal body: %w", err)
	}

	url := fmt.Sprintf("%s/projects/%s/columns", pt.baseURL, projectID)
	return doPost(url, reqBody)
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

// doGet performs a GET request and returns the response body as a string.
func doGet(url string) (string, error) {
	log.Println("REQUESTING GET URL: ", url)
	resp, err := sharedHTTPClient.Get(url)
	if err != nil {
		return "", fmt.Errorf("GET %s: %w", url, err)
	}
	defer resp.Body.Close()
	return readResponseBody(resp)
}

// doPost performs a POST request with a JSON body and returns the response.
func doPost(url string, body []byte) (string, error) {
	log.Println("REQUESTING POST URL: ", url)
	resp, err := sharedHTTPClient.Post(url, "application/json", strings.NewReader(string(body)))
	if err != nil {
		return "", fmt.Errorf("POST %s: %w", url, err)
	}
	defer resp.Body.Close()
	return readResponseBody(resp)
}

// readResponseBody reads the full body and returns an error if the status
// code indicates a backend failure.
func readResponseBody(resp *http.Response) (string, error) {
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read body: %w", err)
	}
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("backend returned %d: %s", resp.StatusCode, string(data))
	}
	return string(data), nil
}
