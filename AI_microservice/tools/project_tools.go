package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	proto "github.com/dragonfarm/SoloPlanner/proto"
	"github.com/tmc/langchaingo/llms"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"
	pb "google.golang.org/protobuf/proto"
)

// grpcTimeout is applied to every individual gRPC call.
// It mirrors the old shared HTTP client's 15-second timeout.
const grpcTimeout = 15 * time.Second

// SessionContext holds the ambient user/project identity for one WebSocket session.
// It is populated at the start of every agent turn from the chatRequest fields
// so that tools can fall back to it when the model omits those IDs.
type SessionContext struct {
	UserID    string
	ProjectID string
}

// ProjectTools provides tools that interact with the Java backend over gRPC.
// It is safe for concurrent use — the sessions map uses sync.Map and the
// gRPC client stub is goroutine-safe by design.
type ProjectTools struct {
	client   proto.ProjectGrpcServiceClient // generated gRPC stub
	sessions sync.Map                       // sessionID → SessionContext
}

// NewProjectTools dials the Java backend's gRPC server at grpcAddr (host:port)
// and wraps the connection in the generated client stub.
// The connection uses insecure transport credentials; add TLS via config when needed.
// Returns an error if the dial parameters are invalid (actual connectivity errors
// surface lazily on the first RPC call).
func NewProjectTools(grpcAddr string) (*ProjectTools, error) {
	conn, err := grpc.NewClient(grpcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("project_tools: dial gRPC backend at %s: %w", grpcAddr, err)
	}

	return &ProjectTools{
		client: proto.NewProjectGrpcServiceClient(conn),
	}, nil
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

// callContext returns a context with the standard per-call timeout.
func callContext() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), grpcTimeout)
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
			Name:        "create_column",
			Description: "Creates a new column inside a project. The projectId is injected automatically by the server; do not ask the user for it.",
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
						"description": "Priority of the task: LOW, MEDIUM, HIGH, or URGENT.",
					},
				},
				// projectId and userId are intentionally absent from required[] —
				// the server injects them from the active session context.
				"required": []string{"columnId", "title", "deadline", "priority"},
			},
		},
	}
}

// ── Tool implementations (what Go executes) ───────────────────────────────────

// GetUserProjects calls ProjectGrpcService.GetUserProjects on the Java backend.
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

	ctx, cancel := callContext()
	defer cancel()

	resp, err := pt.client.GetUserProjects(ctx, &proto.UserProjectsRequest{UserId: userID})
	if err != nil {
		return "", fmt.Errorf("get_user_projects: gRPC call failed: %w", err)
	}

	return marshalProto(resp)
}

// GetProjectTasks calls ProjectGrpcService.GetProjectBoard on the Java backend.
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

	ctx, cancel := callContext()
	defer cancel()

	resp, err := pt.client.GetProjectBoard(ctx, &proto.ProjectBoardRequest{ProjectId: projectID})
	if err != nil {
		return "", fmt.Errorf("get_project_tasks: gRPC call failed: %w", err)
	}

	return marshalProto(resp)
}

// GetProjectTaskBlueprint calls ProjectGrpcService.GetProjectTaskBlueprint on the Java backend.
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

	ctx, cancel := callContext()
	defer cancel()

	resp, err := pt.client.GetProjectTaskBlueprint(ctx, &proto.TaskBlueprintRequest{ProjectId: projectID})
	if err != nil {
		return "", fmt.Errorf("get_project_task_blueprint: gRPC call failed: %w", err)
	}

	return marshalProto(resp)
}

// CreateTask calls ProjectGrpcService.CreateTask on the Java backend.
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

	log.Println("PRIORITY: ", params.Priority)

	priority := params.Priority
	if priority == "" {
		priority = "LOW"
	}

	ctx, cancel := callContext()
	defer cancel()

	resp, err := pt.client.CreateTask(ctx, &proto.CreateTaskRequest{
		ProjectId:   projectID,
		ColumnId:    params.ColumnID,
		Title:       params.Title,
		UserId:      userID,
		Description: params.Description,
		Deadline:    params.Deadline,
		Priority:    priority,
	})
	if err != nil {
		return "", fmt.Errorf("create_task: gRPC call failed: %w", err)
	}

	return marshalProto(resp)
}

// CreateColumn calls ProjectGrpcService.CreateColumn on the Java backend.
func (pt *ProjectTools) CreateColumn(sessionID, args string) (string, error) {
	var params struct {
		Title     string `json:"name"`
		ProjectID string `json:"projectId"`
	}
	if err := json.Unmarshal([]byte(args), &params); err != nil {
		return "", fmt.Errorf("create_column: parse args: %w", err)
	}

	_, projectID := pt.resolveIDs(sessionID, "", params.ProjectID)
	if projectID == "" {
		return "", fmt.Errorf("create_column: projectId is required but was not provided by the model or the active session")
	}

	ctx, cancel := callContext()
	defer cancel()

	resp, err := pt.client.CreateColumn(ctx, &proto.CreateColumnRequest{
		ProjectId: projectID,
		Name:      params.Title,
	})
	if err != nil {
		return "", fmt.Errorf("create_column: gRPC call failed: %w", err)
	}

	return marshalProto(resp)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// marshalProto converts any generated proto.Message to a JSON string using
// protojson. This is preferred over encoding/json because protojson correctly
// handles proto-specific conventions (enums as strings, well-known types, etc.).
// Fields are emitted with snake_case names matching the .proto file.
func marshalProto(msg pb.Message) (string, error) {
	opts := protojson.MarshalOptions{
		UseProtoNames:   true,  // snake_case field names (e.g. project_id, not projectId)
		EmitUnpopulated: false, // omit zero-value fields to keep the payload compact
	}
	bytes, err := opts.Marshal(msg)
	if err != nil {
		return "", fmt.Errorf("marshal proto response: %w", err)
	}
	return string(bytes), nil
}
