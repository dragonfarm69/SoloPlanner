import { useState, useEffect, useRef, useCallback } from "react";
import type { Task, Column, Priority } from "../types";
import { PRIORITY_CONFIG, LABEL_COLORS } from "../types";
import "./TaskModal.css";

interface TaskModalProps {
  task: Task | null; // null = creating new task
  columns: Column[];
  defaultColumnId: string;
  onSave: (data: TaskFormData) => void;
  onDelete?: (taskId: string) => void;
  onClose: () => void;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  labels: string[];
  columnId: string;
}

const priorities: Priority[] = ["low", "medium", "high", "urgent"];

function getLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

export default function TaskModal({
  task,
  columns,
  defaultColumnId,
  onSave,
  onDelete,
  onClose,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? "medium",
  );
  const [labels, setLabels] = useState<string[]>(task?.labels ?? []);
  const [columnId, setColumnId] = useState(task?.columnId ?? defaultColumnId);
  const [labelInput, setLabelInput] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = task !== null;

  // Focus title on open
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      labels,
      columnId,
    });
  }, [title, description, priority, labels, columnId, onSave]);

  const handleAddLabel = useCallback(() => {
    const trimmed = labelInput.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
    }
    setLabelInput("");
  }, [labelInput, labels]);

  const handleRemoveLabel = useCallback(
    (label: string) => {
      setLabels(labels.filter((l) => l !== label));
    },
    [labels],
  );

  return (
    <div className="modal-overlay" onClick={onClose} id="task-modal-overlay">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={isEditing ? "Edit task" : "Create task"}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Title
            </label>
            <input
              ref={titleRef}
              id="task-title"
              className="form-input"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-description">
              Description
            </label>
            <textarea
              id="task-description"
              className="form-textarea"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Priority + Column row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-column">
                Column
              </label>
              <select
                id="task-column"
                className="form-select"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-labels">
              Labels
            </label>
            <input
              id="task-labels"
              className="form-input"
              placeholder="Type a label and press Enter..."
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLabel();
                }
              }}
            />
            <span className="form-hint">Press Enter to add a label</span>
            {labels.length > 0 && (
              <div className="form-labels-display">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="form-label-chip"
                    style={{ background: getLabelColor(label) }}
                  >
                    {label}
                    <span
                      className="form-label-remove"
                      onClick={() => handleRemoveLabel(label)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove label ${label}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRemoveLabel(label);
                      }}
                    >
                      ✕
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            {isEditing && onDelete && (
              <button
                className="btn-modal-delete"
                onClick={() => {
                  if (task) onDelete(task.id);
                }}
                id="btn-delete-task"
              >
                Delete
              </button>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-modal-save"
              onClick={handleSubmit}
              disabled={!title.trim()}
              id="btn-save-task"
            >
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
