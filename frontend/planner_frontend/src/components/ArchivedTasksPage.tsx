import { useState, useEffect, useMemo } from "react";
import type { Task, Priority } from "../types";
import { PRIORITY_CONFIG } from "../types";
import "./ArchivedTasksPage.css";

interface ArchivedTasksPageProps {
  projectId: string;
}

// ─── Helper: map raw API task object to our Task type ───────────────────────
function mapRawTask(raw: any, columnId = ""): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? "",
    priority: (raw.priority?.toLowerCase() ?? "low") as Priority,
    labels: raw.tags ?? [],
    columnId: raw.columnId ?? columnId,
    username: raw.username ?? "",
    order: raw.order ?? "0",
    createdAt: raw.createdAt ?? 0,
    updatedAt: raw.updatedAt ?? 0,
    deadline: raw.deadline ? raw.deadline.split("T")[0] : undefined,
    isArchived: true,
  };
}

// ─── Sub-component: single archived task card ────────────────────────────────
interface ArchivedTaskCardProps {
  task: Task;
}

function ArchivedTaskCard({ task }: ArchivedTaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <article className="archived-task-card" id={`archived-task-${task.id}`}>
      <div className="archived-task-card-header">
        <span className="archived-task-title">{task.title}</span>
        <span
          className="archived-task-priority"
          style={{ color: priority.color, background: priority.bg }}
        >
          {priority.label}
        </span>
      </div>

      {task.description && (
        <p className="archived-task-description">{task.description}</p>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="archived-task-labels">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="archived-task-label-badge"
              style={{ background: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="archived-task-card-footer">
        <span className="archived-task-username">@{task.username}</span>
        {task.deadline && (
          <span className="archived-task-deadline">📅 {task.deadline}</span>
        )}
        <span className="archived-task-badge">Archived</span>
      </div>
    </article>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function ArchivedTasksPage({ projectId }: ArchivedTasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);

  const priorities: Priority[] = ["low", "medium", "high", "urgent"];

  // ─── Fetch archived tasks ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchArchivedTasks() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:8081/projects/${projectId}/archived`,
          { credentials: "include" },
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch archived tasks (${response.status})`);
        }
        const data = await response.json();

        // The API may return a plain array or a wrapped object; handle both.
        const rawList: any[] = Array.isArray(data) ? data : (data.tasks ?? []);
        setTasks(rawList.map((raw) => mapRawTask(raw)));
      } catch (err: any) {
        setError(err.message ?? "An error occurred while fetching archived tasks.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchArchivedTasks();
  }, [projectId]);

  // ─── Derived: filtered + searched tasks ───────────────────────────────────
  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        query === "" ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query);
      const matchesPriority =
        filterPriority === null || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, filterPriority]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="archived-page-container" id="archived-tasks-page">
      {/* Header */}
      <div className="archived-page-header">
        <div className="archived-page-header-text">
          <h1 className="archived-page-title">Archive</h1>
          <p className="archived-page-subtitle">
            {isLoading
              ? "Loading archived tasks…"
              : `${tasks.length} archived task${tasks.length !== 1 ? "s" : ""} in this project`}
          </p>
        </div>
      </div>

      {/* Controls: search + priority filter */}
      <div className="archived-page-controls">
        <div className="archived-search-wrapper">
          <span className="archived-search-icon" aria-hidden="true">⌕</span>
          <input
            id="archived-search-input"
            type="search"
            className="archived-search-input"
            placeholder="Search archived tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search archived tasks"
          />
        </div>

        <div className="archived-filter-chips" role="group" aria-label="Filter by priority">
          <button
            className={`archived-filter-chip ${filterPriority === null ? "active" : ""}`}
            onClick={() => setFilterPriority(null)}
            id="archived-filter-all"
          >
            All
          </button>
          {priorities.map((p) => (
            <button
              key={p}
              id={`archived-filter-${p}`}
              className={`archived-filter-chip ${filterPriority === p ? "active" : ""}`}
              style={
                filterPriority === p
                  ? {
                      borderColor: PRIORITY_CONFIG[p].color,
                      color: PRIORITY_CONFIG[p].color,
                      background: PRIORITY_CONFIG[p].bg,
                    }
                  : undefined
              }
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="archived-state-container">
          <div className="archived-spinner" aria-label="Loading" />
          <p className="archived-state-text">Loading archived tasks…</p>
        </div>
      ) : error ? (
        <div className="archived-state-container archived-state-error">
          <span className="archived-state-icon" aria-hidden="true">⚠</span>
          <p className="archived-state-text">{error}</p>
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="archived-state-container">
          <span className="archived-state-icon" aria-hidden="true">▤</span>
          <p className="archived-state-text">
            {tasks.length === 0
              ? "No tasks have been archived yet."
              : "No archived tasks match your filters."}
          </p>
        </div>
      ) : (
        <div className="archived-tasks-grid">
          {visibleTasks.map((task) => (
            <ArchivedTaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
