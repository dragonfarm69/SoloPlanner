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
- Directly updating the project board, sprints, and task states through service-level function calls.
- Conducting Scrum rituals (Daily Standups, Sprint Planning/Retrospectives) via interactive chat.

---

## 2. Technology Stack

### Backend

| Item             | Value                                                |
| ---------------- | ---------------------------------------------------- |
| Language         | Java 21                                              |
| Framework        | Spring Boot 4.0.6                                    |
| Build Tool       | Maven (mvnw wrapper)                                 |
| API Layer        | Spring Web MVC (`spring-boot-starter-webmvc`)        |
| Data Layer       | Spring Data JPA / Hibernate + PostgreSQL _(planned)_ |
| AI Orchestration | Spring AI or LangChain4j _(to be decided & added)_   |

> **Note:** As of now, the `pom.xml` only contains `spring-boot-starter-webmvc`.
> JPA, Spring AI / LangChain4j, and PostgreSQL driver dependencies still need to be added.

### Frontend

| Item            | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| Framework       | React 19 + TypeScript                                          |
| Build Tool      | Vite 8                                                         |
| Package Manager | pnpm                                                           |
| Drag & Drop     | `@atlaskit/pragmatic-drag-and-drop` v1.8                       |
| State           | `useReducer` hook + `localStorage` persistence                 |
| Backend Comms   | REST API + WebSockets _(REST integration not yet implemented)_ |

---

## 3. Actual Directory Structure

This reflects the **real, current state** of the repository.

```text
SoloPlanner/
├── agent_context/
│   └── project_context.md          # This file
│
├── backend/
│   └── planner_helper/             # Spring Boot module (Maven)
│       ├── pom.xml
│       └── src/main/java/
│           ├── TaskService.java     # ⚠️ Misplaced — no package, needs moving
│           └── helper/project/
│               └── Tasks.java      # Controller (currently a stub)
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
            ├── types.ts            # All shared TypeScript types
            ├── App.tsx             # Root component, all modal/board state
            ├── hooks/
            │   └── useBoard.ts     # Board reducer, localStorage persistence
            └── components/
                ├── Sidebar.tsx / .css
                ├── BoardHeader.tsx / .css
                ├── KanbanBoard.tsx / .css
                ├── KanbanColumn.tsx / .css
                ├── TaskCard.tsx / .css
                └── TaskModal.tsx / .css
```

### Target Backend Package Structure _(not yet implemented)_

When building out the backend layers, follow this structure under
`src/main/java/helper/project/`:

```text
helper/project/
├── config/         # CORS, Security, Spring AI setup
├── controller/     # REST Controllers (TaskController, SprintController, ChatController)
├── dto/            # Request/Response DTOs (e.g., CreateTaskRequest, TaskResponse)
├── model/          # JPA Entities (Task, Sprint, Board, AIChatSession)
├── repository/     # Spring Data JPA Repositories
├── service/
│   ├── TaskService.java
│   ├── SprintService.java
│   └── ai/         # AI orchestration, tool/function implementations
└── PlannerHelperApplication.java
```

---

## 4. Current Implementation Status

### ✅ Frontend — Mostly Complete (UI Layer)

The Kanban board UI is fully functional as a **standalone client-side app**.

- A `Board` holds a list of `Column`s and `Task`s.
- State is managed via `useReducer` in `useBoard.ts` and persisted to `localStorage`.
- Supported actions: `ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK`, `MOVE_TASK`,
  `ADD_COLUMN`, `UPDATE_COLUMN`, `DELETE_COLUMN`.
- Drag-and-drop reordering is powered by `@atlaskit/pragmatic-drag-and-drop`.
- **No backend API calls exist yet.** All data lives in the browser's localStorage.

### 🚧 Backend — Early Scaffolding Only

- `Tasks.java` is a stub `@RestController` with hardcoded placeholder return values.
- `TaskService.java` is misplaced at the root `java/` level (outside any package)
  and contains only stub methods.
- No JPA entities, repositories, database configuration, or AI integration exists yet.

### ✅ Infrastructure — Docker Compose Configured

- `docker/docker_setup.yml` is fully written. See **Section 9** for details.
- `docker/init.sql` is mounted as the Postgres init script.

### ❌ Not Yet Started

- Database schema and migrations
- Security / Authentication (Keycloak realm config)
- AI chat integration
- Backend ↔ Frontend API wiring

---

## 5. Domain Models

Every agent working on this codebase must adhere to these models and their
relationships. The **Frontend TypeScript types** (in `types.ts`) are the current
ground truth; backend JPA entities must be consistent with them.

### A. Task / Issue — The Fundamental Unit of Work

**Frontend type** (`types.ts`):

```typescript
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string; // Client-generated, format: "task-{timestamp}-{counter}"
  title: string;
  description: string;
  priority: Priority; // 'low' | 'medium' | 'high' | 'urgent'
  labels: string[]; // Free-form label strings
  columnId: string; // References Column.id
  order: number; // Position within its column (0-indexed)
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number; // Unix timestamp (ms)
}
```

**Planned backend fields** (to add when building JPA entity):

- `assigneeId` (UUID, nullable)
- `sprintId` (UUID, nullable)
- `parentTaskId` (UUID, for subtasks)
- `dependencies` (Set of Task IDs that block this task)
- `storyPoints` (Integer)
- `dueDate` (LocalDateTime)

### B. Column / Board Status

**Frontend type** (`types.ts`):

```typescript
export interface Column {
  id: string;
  title: string;
  order: number; // Display order (0-indexed)
  color: string; // Hex color string (e.g., '#6366f1')
}
```

Default columns seeded by `useBoard.ts`:
| ID | Title | Color |
|---------------|-------------|-----------|
| `col-todo` | To Do | `#6366f1` |
| `col-progress`| In Progress | `#f59e0b` |
| `col-review` | In Review | `#8b5cf6` |
| `col-done` | Done | `#34d399` |

### C. Board

```typescript
export interface Board {
  columns: Column[];
  tasks: Task[];
}
```

### D. Sprint _(planned — not yet in frontend or backend)_

A time-boxed period of development work.

- `id` (UUID)
- `name` (String)
- `goal` (String)
- `startDate` (LocalDateTime)
- `endDate` (LocalDateTime)
- `status` (Enum: `PLANNED`, `ACTIVE`, `COMPLETED`)

### E. AI Chat Session _(planned)_

Tracks conversation context between a user and their AI PM.

- `id` (UUID)
- `userId` (UUID)
- `threadId` (String — maps to LLM message history)
- `lastActive` (LocalDateTime)

---

## 6. Frontend API Contract _(Target — Not Yet Implemented)_

When wiring the frontend to the backend, the React app expects these REST endpoints.
The frontend currently uses localStorage; each of these calls will replace a local
state mutation.

| Method   | Path              | Description                           |
| -------- | ----------------- | ------------------------------------- |
| `GET`    | `/api/tasks`      | Get all tasks (optionally by project) |
| `POST`   | `/api/tasks`      | Create a new task                     |
| `PUT`    | `/api/tasks/{id}` | Update a task (title, status, etc.)   |
| `DELETE` | `/api/tasks/{id}` | Delete a task                         |
| `POST`   | `/api/chat`       | Send a message to the AI PM           |
| `GET`    | `/api/sprints`    | Get all sprints                       |
| `POST`   | `/api/sprints`    | Create a new sprint                   |

All responses should use a standard envelope:

```json
{
  "data": { ... },
  "error": null
}
```

On error:

```json
{
  "data": null,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task SP-101 does not exist."
  }
}
```

---

## 7. AI PM Architectural Flow & Function Calling

The AI PM uses a **Function-Calling / Tool-Calling pattern**. The LLM acts as a
decision engine that triggers secure backend service methods — it never writes
database queries directly.

```
User → ChatController → AIService (LLM) → Tool Call → TaskService → DB
                                                ↑
                               (Result returned back to AI context)
                                                ↓
                              AIService → User (natural language reply)
```

**Example flow:**

1. User: _"Push SP-101's deadline by 3 days"_
2. `ChatController` forwards the prompt + available tool list to the LLM.
3. LLM selects the `updateTaskDueDate` tool and returns a structured call:
   `updateTaskDueDate(taskId="SP-101", days=3)`
4. `ChatController` calls `TaskService.updateTaskDueDate("SP-101", 3)`.
5. `TaskService` validates dependencies and saves the new date.
6. The result is returned to the AI context.
7. LLM replies: _"I've delayed SP-101 by 3 days. New due date: June 15."_

### Core AI Tools to Implement

| Tool Name                 | Parameters                                  |
| ------------------------- | ------------------------------------------- |
| `createTask`              | `title, description, priority, storyPoints` |
| `updateTaskStatus`        | `taskId, status`                            |
| `updateTaskDueDate`       | `taskId, date`                              |
| `assignTask`              | `taskId, assigneeId`                        |
| `removeTask`              | `taskId`                                    |
| `detectScheduleConflicts` | `sprintId`                                  |

---

## 8. Coding & Development Guidelines

All agents and contributors must follow these rules:

1. **Strict Layer Separation**: Controllers handle HTTP only. Services contain all
   business logic. Repositories handle data access only. Do not mix concerns.

2. **Readability & Maintainability**:
   - Prioritize self-documenting code over excessive comments.
   - Extract complex logic into smaller, well-named helper methods. Avoid monolithic
     methods, especially for validation, date manipulation, and status transitions.

3. **Preserve Code Integrity**: Maintain all existing comments, logger configurations,
   and annotation mappings (e.g., `@Secured` endpoints). Never silently remove them.

4. **Fix Package Structure Before Expanding**: `TaskService.java` must be moved into
   `helper/project/service/` before adding new service classes.

5. **Graceful AI Error Handling**: APIs must return structured error payloads (see
   Section 6). If the AI triggers an invalid command (e.g., scheduling a task past
   its Sprint's end date), throw a descriptive domain exception that the AI can relay
   to the user in plain language.

6. **No Business Logic in the Frontend**: The React app should remain a thin display
   layer. Validation, conflict detection, and business rules belong in the backend.

7. **AI Library Decision**: Before adding AI dependencies to `pom.xml`, decide between
   **Spring AI** and **LangChain4j** and document the choice here. Do not add both.

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

### Spring Boot Configuration Snippet _(to add to `application.yml`)_

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
          issuer-uri: http://localhost:8080/realms/<your-realm>

ollama:
  base-url: http://localhost:11434
  model: gemma4
```

### How to Start

```bash
# From the repo root
docker compose -f docker/docker_setup.yml up -d

# Watch the model being pulled
docker logs -f planner_ollama_init
```
