import { useState, useEffect, useRef, useCallback } from "react";
import type { Task, Column, Priority, Tag } from "../types";
import { PRIORITY_CONFIG, LABEL_COLORS } from "../types";
import "./TaskModal.css";

interface TaskModalProps {
  projectId: string;
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
  userId: string;
  priority: Priority;
  tags: Tag[];
  columnId: string;
  deadline: string; // "" means no deadline chosen
  isArchived: boolean;
}

interface UserSummaryData {
  userId: string;
  username: string;
}

const priorities: Priority[] = ["low", "medium", "high", "urgent"];

// Computed once at module level — format: "YYYY-MM-DD"
const today = new Date().toISOString().split("T")[0];

function getLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

export default function TaskModal({
  projectId,
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
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [columnId, setColumnId] = useState(task?.columnId ?? defaultColumnId);
  const [deadline, setDeadline] = useState(task?.deadline ?? "");

  const [users, setUsers] = useState<UserSummaryData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const [createdDate, setCreatedDate] = useState<string>("");
  const [lastEdited, setLastEdited] = useState<string>("");
  const [isArchived, setIsArchived] = useState<boolean>(
    task?.isArchived ?? false,
  );

  // Tracks which destructive action is pending confirmation: null | "delete" | "archive"
  const [pendingAction, setPendingAction] = useState<
    "delete" | "archive" | null
  >(null);

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

  // Load users, tags, and full task details on component mount
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setIsLoadingUsers(true);
      setIsLoadingTags(true);

      const usersUrl = `http://localhost:8081/projects/${projectId}/users`;
      const tagsUrl = `http://localhost:8081/projects/${projectId}/tags`;
      const taskUrl = task
        ? `http://localhost:8081/projects/${projectId}/${task.columnId}/${task.id}`
        : null;

      try {
        const promises: Promise<Response>[] = [
          fetch(usersUrl, { credentials: "include" }),
          fetch(tagsUrl, { credentials: "include" }),
        ];
        if (taskUrl) {
          promises.push(fetch(taskUrl, { credentials: "include" }));
        }

        const responses = await Promise.all(promises);
        const usersRes = responses[0];
        const tagsRes = responses[1];
        const taskRes = responses[2]; // undefined if taskUrl is null

        if (!active) return;

        if (usersRes.ok) {
          const userData = await usersRes.json();
          setUsers(userData);
          if (task?.username) {
            const matched = userData.find(
              (u: UserSummaryData) => u.username === task.username,
            );
            if (matched) {
              setSelectedUserId(matched.userId);
            }
          }
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData);
          if (task?.labels) {
            setSelectedTags(task.labels);
          }
        }

        if (taskRes && taskRes.ok) {
          const taskData = await taskRes.json();
          setCreatedDate(taskData.createdDate || "");
          setLastEdited(taskData.lastEdited || "");
          setIsArchived(taskData.isArchived || false);

          // Sync with database content
          if (taskData.title) setTitle(taskData.title);
          if (taskData.description !== undefined)
            setDescription(taskData.description ?? "");
          if (taskData.priority)
            setPriority(taskData.priority.toLowerCase() as Priority);
          if (taskData.deadline) setDeadline(taskData.deadline.split("T")[0]);
          if (taskData.tags) setSelectedTags(taskData.tags);
        }
      } catch (e) {
        console.error("Error loading task details metadata:", e);
      } finally {
        if (active) {
          setIsLoadingUsers(false);
          setIsLoadingTags(false);
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [projectId, task]);

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !deadline) return;

    console.log("selected tags: ", selectedTags);

    onSave({
      title: title.trim(),
      description: description.trim(),
      userId: selectedUserId,
      priority,
      tags: selectedTags,
      columnId,
      deadline,
      isArchived,
    });

    onClose();
  }, [
    title,
    description,
    priority,
    selectedTags,
    columnId,
    deadline,
    onSave,
    selectedUserId,
    isArchived,
  ]);

  const handleArchive = useCallback(() => {
    if (!title.trim() || !deadline) return;

    console.log("archiving: ", title);

    onSave({
      title: title.trim(),
      description: description.trim(),
      userId: selectedUserId,
      priority,
      tags: selectedTags,
      columnId,
      deadline,
      isArchived: true,
    });

    onClose();
  }, [
    title,
    description,
    priority,
    selectedTags,
    columnId,
    deadline,
    onSave,
    selectedUserId,
    isArchived,
  ]);

  const handleRemoveLabel = useCallback(
    (tag: Tag) => {
      setSelectedTags(selectedTags.filter((l) => l !== tag));
    },
    [selectedTags],
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

          {/* Priority + Column + Deadline row */}
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

            <div className="form-group">
              <label className="form-label" htmlFor="task-deadline">
                Deadline
              </label>
              <input
                id="task-deadline"
                type="date"
                className="form-input form-date-input"
                value={deadline}
                min={today}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-assignee">
                Assigned to{" "}
                {isLoadingUsers && <span className="spinner-inline" />}
              </label>
              <select
                id="task-assignee"
                className="form-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isLoadingUsers}
              >
                <option value="">
                  {isLoadingUsers ? "Loading users..." : "Unassigned"}
                </option>
                {users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-labels">
              Labels {isLoadingTags && <span className="spinner-inline" />}
            </label>
            <select
              id="task-labels"
              className="form-select"
              value=""
              onChange={(e) => {
                const tagId = e.target.value;
                if (!tagId) return;
                const tagToAdd = tags.find((t) => t.id === tagId);
                if (tagToAdd && !selectedTags.some((t) => t.id === tagId)) {
                  setSelectedTags([...selectedTags, tagToAdd]);
                }
              }}
              disabled={isLoadingTags}
            >
              <option value="" disabled>
                {isLoadingTags ? "Loading labels..." : "Select a label..."}
              </option>
              {tags
                .filter((t) => !selectedTags.some((st) => st.id === t.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
            {selectedTags.length > 0 && (
              <div className="form-labels-display" style={{ marginTop: "8px" }}>
                {selectedTags.map((label) => (
                  <span
                    key={label.id}
                    className="form-label-chip"
                    style={{ background: getLabelColor(label.color) }}
                  >
                    {label.name}
                    <span
                      className="form-label-remove"
                      onClick={() => handleRemoveLabel(label)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove label ${label.name}`}
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

          {/* Metadata */}
          {isEditing && (createdDate || lastEdited) && (
            <div
              className="task-modal-metadata"
              style={{
                display: "flex",
                gap: "20px",
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "12px",
                marginTop: "12px",
              }}
            >
              {createdDate && (
                <span>
                  <strong>Created:</strong>{" "}
                  {new Date(createdDate).toLocaleString()}
                </span>
              )}
              {lastEdited && (
                <span>
                  <strong>Last Edited:</strong>{" "}
                  {new Date(lastEdited).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            {isEditing && onDelete && (
              <>
                <button
                  className="btn-modal-delete"
                  onClick={() => setPendingAction("delete")}
                  id="btn-delete-task"
                >
                  Delete
                </button>

                <button
                  className="btn-modal-archive"
                  onClick={() => setPendingAction("archive")}
                  id="btn-archive-task"
                >
                  Archive
                </button>
              </>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-modal-save"
              onClick={handleSubmit}
              disabled={!title.trim() || !deadline}
              id="btn-save-task"
            >
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirmation popup ── */}
      {pendingAction !== null && (
        <div
          className="confirm-overlay"
          id="confirm-dialog-overlay"
          onClick={() => setPendingAction(null)}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`confirm-dialog-icon ${pendingAction}`}>
              {pendingAction === "delete" ? "🗑" : "▤"}
            </div>

            <h3 id="confirm-dialog-title" className="confirm-dialog-title">
              {pendingAction === "delete" ? "Delete Task" : "Archive Task"}
            </h3>

            <p id="confirm-dialog-desc" className="confirm-dialog-message">
              {pendingAction === "delete"
                ? "This will permanently remove the task and cannot be undone."
                : "This task will be moved to the archive and removed from the board."}
            </p>

            <div className="confirm-dialog-actions">
              <button
                className="btn-confirm-cancel"
                id="btn-confirm-cancel"
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button
                className={`btn-confirm-ok ${pendingAction}`}
                id={`btn-confirm-${pendingAction}`}
                onClick={() => {
                  if (pendingAction === "delete" && task) {
                    onDelete(task.id);
                  } else {
                    handleArchive();
                  }
                  setPendingAction(null);
                }}
              >
                {pendingAction === "delete" ? "Yes, delete" : "Yes, archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
