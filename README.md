# SoloPlanner

An AI-powered project planner and task manager with a built-in **AI Project Manager & Scrum Master**. Interact with your board in plain English — no clicking through forms.

> "Delay the database migration task by 2 days and flag any blockers."

---

## How it works

A message from the browser travels through three services before anything changes on your board:

```
Browser → Go AI Microservice → Ollama (gemma4 LLM)
                    ↓ tool calls
              Java REST API → PostgreSQL
                    ↓
              WebSocket response back to browser
```

The Go service hosts the chat WebSocket and orchestrates LLM tool calls. When the model decides an action is needed (move a task, update a sprint, flag a dependency), it calls the Java backend via HTTP. Errors from the backend are fed back to the LLM as tool feedback so it can explain problems in natural language.

---

## Tech stack

| Layer           | Technology                                                         |
| :-------------- | :----------------------------------------------------------------- |
| Frontend        | React 19 + TypeScript, Vite 8, `@atlaskit/pragmatic-drag-and-drop` |
| Backend         | Spring Boot 4.0.6 / Java 21, Spring Data JPA, PostgreSQL           |
| AI microservice | Go 1.24.4, `tmc/langchaingo` v0.1.14, Ollama (`gemma4`)            |
| Auth            | Keycloak (OIDC OAuth2, HttpOnly cookies)                           |
| Cache           | Redis                                                              |

![Planner Architecture](RepoAssets/PlannerArchitecture.png)

---

## Directory structure

```
SoloPlanner/
├── agent_context/        # AI context and system documents
├── AI_microservice/      # Go AI service (LLM tool-calling orchestrator)
├── backend/
│   └── planner_helper/   # Spring Boot backend
├── docker/               # Infrastructure (PostgreSQL, Keycloak, Ollama, Redis)
└── frontend/
    └── planner_frontend/ # React + Vite client
```

---

## Getting started

### Prerequisites

- Docker & Docker Compose
- Java 21 (JDK) + Maven (wrapper included)
- Go 1.24.4+
- Node.js + pnpm

### Step 1 — Start infrastructure

```bash
docker compose -f docker/docker_setup.yml up -d
```

The first run will download the `gemma4` model via Ollama. Watch progress with:

```bash
docker logs -f planner_ollama_init
```

Wait until this completes before starting the Go service — the LLM must be available before the AI microservice can serve requests.

### Step 2 — Start the Java backend

```bash
cd backend/planner_helper
./mvnw spring-boot:run
```

Starts on **port 8081**.

<details>
<summary>Backend config snippet (application.yml)</summary>

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/soloplanner
    username: soloplanner_user
    password: soloplanner_pass
  data:
    redis:
      host: localhost
      port: 6379
      password: redis_pass
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/planner
```

</details>

### Step 3 — Start the Go AI microservice

```bash
cd AI_microservice
go run .
```

Starts on **port 8090**.

**Environment variables (all optional — defaults shown):**

| Variable           | Default                  | Description                               |
| :----------------- | :----------------------- | :---------------------------------------- |
| `OLLAMA_HOST`      | `http://localhost:11434` | Ollama inference endpoint                 |
| `OLLAMA_MODEL`     | `gemma4`                 | Model name                                |
| `JAVA_BACKEND_URL` | `http://localhost:8081`  | Java REST API base URL                    |
| `INTERNAL_SECRET`  | `changeme`               | Shared secret for service-to-service auth |
| `PORT`             | `8090`                   | Port this service listens on              |

### Step 4 — Start the frontend

```bash
cd frontend/planner_frontend
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Port reference

| Service            | Port    | Notes                                             |
| :----------------- | :------ | :------------------------------------------------ |
| React frontend     | `5173`  | Dev server                                        |
| Java Spring Boot   | `8081`  | REST API + STOMP WebSocket                        |
| Go AI microservice | `8090`  | LLM orchestrator + chat WebSocket                 |
| Keycloak           | `8080`  | IAM + user management                             |
| PostgreSQL         | `5432`  | Main database (`keycloak` schema also lives here) |
| Redis              | `6379`  | Cache + session store                             |
| Ollama             | `11434` | Inference engine                                  |

---

## Troubleshooting

**Chat sends messages but nothing happens**
The Go service couldn't reach Ollama. Check that `planner_ollama_init` has finished and that `OLLAMA_HOST` is correct.

**`401 Unauthorized` from the Java API**
Keycloak may not have finished initializing. Give it 30–60 seconds after `docker compose up` and try again.

**Port already in use**
Another process is on one of the ports above. Stop it or override the port via environment variable (Java: `SERVER_PORT`, Go: `PORT`, frontend: `vite --port XXXX`).

**Frontend shows a blank screen after login**
Check the browser console for CORS errors. Ensure Keycloak is running and the redirect URI matches `http://localhost:5173`.

---

## Development guidelines

**Layer separation**
Handlers/controllers handle HTTP mapping only. Services own all business logic, validation, and transition checks. Repositories handle persistence.

**AI error handling**
Return descriptive `4xx`/`5xx` responses with detailed error messages. The Go microservice feeds these back to the LLM as tool feedback so it can explain failures in plain language rather than returning generic errors.

**Task ordering**
Task positioning uses base-36 lexicographic ordering. Do not edit the ordering logic in `TaskService.java` without also handling space exhaustion (see the existing TODO comment).

> ⚠️ **Security — before deploying anywhere outside your local machine:** Keycloak client secrets are currently hardcoded for local development. Move them to environment variables or Spring profile-based configuration before running in staging or production.

---

## Contributing

Issues and PRs are welcome. Please open an issue first for significant changes so we can discuss the approach.
