import { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Task, Priority } from "../types";
import { PRIORITY_CONFIG, LABEL_COLORS } from "../types";
import "./TaskCard.css";

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function getLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

export default function TaskCard({
  task,
  index,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [dragPreview, setDragPreview] = useState<{ title: string; priority: Priority } | null>(null);

  const priority = PRIORITY_CONFIG[task.priority];

  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    const cardEl = cardRef.current;
    if (!wrapperEl || !cardEl) return;

    return combine(
      draggable({
        element: cardEl,
        getInitialData: () => ({
          type: "task",
          taskId: task.id,
          columnId: task.columnId,
          index,
          title: task.title,
          priority: task.priority,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: wrapperEl,
        getData: ({ input, element }) => {
          const data = {
            type: "task",
            taskId: task.id,
            columnId: task.columnId,
            index,
          };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["top", "bottom"],
          });
        },
        canDrop: ({ source }) => {
          // Don't allow dropping on itself
          return source.data.type === "task" && source.data.taskId !== task.id;
        },
        onDragEnter: ({ self, source }) => {
          setClosestEdge(extractClosestEdge(self.data));
          setDragPreview({
            title: source.data.title as string,
            priority: source.data.priority as Priority,
          });
        },
        onDrag: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge((current) => (current !== edge ? edge : current));
        },
        onDragLeave: () => {
          setClosestEdge(null);
          setDragPreview(null);
        },
        onDrop: () => {
          setClosestEdge(null);
          setDragPreview(null);
        },
      }),
    );
  }, [task.id, task.columnId, index]);

  const renderDropPreview = () => {
    if (!dragPreview) return null;
    const p = PRIORITY_CONFIG[dragPreview.priority];
    return (
      <div className="drop-indicator-card">
        <div className="drop-indicator-card-header">
          <span className="drop-indicator-card-title">{dragPreview.title}</span>
          <span
            className="drop-indicator-card-priority"
            style={{ color: p.color, background: p.bg }}
          >
            {p.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="task-card-wrapper" ref={wrapperRef}>
      {closestEdge === "top" && renderDropPreview()}
      <div
        ref={cardRef}
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
        {task.description && (
          <p className="task-card-desc">{task.description}</p>
        )}

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
          <span className="task-card-date">{task.deadline}</span>
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
      {closestEdge === "bottom" && renderDropPreview()}
    </div>
  );
}
