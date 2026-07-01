package config

import "os"

// Config holds all runtime configuration for the AI microservice.
// Every field is populated from an environment variable so the service
// can run identically both locally and inside Docker without code changes.
type Config struct {
	// OllamaHost is the base URL of the Ollama server (includes scheme and port).
	OllamaHost string
	// OllamaModel is the model tag Ollama should load.
	OllamaModel string
	// JavaBackendURL is the base URL of the Spring Boot backend REST API.
	// Kept for non-gRPC callers (e.g. admin / health routes).
	JavaBackendURL string
	// GrpcBackendAddr is the host:port of the Java backend's gRPC server.
	// Spring gRPC defaults to port 9090 when not explicitly configured.
	GrpcBackendAddr string
	// InternalSecret is a shared secret that the Java backend must supply in
	// the X-Internal-Secret header when calling admin HTTP endpoints.
	InternalSecret string
	// Port is the TCP port this service listens on.
	Port string

	QdrantAddr string

	// Keycloak configuration
	KeycloakTokenURL     string
	KeycloakClientID     string
	KeycloakClientSecret string
	KeycloakGrantType    string
}

// Load reads configuration from environment variables, falling back to
// sensible defaults when a variable is absent or empty.
func Load() *Config {
	return &Config{
		OllamaHost:           getenv("OLLAMA_HOST", "http://localhost:11434"),
		OllamaModel:          getenv("OLLAMA_MODEL", "qwen2.5:7b"),
		JavaBackendURL:       getenv("JAVA_BACKEND_URL", "http://localhost:8081"),
		GrpcBackendAddr:      getenv("GRPC_BACKEND_ADDR", "localhost:9090"),
		InternalSecret:       getenv("INTERNAL_SECRET", "changeme"),
		Port:                 getenv("PORT", "8090"),
		QdrantAddr:           getenv("QDRANT_ADDR", "localhost:6334"),
		KeycloakTokenURL:     getenv("KEYCLOAK_TOKEN_URL", "http://localhost:8080/realms/microservices/protocol/openid-connect/token"),
		KeycloakClientID:     getenv("KEYCLOAK_CLIENT_ID", "ai-microservice"),
		KeycloakClientSecret: getenv("KEYCLOAK_CLIENT_SECRET", "X2zKzLCxj73XMkWZlcYT4Yfx8o02nm6c"),
		KeycloakGrantType:    getenv("KEYCLOAK_GRANT_TYPE", "client_credentials"),
	}
}

// getenv returns the value of the named environment variable, or fallback
// when the variable is unset or empty.
func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
