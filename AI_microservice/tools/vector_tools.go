package tools

import (
	pb "github.com/qdrant/go-client/qdrant"
	"github.com/tmc/langchaingo/llms"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// VectorTools provides semantic search capabilities over project documents.
//
// V1 status: STUB — no vector store (e.g. pgvector, Qdrant) is in the stack
// yet. The tool is registered so Gemma knows it exists; the body returns an
// empty result set with an explanatory note. When a vector store is added to
// docker_setup.yml, replace SearchVectorDatabase with a real implementation.
type VectorTools struct {
	client pb.PointsClient
	conn   *grpc.ClientConn
}

// NewVectorTools creates a VectorTools.
func NewVectorTools(addr string) (*VectorTools, error) {
	client, conn, err := connectQdrant(addr)
	if err != nil {
		return nil, err
	}
	return &VectorTools{client: client, conn: conn}, nil
}

// RegisterAll registers the semantic search tool on the given Registry.
func (vt *VectorTools) RegisterAll(r *Registry) {
	r.Register(vt.searchDef(), vt.SearchVectorDatabase)
}

func (vt *VectorTools) searchDef() llms.Tool {
	return llms.Tool{
		Type: "function",
		Function: &llms.FunctionDefinition{
			Name:        "search_vector_database",
			Description: "Performs a semantic (meaning-based) search over project documents, notes, and descriptions. Returns the most relevant text passages.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"query": map[string]any{
						"type":        "string",
						"description": "Natural-language search query describing what to find.",
					},
					"topK": map[string]any{
						"type":        "integer",
						"description": "Maximum number of results to return. Defaults to 5 if omitted.",
					},
				},
				"required": []string{"query"},
			},
		},
	}
}

func connectQdrant(addr string) (pb.PointsClient, *grpc.ClientConn, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, nil, err
	}
	return pb.NewPointsClient(conn), conn, nil
}

// SearchVectorDatabase is a stub returning an empty result set.
// Replace this implementation when a vector store is configured.
func (vt *VectorTools) SearchVectorDatabase(_ string) (string, error) {
	return `{"results":[],"note":"Vector search is not yet configured for this deployment. Add pgvector or a similar store to the Docker Compose stack and implement this function."}`, nil
}
