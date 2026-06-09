import { useState, useRef, useEffect } from "react";
import type { Task, Column, Priority } from "../../types";
import type { BoardDispatch } from "../../hooks/useBoard";
import KanbanColumn from "./KanbanColumn";
import "./KanbanBoard.css";

interface KanbanBoardProps {
  projectId?: string;
  columns: Column[];
  tasks: Task[];
  dispatch: BoardDispatch;
  searchQuery: string;
  filterPriority: Priority | null;
  onEditTask: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

const COLUMN_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#34d399",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

export default function KanbanBoard({
  projectId,
  columns,
  tasks,
  dispatch,
  searchQuery,
  filterPriority,
  onEditTask,
  onAddTask,
}: KanbanBoardProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState(COLUMN_COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingColumn) {
      inputRef.current?.focus();
    }
  }, [isAddingColumn]);

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  async function fetchColumns() {
    try {
      // const projectId = "asfafsa";
      const url = `http://localhost:8081/projects/${projectId}/columns`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      console.log("Column Fetched: ", data);
    } catch (e) {
      console.error("Error when fetching columns: ", e);
    }
  }

  /** Filter tasks by search and priority, then group by column */
  function getFilteredTasks(columnId: string): Task[] {
    return tasks
      .filter((t) => t.columnId === columnId)
      .filter((t) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesDesc = t.description.toLowerCase().includes(q);
          const matchesLabel = t.labels.some((l) =>
            l.toLowerCase().includes(q),
          );
          if (!matchesTitle && !matchesDesc && !matchesLabel) return false;
        }
        if (filterPriority && t.priority !== filterPriority) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order);
  }

  async function handleAddColumn() {
    const title = newColumnTitle.trim();
    if (!title) return;

    //
    try {
      // const projectId = ;
      const url = `http://localhost:8081/projects/${projectId}/columns`;

      const payload = {
        name: title,
        color: newColumnColor,
        position: columns.length,
      };

      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("data passinG: ", payload);

      console.log("New Column created: ", data);

      await fetchColumns();
    } catch (e) {
      console.error("Error when creating new column: ", e);
      return;
    }

    dispatch({ type: "ADD_COLUMN", payload: { title, color: newColumnColor } });
    setNewColumnTitle("");
    setNewColumnColor(COLUMN_COLORS[0]);
    setIsAddingColumn(false);
  }

  return (
    <div className="kanban-board" id="kanban-board">
      {sortedColumns.map((col) => (
        <KanbanColumn
          projectId={projectId}
          key={col.id}
          column={col}
          tasks={getFilteredTasks(col.id)}
          dispatch={dispatch}
          onEditTask={onEditTask}
          onAddTask={onAddTask}
        />
      ))}

      {/* Add Column */}
      {isAddingColumn ? (
        <div className="add-column-form">
          <div className="add-column-form-title">New Column</div>
          <input
            ref={inputRef}
            className="add-column-form-input"
            placeholder="Column name..."
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddColumn();
              if (e.key === "Escape") setIsAddingColumn(false);
            }}
            aria-label="New column name"
          />

          <div className="add-column-color-row">
            <span className="add-column-color-label">Color:</span>
            <div className="add-column-color-options">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  className={`add-column-color-swatch ${newColumnColor === color ? "selected" : ""}`}
                  style={{ background: color }}
                  onClick={() => setNewColumnColor(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="add-column-form-actions">
            <button className="btn-add-column" onClick={handleAddColumn}>
              Add Column
            </button>
            <button
              className="btn-cancel-column"
              onClick={() => setIsAddingColumn(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="add-column-trigger"
          onClick={() => setIsAddingColumn(true)}
          id="add-column-btn"
        >
          <span className="add-column-trigger-icon" aria-hidden="true">
            +
          </span>
          Add Column
        </button>
      )}
    </div>
  );
}
