package tools

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/tmc/langchaingo/llms"
)

// sharedHTTPClient is reused across all tool invocations to benefit from
// connection pooling. The timeout is intentionally generous since the Java
// backend might need to hit the database.
var sharedHTTPClient = &http.Client{Timeout: 15 * time.Second}

// ProjectTools provides tools that interact with the Java backend REST API.
// It owns no state beyond the base URL and is safe for concurrent use.
type ProjectTools struct {
	baseURL string // e.g. "http://localhost:8081", no trailing slash
}

// NewProjectTools creates a ProjectTools targeting javaBaseURL.
func NewProjectTools(javaBaseURL string) *ProjectTools {
	return &ProjectTools{baseURL: strings.TrimRight(javaBaseURL, "/")}
}

// RegisterAll registers every project tool on the given Registry.
// Call this once at startup.
func (pt *ProjectTools) RegisterAll(r *Registry) {
	r.Register(pt.getUserProjectsDef(), pt.GetUserProjects)
	r.Register(pt.getProjectTasksDef(), pt.GetProjectTasks)
	r.Register(pt.createTaskDef(), pt.CreateTask)
}

// ── Tool definitions (what Gemma sees) ───────────────────────────────────────

func (pt *ProjectTools) getUserProjectsDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "get_user_projects",
			Description: "Fetches the list of all projects the user is a member of or owns.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"userId": map[string]any{
						"type":        "string",
						"description": "The Keycloak UUID of the user.",
					},
				},
				"required": []string{"userId"},
			},
		},
	}
}

func (pt *ProjectTools) getProjectTasksDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "get_project_tasks",
			Description: "Fetches the full board layout — all columns and their tasks — for a specific project.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"projectId": map[string]any{
						"type":        "string",
						"description": "UUID of the project whose board to fetch.",
					},
				},
				"required": []string{"projectId"},
			},
		},
	}
}

func (pt *ProjectTools) createTaskDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "create_task",
			Description: "Creates a new task inside a project column and assigns it to a user.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"projectId": map[string]any{
						"type":        "string",
						"description": "UUID of the project.",
					},
					"columnId": map[string]any{
						"type":        "string",
						"description": "UUID of the column where the task will be created.",
					},
					"title": map[string]any{
						"type":        "string",
						"description": "Title of the new task.",
					},
					"userId": map[string]any{
						"type":        "string",
						"description": "UUID of the user the task is assigned to.",
					},
					"description": map[string]any{
						"type":        "string",
						"description": "Optional longer description for the task.",
					},
				},
				"required": []string{"projectId", "columnId", "title", "userId"},
			},
		},
	}
}

// ── Tool implementations (what Go executes) ───────────────────────────────────

// GetUserProjects calls GET /projects?userId={id} on the Java backend.
func (pt *ProjectTools) GetUserProjects(args string) (string, error) {
	var params struct {
		UserID string `json:"userId"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("get_user_projects: parse args: %w", err)
	}
	if params.UserID == "" {
		return "", fmt.Errorf("get_user_projects: userId is required")
	}

	url := fmt.Sprintf("%s/projects?userId=%s", pt.baseURL, params.UserID)
	return doGet(url)
}

// GetProjectTasks calls GET /projects/{projectId}/board on the Java backend.
func (pt *ProjectTools) GetProjectTasks(args string) (string, error) {
	var params struct {
		ProjectID string `json:"projectId"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("get_project_tasks: parse args: %w", err)
	}
	if params.ProjectID == "" {
		return "", fmt.Errorf("get_project_tasks: projectId is required")
	}

	url := fmt.Sprintf("%s/projects/%s/board", pt.baseURL, params.ProjectID)
	return doGet(url)
}

// CreateTask calls POST /projects/{projectId}/{columnId}/tasks on the Java backend.
func (pt *ProjectTools) CreateTask(args string) (string, error) {
	var params struct {
		ProjectID   string `json:"projectId"`
		ColumnID    string `json:"columnId"`
		Title       string `json:"title"`
		UserID      string `json:"userId"`
		Description string `json:"description,omitempty"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("create_task: parse args: %w", err)
	}

	// Build the request body that Java's ProjectTaskRequest expects.
	reqBody, err := json.Marshal(map[string]any{
		"title":       params.Title,
		"userId":      params.UserID,
		"description": params.Description,
	})
	if err != nil {
		return "", fmt.Errorf("create_task: marshal body: %w", err)
	}

	url := fmt.Sprintf("%s/projects/%s/%s/tasks", pt.baseURL, params.ProjectID, params.ColumnID)
	return doPost(url, reqBody)
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

// doGet performs a GET request and returns the response body as a string.
func doGet(url string) (string, error) {
	resp, err := sharedHTTPClient.Get(url)
	if err != nil {
		return "", fmt.Errorf("GET %s: %w", url, err)
	}
	defer resp.Body.Close()
	return readResponseBody(resp)
}

// doPost performs a POST request with a JSON body and returns the response.
func doPost(url string, body []byte) (string, error) {
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
