package tools

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
	pb "github.com/qdrant/go-client/qdrant"
	"github.com/tmc/langchaingo/llms"
)

const collectionName = "message_contexts"

// VectorTools provides semantic search capabilities over project documents.
//
// V1 status: STUB — no vector store (e.g. pgvector, Qdrant) is in the stack
// yet. The tool is registered so Gemma knows it exists; the body returns an
// empty result set with an explanatory note. When a vector store is added to
// docker_setup.yml, replace SearchVectorDatabase with a real implementation.
type VectorTools struct {
	conn *pb.Client
}

// NewVectorTools creates a VectorTools.
func NewVectorTools(addr string) (*VectorTools, error) {
	conn, err := connectQdrant(addr)
	if err != nil {
		return nil, err
	}

	return &VectorTools{conn: conn}, nil
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

func connectQdrant(addr string) (*pb.Client, error) {
	conn, err := pb.NewClient(&pb.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil {
		return nil, err
	}

	return conn, nil
}

func (vt *VectorTools) UpsertMessageContext(ctx context.Context, userID, projectId, originalMsg string, vector []float32) error {
	id := uuid.New().String()
	_, err := vt.conn.Upsert(ctx, &pb.UpsertPoints{
		CollectionName: collectionName,
		Points: []*pb.PointStruct{
			{
				Id: &pb.PointId{
					PointIdOptions: &pb.PointId_Uuid{Uuid: id},
				},
				Vectors: &pb.Vectors{
					VectorsOptions: &pb.Vectors_Vector{
						Vector: &pb.Vector{Data: vector},
					},
				},
				Payload: map[string]*pb.Value{
					"userId":          {Kind: &pb.Value_StringValue{StringValue: userID}},
					"projectId":       {Kind: &pb.Value_StringValue{StringValue: projectId}},
					"originalMessage": {Kind: &pb.Value_StringValue{StringValue: originalMsg}},
				},
			},
		},
	})
	if err != nil {
		return fmt.Errorf("qdrant upsert: %w", err)
	}
	return nil
}

func (vt *VectorTools) EnsureCollection(ctx context.Context) error {
	vectorSize := uint64(384)
	err := vt.conn.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: collectionName,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     vectorSize,
			Distance: qdrant.Distance_Cosine,
		}),
	})

	if err != nil {
		log.Println("Failed to create or collection already exist: ", err)
	}
	// Qdrant returns an error if the collection already exists — ignore it.
	// A production version should check the error code specifically.
	return nil
}

// SearchVectorDatabase is a stub returning an empty result set.
// Replace this implementation when a vector store is configured.
// sessionID is accepted to satisfy ToolFunc but is unused here.
func (vt *VectorTools) SearchVectorDatabase(_, args string) (string, error) {
	return `{"results":[],"note":"Vector search is not yet configured for this deployment. Add pgvector or a similar store to the Docker Compose stack and implement this function."}`, nil
}
