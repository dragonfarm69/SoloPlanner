import { useEffect, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Task } from "../types";
import { PRIORITY_CONFIG, LABEL_COLORS } from "../types";
import "./TaskCard.css";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const priority = PRIORITY_CONFIG[task.priority];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({
        type: "task",
        taskId: task.id,
        columnId: task.columnId,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [task.id, task.columnId]);

  return (
    <div
      ref={ref}
      className={`task-card ${isDragging ? "is-dragging" : ""}`}
      id={`task-${task.id}`}
      onClick={() => onEdit(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(task);
        }
      }}
    >
      {/* Header: Title + Priority */}
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <span
          className="task-card-priority"
          style={{ color: priority.color, background: priority.bg }}
        >
          {priority.label}
        </span>
      </div>

      {/* Description preview */}
      {task.description && <p className="task-card-desc">{task.description}</p>}

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="task-card-labels">
          {task.labels.map((label) => (
            <span
              key={label}
              className="task-card-label"
              style={{ background: getLabelColor(label) }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Date + Actions */}
      <div className="task-card-footer">
        <span className="task-card-date">{formatDate(task.updatedAt)}</span>
        <div className="task-card-actions">
          <button
            className="task-card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Edit task"
            aria-label={`Edit ${task.title}`}
          >
            ✎
          </button>
          <button
            className="task-card-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Delete task"
            aria-label={`Delete ${task.title}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
