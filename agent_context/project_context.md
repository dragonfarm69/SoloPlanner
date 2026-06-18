# Project Context: SoloPlanner

Welcome to the **SoloPlanner** codebase. This document is the single source of truth
for the project's goals, architecture, domain models, current implementation status,
and development rules. **Read this file completely before making any modifications.**

---

## 1. Project Overview & Core Vision

**SoloPlanner** is a next-generation project planning and task management application
(similar to Jira and Trello) featuring a deeply integrated **AI Project Manager &
Scrum Master (PM/SM)**.

Unlike traditional planners where users must manually click through forms to update
tasks, SoloPlanner allows users to interact with an AI Assistant via chat to manage
their workflow. The AI acts as a smart PM/SM by:

- Interpreting natural language commands (e.g., "Delay the database migration task by 2 days").
- Checking for schedule blockages, resource overallocation, or missing dependencies.
- Directly updating the project board, sprints, and task states through tool function calls.
- Conducting Scrum rituals (Daily Standups, Sprint Planning/Retrospectives) via interactive chat.

---

## 2. Technology Stack

### Backend (Java)

| Item        | Value                                                      |
| ----------- | ---------------------------------------------------------- |
| Language    | Java 21                                                    |
| Framework   | Spring Boot 4.0.6                                          |
| Build Tool  | Maven (mvnw wrapper)                                       |
| API Layer   | Spring Web MVC (`@RestController` handlers)                |
| WebSocket   | Spring WebSocket + STOMP (`spring-boot-starter-websocket`) |
| Data Layer  | Spring Data JPA / Hibernate + PostgreSQL                   |
| Auth        | Keycloak OIDC (OAuth2 Authorization Code flow)             |
| HTTP Client | Spring `RestClient` (for Keycloak calls)                   |

> **Note:** AI orchestration is **NOT** in the Java backend. It has been moved to
> a dedicated Go microservice (see below).

### AI Microservice (Go)

| Item       | Value                                                  |
| ---------- | ------------------------------------------------------ |
| Language   | Go 1.24.4                                              |
| Module     | `github.com/dragonfarm/SoloPlanner`                    |
| LLM Client | `tmc/langchaingo` v0.1.14 (Ollama adapter)             |
| WebSocket  | `gorilla/websocket` v1.5.3                             |
| Transport  | WebSocket (`/ws`) for browser ↔ AI streaming           |
| Admin HTTP | Internal HTTP (`/health`, `/admin/sessions/`) for Java |

### Frontend

| Item            | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Framework       | React 19 + TypeScript                                      |
| Build Tool      | Vite 8                                                     |
| Package Manager | pnpm                                                       |
| Drag & Drop     | `@atlaskit/pragmatic-drag-and-drop` v1.8                   |
| State           | `useReducer` hook + `localStorage` persistence             |
| Backend Comms   | REST API (Java) + WebSocket to AI microservice (port 8090) |

---

## 3. Actual Directory Structure

This reflects the **real, current state** of the repository.

```text
SoloPlanner/
├── agent_context/
│   └── project_context.md          # This file
│
├── AI_microservice/                # Go AI service — runs independently on port 8090
│   ├── go.mod
│   ├── go.sum
│   ├── main.go                     # Entry point; wires config, history, tools, orchestrator
│   ├── config/
│   │   └── config.go               # Env-var config (OLLAMA_HOST, JAVA_BACKEND_URL, PORT, etc.)
│   ├── agent/
│   │   ├── orchestrator.go         # Core agent loop: Ollama calls, tool dispatch, streaming
│   │   └── history.go              # Thread-safe in-memory ConversationStore (per-session)
│   ├── gateway/
│   │   ├── ws_server.go            # WebSocket server (/ws) — streams tokens to browser
│   │   └── http_admin.go           # Admin HTTP (/health, /admin/sessions/{id})
│   └── tools/
│       ├── registry.go             # Tool Registry — maps tool names to Go handlers
│       ├── project_tools.go        # get_user_projects, get_project_tasks, create_task
│       └── vector_tools.go         # search_vector_database (STUB — no vector store yet)
│
├── backend/
│   └── planner_helper/             # Spring Boot module (Maven)
│       ├── pom.xml
│       └── src/main/java/helper/project/planner_helper/
│           ├── PlannerHelperApplication.java
│           ├── CorsConfig.java
│           ├── WebSocketConfig.java        # STOMP broker config + JWT-based subscribe guard
│           ├── Handler/
│           │   ├── AuthHandler.java          # POST /auth/register, GET /auth/login (KC callback)
│           │   ├── ProjectHandler.java       # REST: /projects/** (tasks, columns, board)
│           │   ├── ConversationHandler.java   # REST: /projects/{id}/conversations/** (chat)
│           │   └── UserHandler.java           # REST: /users/**
│           ├── Services/
│           │   ├── TaskService.java          # Task CRUD, drag-drop ordering, WS broadcast
│           │   ├── ProjectService.java       # Project/column CRUD, board aggregation
│           │   ├── ConversationService.java  # Conversation/message CRUD, ownership access control
│           │   └── UserService.java          # User lookup, Keycloak registration
│           ├── Repository/
│           │   ├── TaskRepository.java
│           │   ├── TaskColumnRepository.java
│           │   ├── ProjectRepository.java
│           │   ├── TagRepository.java
│           │   ├── UserRepository.java
│           │   ├── ConversationRepository.java
│           │   └── MessageRepository.java
│           ├── Database/                   # JPA Entities
│           │   ├── TaskEntity.java
│           │   ├── TaskColumn.java
│           │   ├── ProjectEntity.java
│           │   ├── UserEntity.java
│           │   ├── GroupEntity.java
│           │   ├── TagEntity.java
│           │   ├── ConversationEntity.java
│           │   └── MessageEntity.java
│           ├── DTO/
│           │   ├── EntityMapper.java
│           │   ├── KeyCloakPayload.java
│           │   ├── ProjectRequestRecord.java
│           │   ├── ProjectResponseRecord.java
│           │   ├── ProjectBoardResponse.java
│           │   ├── ProjectColumnRequest.java
│           │   ├── ProjectTaskRequest.java
│           │   ├── ProjectTasksResponse.java
│           │   ├── TaskEditRequest.java
│           │   ├── TaskPositionRequest.java
│           │   ├── UserRequestRecord.java
│           │   ├── UserResponse.java
│           │   ├── UserProjectResponse.java
│           │   ├── ConversationRequest.java
│           │   ├── ConversationResponse.java
│           │   ├── MessageRequest.java
│           │   ├── MessageResponse.java
│           │   └── Events/
│           │       ├── EventPayload.java   # Sealed interface: TaskCreatedEvent, TaskMovedEvent
│           │       ├── TaskResponse.java
│           │       └── ColumnResponse.java
│           └── Types/
│               ├── Priority.java           # Enum: LOW, MEDIUM, HIGH, URGENT
│               ├── TaskStatus.java         # Enum (defined but not yet used on entity)
│               └── MessageRole.java        # Enum: USER, ASSISTANT, SYSTEM
│
├── docker/
│   ├── docker_setup.yml            # Docker Compose — PostgreSQL, Keycloak, Redis, Ollama
│   └── init.sql                    # SQL run on first Postgres startup
│
└── frontend/
    └── planner_frontend/           # React + Vite app
        ├── package.json
        ├── vite.config.ts
        └── src/
            ├── types.ts            # Shared TypeScript types
            ├── App.tsx             # Root component + router
            ├── index.css
            ├── hooks/
            │   └── useBoard.ts     # Board reducer, localStorage persistence
            ├── components/
            │   ├── Sidebar.tsx / .css
            │   ├── BoardHeader.tsx / .css
            │   ├── TaskCard.tsx / .css
            │   ├── TaskModal.tsx / .css
            │   ├── ProjectModal.tsx / .css
            │   ├── Projectcard.tsx
            │   └── AiChatPanel.tsx / .css  # AI chat UI — connects to Go WS /ws
            └── Pages/
                ├── main.tsx                # Page-level router/entry
                ├── Authorization/          # Login / register pages
                ├── Projects/               # Project listing page
                ├── Kanban/
                │   ├── KanbanBoard.tsx / .css
                │   └── KanbanColumn.tsx / .css
                └── Profile/                # User profile page
```

---

## 4. Current Implementation Status

### ✅ Backend (Java) — Core Layers Implemented

The backend is no longer a stub. All primary layers are in place:

- **JPA Entities**: `TaskEntity`, `TaskColumn`, `ProjectEntity`, `UserEntity`, `GroupEntity`, `TagEntity`, `ConversationEntity`, `MessageEntity`.
- **Repositories**: All 7 repositories are defined with custom JPQL queries where needed (e.g., `findTaskByProjectId`, `findLatestTaskByProjectId`, `findUserInProject`, `findByProjectIdAndUserId`, `findByIdAndUserId`).
- **Services**: `TaskService`, `ProjectService`, `UserService`, `ConversationService` — full business logic implemented.
  - `TaskService`: create, delete, edit, move (fractional lexicographic ordering in base-36), and WS broadcast via `SimpMessagingTemplate`.
  - `ProjectService`: create/delete project, add/delete column, get board, membership check.
  - `UserService`: find user, create user via Keycloak Admin REST API.
  - `ConversationService`: conversation CRUD, message CRUD, ownership-based access control (users can only access their own conversations).
- **Handlers (Controllers)**: `ProjectHandler` (`/projects/**`), `ConversationHandler` (`/projects/{id}/conversations/**`), `AuthHandler` (`/auth/**`), `UserHandler` (`/users/**`).
- **WebSocket**: STOMP broker configured. `WebSocketConfig` validates JWT tokens (base64-decoded) on `SUBSCRIBE` and checks project membership.
- **Auth flow**: `GET /auth/login` receives the Keycloak callback code, exchanges it for tokens, and sets `HttpOnly` cookies. `POST /auth/register` creates users in Keycloak and local DB.

> **⚠️ Known issue in `moveTask`:** The fractional ordering algorithm doesn't yet
> handle space exhaustion (midpoint of 0 or equal neighbours). A TODO exists in
> `TaskService.java` for this case.

### ✅ AI Microservice (Go) — Core Agent Loop Implemented

- **Orchestrator** (`agent/orchestrator.go`): Drives the Ollama tool-calling loop (max 6 iterations). Streams tokens via channel to the WS layer. Handles tool call ↔ text response branching.
- **ConversationStore** (`agent/history.go`): Thread-safe in-memory history per session.
- **WSServer** (`gateway/ws_server.go`): Upgrades HTTP to WebSocket. Protocol: browser sends `{type:"chat", userId, projectId, message}`; server streams `{type:"token", chunk}` then `{type:"done", fullText}`.
- **AdminServer** (`gateway/http_admin.go`): `GET /health` and `DELETE /admin/sessions/{id}` (protected by `X-Internal-Secret` header).
- **Tool Registry** (`tools/registry.go`): Central registry; panics on duplicate tool names.
- **Project Tools** (`tools/project_tools.go`): Three tools currently registered:
  - `get_user_projects` → `GET /projects?userId={id}`
  - `get_project_tasks` → `GET /projects/{projectId}/board`
  - `create_task` → `POST /projects/{projectId}/{columnId}/tasks`
- **Vector Tools** (`tools/vector_tools.go`): `search_vector_database` — **STUB** (no vector store connected yet).

### ✅ Frontend — Expanded Beyond Kanban Board

The frontend now has routing and multiple pages:

- `Pages/Authorization/` — login / register flow
- `Pages/Projects/` — project listing
- `Pages/Kanban/` — full drag-and-drop Kanban board (`KanbanBoard`, `KanbanColumn`)
- `Pages/Profile/` — user profile
- `components/AiChatPanel.tsx` — AI chat UI that connects to the Go WebSocket service

### ✅ Infrastructure — Docker Compose Configured

- `docker/docker_setup.yml` is fully written. See **Section 9** for details.
- `docker/init.sql` is mounted as the Postgres init script.

### ❌ Not Yet Started / Incomplete

- Vector store integration (pgvector, Qdrant, etc.) for semantic search
- Sprint management (domain model exists in plan but not implemented)
- Frontend ↔ Java REST API full wiring (some calls may be in-flight)
- Production secrets management (hardcoded Keycloak `client_secret` in `UserService`/`AuthHandler`)
- `TaskStatus` enum is defined in `Types/` but not yet used on `TaskEntity`
- `GroupEntity.java` is defined but not integrated into any service

---

## 5. Domain Models

### A. Task — The Fundamental Unit of Work

**JPA Entity** (`Database/TaskEntity.java`):

| Field         | Type              | Notes                                              |
| ------------- | ----------------- | -------------------------------------------------- |
| `id`          | UUID              | PK, auto-generated                                 |
| `title`       | String            | Non-null                                           |
| `description` | String            | Nullable                                           |
| `user`        | `UserEntity`      | ManyToOne — the assigned user                      |
| `project`     | `ProjectEntity`   | ManyToOne                                          |
| `column`      | `TaskColumn`      | ManyToOne — the Kanban column                      |
| `order`       | String            | Base-36 encoded integer for lexicographic ordering |
| `priority`    | `Priority` enum   | LOW / MEDIUM / HIGH / URGENT                       |
| `tags`        | `List<TagEntity>` | ManyToMany via `task_tags` join table              |
| `createdDate` | Instant           | Set by `@PrePersist`                               |
| `deadline`    | Instant           | Nullable                                           |
| `lastEdited`  | Instant           | Set by `@PreUpdate`                                |

**Frontend TypeScript type** (`types.ts`) — may diverge from the entity as the API is wired up. Treat the entity as the canonical backend truth.

### B. TaskColumn (Kanban Column)

**JPA Entity** (`Database/TaskColumn.java`):

- `id` (UUID), `name` (String), `color` (String hex), `position` (String base-36), `project` (ManyToOne `ProjectEntity`)

### C. Project

**JPA Entity** (`Database/ProjectEntity.java`):

- `id` (UUID), `title` (String), `description` (String)
- `owner` (ManyToOne `UserEntity`)
- `users` (ManyToMany `UserEntity`) — all members
- `createdDate` (Instant), `lastEdited` (Instant)

### D. User

**JPA Entity** (`Database/UserEntity.java`):

- `id` (UUID), `username` (String), `firstName` (String), `lastName` (String)

> **Note:** The user's UUID in the local DB is **not** the same as the Keycloak `sub` UUID.
> `UserRepository.findUserByUserId` looks up by a separate string field mapped to the Keycloak subject.

### E. Tag

**JPA Entity** (`Database/TagEntity.java`):

- `id` (UUID), `name` (String) — tags are project-scoped labels.

### F. Conversation

**JPA Entity** (`Database/ConversationEntity.java`):

| Field         | Type                  | Notes                                                        |
| ------------- | --------------------- | ------------------------------------------------------------ |
| `id`          | UUID                  | PK, auto-generated                                           |
| `title`       | String                | Nullable — AI can auto-generate a title later                |
| `user`        | `UserEntity`          | ManyToOne — the owner of this conversation                   |
| `project`     | `ProjectEntity`       | ManyToOne — the project this conversation belongs to          |
| `messages`    | `List<MessageEntity>` | OneToMany (cascade ALL, orphanRemoval) — hard delete on remove|
| `createdDate` | Instant               | Set by `@PrePersist`                                         |
| `lastEdited`  | Instant               | Set by `@PreUpdate`                                          |

> **Access control:** Users can only access conversations they own. Enforced via `ConversationRepository.findByIdAndUserId()` in the service layer.

### G. Message

**JPA Entity** (`Database/MessageEntity.java`):

| Field          | Type                 | Notes                                         |
| -------------- | -------------------- | --------------------------------------------- |
| `id`           | UUID                 | PK, auto-generated                            |
| `content`      | String (`@Lob`)      | Message text — `@Lob` for long AI responses   |
| `role`         | `MessageRole` enum   | `USER`, `ASSISTANT`, or `SYSTEM`              |
| `conversation` | `ConversationEntity` | ManyToOne — back-reference to parent           |
| `createdDate`  | Instant              | Set by `@PrePersist`                          |

### H. Sprint _(planned — not yet implemented)_

A time-boxed period of development work.

- `id` (UUID), `name` (String), `goal` (String)
- `startDate` (LocalDateTime), `endDate` (LocalDateTime)
- `status` (Enum: `PLANNED`, `ACTIVE`, `COMPLETED`)

---

## 6. REST API Contract (Current — `/projects/**`)

Java backend runs on **port 8081** by default.

| Method   | Path                                                                          | Description                                        |
| -------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `GET`    | `/projects?userId={uuid}`                                                     | List all projects the user belongs to              |
| `POST`   | `/projects`                                                                   | Create a new project                               |
| `GET`    | `/projects/{project_id}/board`                                                | Get full board (columns + tasks)                   |
| `POST`   | `/projects/{project_id}/columns`                                              | Add a new column to a project                      |
| `DELETE` | `/projects/{project_id}/{column_id}`                                          | Delete a column                                    |
| `POST`   | `/projects/{project_id}/{column_id}/tasks`                                    | Create a task in a column                          |
| `PATCH`  | `/projects/{project_id}/{column_id}/{task_id}`                                | Edit task fields (title, desc, priority, etc.)     |
| `PATCH`  | `/projects/{project_id}/{column_id}/{task_id}/position`                       | Move/reorder a task                                |
| `DELETE` | `/projects/{project_id}/{column_id}/{task_id}`                                | Delete a task                                      |
| `GET`    | `/projects/{project_id}/conversations?userId={uuid}`                          | List user's conversations in a project             |
| `POST`   | `/projects/{project_id}/conversations`                                        | Create a new conversation                          |
| `GET`    | `/projects/{project_id}/conversations/{conversation_id}?userId={uuid}`        | Get a specific conversation (ownership check)      |
| `DELETE` | `/projects/{project_id}/conversations/{conversation_id}?userId={uuid}`        | Delete a conversation + all messages (hard delete) |
| `GET`    | `/projects/{project_id}/conversations/{conversation_id}/messages?userId={uuid}`| Get all messages in a conversation                |
| `POST`   | `/projects/{project_id}/conversations/{conversation_id}/messages?userId={uuid}`| Add a message to a conversation                   |
| `POST`   | `/auth/register`                                                              | Register a new user (Keycloak + local DB)          |
| `GET`    | `/auth/login?code={code}`                                                     | Keycloak OAuth2 callback; sets HttpOnly cookies    |

### WebSocket (STOMP) — Java Backend

- **Endpoint**: `ws://localhost:8081/ws-connect` (SockJS fallback enabled)
- **Auth**: JWT from session attributes validated on `SUBSCRIBE`
- **Subscriptions**: `/topic/projects/{projectId}` — receives real-time board events
- **Event types** (`EventPayload` sealed interface):
  - `TaskCreatedEvent { task: TaskResponse }`
  - `TaskMovedEvent { taskId, columnId, newOrder }`

### WebSocket — AI Microservice

- **Endpoint**: `ws://localhost:8090/ws`
- **Request** (browser → Go): `{ "type": "chat", "userId": "...", "projectId": "...", "message": "..." }`
- **Response** (Go → browser):
  - `{ "type": "token", "chunk": "..." }` — streamed tokens
  - `{ "type": "done", "fullText": "..." }` — final assembled response
  - `{ "type": "error", "message": "..." }` — on failure

---

## 7. AI Microservice Architecture

The AI is a **standalone Go service** that communicates with the Java backend via its REST API. It does **not** share a database or JVM.

```
Browser
  │
  │  WebSocket /ws (port 8090)
  ▼
Go AI Microservice
  ├── gateway/WSServer         — receive chat message, stream tokens back
  ├── agent/Orchestrator       — build context, call Ollama, detect tool calls
  │     │
  │     │  HTTP (LangChainGo Ollama adapter)
  │     ▼
  │   Ollama (port 11434, model: gemma4)
  │
  └── tools/Registry
        ├── get_user_projects   ──► GET  http://localhost:8081/projects?userId=…
        ├── get_project_tasks   ──► GET  http://localhost:8081/projects/{id}/board
        ├── create_task         ──► POST http://localhost:8081/projects/{id}/{col}/tasks
        └── search_vector_database  (STUB — not connected)
```

### Registered AI Tools

| Tool Name                | Parameters                                         | Backend Call                        |
| ------------------------ | -------------------------------------------------- | ----------------------------------- |
| `get_user_projects`      | `userId`                                           | `GET /projects?userId={id}`         |
| `get_project_tasks`      | `projectId`                                        | `GET /projects/{projectId}/board`   |
| `create_task`            | `projectId, columnId, title, userId, description?` | `POST /projects/{pid}/{cid}/tasks`  |
| `search_vector_database` | `query, topK?`                                     | **STUB** — returns empty result set |

### Agent Loop

- Max **6 iterations** to prevent runaway tool chains.
- Tool call failures return a JSON error object (`{"error":"..."}`) to Ollama so it can explain the failure to the user — the loop does not crash.
- Per-session history is stored **in-memory** in `ConversationStore`. It is cleared via `DELETE /admin/sessions/{id}` (Java can call this with the `X-Internal-Secret` header).

---

## 8. Coding & Development Guidelines

All agents and contributors must follow these rules:

1. **Strict Layer Separation**: Handlers handle HTTP only. Services contain all
   business logic. Repositories handle data access only. Do not mix concerns.

2. **Readability & Maintainability**:
   - Prioritize self-documenting code over excessive comments.
   - Extract complex logic into smaller, well-named helper methods. Avoid monolithic
     methods, especially for validation, date manipulation, and status transitions.

3. **Preserve Code Integrity**: Maintain all existing comments, logger configurations,
   and annotation mappings. Never silently remove them.

4. **Fix Before Expanding**: Before adding new services or handlers, ensure existing
   ones have full test coverage and no known TODOs are left unresolved (e.g., the
   `moveTask` space-exhaustion TODO in `TaskService`).

5. **Graceful AI Error Handling**: If a tool call fails, the Go orchestrator wraps
   the error as JSON and lets Ollama relay it to the user in natural language. The Java
   backend should return structured error payloads (HTTP 4xx/5xx with a body) so the
   Go layer can surface meaningful messages.

6. **No Business Logic in the Frontend**: The React app should remain a thin display
   layer. Validation, conflict detection, and business rules belong in the backend services.

7. **No Secrets in Source Control**: The Keycloak `client_secret` is currently hardcoded
   in `UserService` and `AuthHandler`. This must be moved to environment variables or
   `application.yml` before any production deployment.

8. **Go AI Service Conventions**:
   - All tools must be registered in `main.go` before the orchestrator starts.
   - The `Registry` panics on duplicate tool names — this is intentional.
   - HTTP helpers (`doGet`, `doPost`) in `project_tools.go` share a single `http.Client`
     with a 15-second timeout. Use this pattern for all new backend tool calls.

---

## 9. Infrastructure — Docker Compose

File: `docker/docker_setup.yml`
Network: all services share the bridge network **`soloplanner_net`** and resolve each other by service name.

### Services

| Service       | Image                            | Container Name        | Host Port | Purpose                                      |
| ------------- | -------------------------------- | --------------------- | --------- | -------------------------------------------- |
| `postgres`    | `postgres:16-alpine`             | `planner_postgres`    | `5432`    | Primary relational database                  |
| `keycloak`    | `quay.io/keycloak/keycloak:24.0` | `planner_keycloak`    | `8080`    | Authentication & Authorization (OIDC/OAuth2) |
| `redis`       | `redis:7-alpine`                 | `planner_redis`       | `6379`    | Caching / session storage                    |
| `ollama`      | `ollama/ollama:latest`           | `planner_ollama`      | `11434`   | Local LLM inference server                   |
| `ollama_init` | `ollama/ollama:latest`           | `planner_ollama_init` | —         | One-shot sidecar: pulls the `gemma4` model   |

### Service Port Summary (Dev Environment)

| Service            | Port  |
| ------------------ | ----- |
| Java Spring Boot   | 8081  |
| Go AI Microservice | 8090  |
| Keycloak           | 8080  |
| PostgreSQL         | 5432  |
| Redis              | 6379  |
| Ollama             | 11434 |
| React (Vite dev)   | 5173  |

### Credentials & Connection Strings

> ⚠️ These are **local dev credentials only**. Never commit production secrets to source control.

| Service    | Detail                | Value                                          |
| ---------- | --------------------- | ---------------------------------------------- |
| PostgreSQL | Database              | `soloplanner`                                  |
| PostgreSQL | Username              | `soloplanner_user`                             |
| PostgreSQL | Password              | `soloplanner_pass`                             |
| PostgreSQL | JDBC URL              | `jdbc:postgresql://localhost:5432/soloplanner` |
| Keycloak   | Admin user            | `admin` / `admin_pass`                         |
| Keycloak   | Admin console         | `http://localhost:8080`                        |
| Keycloak   | Realm                 | `planner`                                      |
| Keycloak   | Client ID             | `authentication-cli`                           |
| Keycloak   | DB schema (inside PG) | `keycloak`                                     |
| Redis      | Password              | `redis_pass`                                   |
| Redis      | Connection            | `redis://localhost:6379`                       |
| Ollama     | API base URL          | `http://localhost:11434`                       |
| Ollama     | Model loaded          | `gemma4`                                       |

### Named Volumes

| Volume                  | Mounted In | Purpose                           |
| ----------------------- | ---------- | --------------------------------- |
| `planner_postgres_data` | `postgres` | Persists PostgreSQL data files    |
| `planner_redis_data`    | `redis`    | Persists Redis RDB snapshots      |
| `planner_ollama_data`   | `ollama`   | Persists downloaded model weights |

### Startup Order & Health Checks

- `postgres` exposes a `healthcheck` via `pg_isready`.
- `keycloak` uses `depends_on: postgres: condition: service_healthy` — it will not start until Postgres is ready.
- `redis` exposes a `healthcheck` via `redis-cli ping`.
- `ollama_init` waits for the Ollama API to respond, then runs `ollama pull gemma4`, then exits (`restart: "no"`).

### Spring Boot Configuration Snippet _(to add to `application.yml` if not present)_

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

ollama:
  base-url: http://localhost:11434
  model: gemma4
```

### Go AI Microservice Configuration (Environment Variables)

| Variable           | Default                  | Description                            |
| ------------------ | ------------------------ | -------------------------------------- |
| `OLLAMA_HOST`      | `http://localhost:11434` | Ollama server URL                      |
| `OLLAMA_MODEL`     | `gemma4`                 | Model tag to use                       |
| `JAVA_BACKEND_URL` | `http://localhost:8081`  | Java REST API base URL                 |
| `INTERNAL_SECRET`  | `changeme`               | Shared secret for `/admin/*` endpoints |
| `PORT`             | `8090`                   | TCP port the Go service listens on     |

### How to Start

```bash
# Start infrastructure (DB, Keycloak, Redis, Ollama)
docker compose -f docker/docker_setup.yml up -d

# Watch the model being pulled
docker logs -f planner_ollama_init

# Start Java backend (from backend/planner_helper)
./mvnw spring-boot:run

# Start Go AI microservice (from AI_microservice/)
go run .

# Start frontend (from frontend/planner_frontend)
pnpm dev
```
