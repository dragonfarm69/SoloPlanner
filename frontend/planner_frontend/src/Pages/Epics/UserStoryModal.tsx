import { useState, useRef, useEffect } from "react";
import type { Priority } from "../../types";
import { PRIORITY_CONFIG } from "../../types";
import "../../components/TaskModal.css";

interface UserSummaryData {
  userId: string;
  username: string;
}

interface TaskSummary {
  id: string;
  title: string;
  status: string;
}

export interface UserStoryFormData {
  title: string;
  roleContext: string;
  wantContext: string;
  benefitContext: string;
  description: string;
  priority: Priority;
  status: string;
  storyPoints: number;
  creatorId?: string;
  epicId?: string;
}

interface UserStoryModalProps {
  projectId: string;
  storyId?: string; // If provided, we are editing
  epicId?: string; // Parent epic if creating
  onSave: (data: UserStoryFormData, storyId?: string) => void;
  onDelete?: (storyId: string) => void;
  onClose: () => void;
}

const priorities: Priority[] = ["low", "medium", "high", "urgent"];
const statuses = ["TODO", "IN_PROGRESS", "DONE"];

export default function UserStoryModal({
  projectId,
  storyId,
  epicId,
  onClose,
  onSave,
  onDelete,
}: UserStoryModalProps) {
  const [title, setTitle] = useState("");
  const [roleContext, setRoleContext] = useState("");
  const [wantContext, setWantContext] = useState("");
  const [benefitContext, setBenefitContext] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState("TODO");
  const [storyPoints, setStoryPoints] = useState<number>(8);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedEpicId, setSelectedEpicId] = useState<string>(epicId || "");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [editedAt, setEditedAt] = useState<string>("");
  const [subTasks, setSubTasks] = useState<TaskSummary[]>([]);
  const [creatorName, setCreatorName] = useState<string>("");

  const [users, setUsers] = useState<UserSummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = !!storyId;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch users and story details
  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const promises: Promise<Response>[] = [
          fetch(`http://localhost:8081/projects/${projectId}/users`, {
            credentials: "include",
          }),
        ];

        if (storyId) {
          promises.push(
            fetch(
              `http://localhost:8081/projects/${projectId}/userstory/${storyId}`,
              { credentials: "include" },
            ),
          );
        }

        const responses = await Promise.all(promises);
        const usersRes = responses[0];

        if (usersRes.ok && active) {
          const userData = await usersRes.json();
          setUsers(userData);
          // Set default user to current if creating
          if (!storyId) {
            const currentId = localStorage.getItem("user_id");
            if (currentId) setSelectedUserId(currentId);
          }
        }

        if (storyId && responses[1] && responses[1].ok && active) {
          const storyData = await responses[1].json();
          setTitle(storyData.title || "");
          setRoleContext(storyData.roleContext || "");
          setWantContext(storyData.wantContext || "");
          setBenefitContext(storyData.benefitContext || "");
          setDescription(storyData.description || "");
          if (storyData.priority)
            setPriority(storyData.priority.toLowerCase() as Priority);
          if (storyData.status) setStatus(storyData.status);
          setStoryPoints(storyData.storyPoints || 0);
          setCreatedAt(storyData.createdAt || "");
          setEditedAt(storyData.editedAt || "");
          setSubTasks(storyData.tasks || []);
          setCreatorName(storyData.creatorName || "");
        }
      } catch (e) {
        console.error("Failed to load user story data", e);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [projectId, storyId]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    // Ensure creatorId is never empty if we are creating a story
    const finalCreatorId =
      selectedUserId || localStorage.getItem("user_id") || "";

    onSave(
      {
        title: title.trim(),
        roleContext: roleContext.trim(),
        wantContext: wantContext.trim(),
        benefitContext: benefitContext.trim(),
        description: description.trim(),
        priority,
        status,
        storyPoints,
        creatorId: finalCreatorId,
        epicId: selectedEpicId,
      },
      storyId,
    );
  };

  const handleArchive = () => {
    if (!title.trim() || !storyId) return;
    const finalCreatorId =
      selectedUserId || localStorage.getItem("user_id") || "";

    onSave(
      {
        title: title.trim(),
        roleContext: roleContext.trim(),
        wantContext: wantContext.trim(),
        benefitContext: benefitContext.trim(),
        description: description.trim(),
        priority,
        status: "archived",
        storyPoints,
        creatorId: finalCreatorId,
        epicId: selectedEpicId,
      },
      storyId,
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal story-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              className="badge"
              style={{
                background: "rgba(255,255,255,0.1)",
                fontSize: "12px",
                padding: "4px 8px",
              }}
            >
              {storyPoints} pts
            </span>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="User Story Title"
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "20px",
                fontWeight: "bold",
                width: "400px",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="story-modal-body">
          {/* MAIN COLUMN */}
          <div className="story-modal-main">
            <div>
              <div className="section-header">
                <div className="section-header-left">
                  <span className="section-header-icon">✨</span> Story
                  Narrative
                </div>
              </div>
              <div className="story-narrative-group">
                <div className="story-narrative-row">
                  <div className="story-narrative-label">As a</div>
                  <input
                    className="story-narrative-input"
                    placeholder="Project Manager"
                    value={roleContext}
                    onChange={(e) => setRoleContext(e.target.value)}
                  />
                </div>
                <div className="story-narrative-row">
                  <div className="story-narrative-label">I want</div>
                  <input
                    className="story-narrative-input"
                    placeholder="to see real-time updates"
                    value={wantContext}
                    onChange={(e) => setWantContext(e.target.value)}
                  />
                </div>
                <div className="story-narrative-row">
                  <div className="story-narrative-label">So that</div>
                  <input
                    className="story-narrative-input"
                    placeholder="I can make decisions"
                    value={benefitContext}
                    onChange={(e) => setBenefitContext(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="section-header">
                <div className="section-header-left">
                  <span className="section-header-icon">≡</span> Context & Notes
                </div>
              </div>
              <textarea
                className="form-textarea"
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: "120px" }}
              />
            </div>

            <div>
              <div className="section-header">
                <div className="section-header-left">
                  <span className="section-header-icon">✓</span> Linked-tasks
                </div>
                <button
                  className="new-task-btn-small"
                  onClick={() => console.log("Dummy add task clicked")}
                >
                  + New Task
                </button>
              </div>
              <div className="subtask-list">
                {subTasks.length === 0 && (
                  <div
                    style={{ color: "var(--text-tertiary)", fontSize: "12px" }}
                  >
                    No linked tasks yet.
                  </div>
                )}
                {subTasks.map((task) => (
                  <div key={task.id} className="subtask-item">
                    <div className="subtask-item-left">
                      <span>○</span> {task.title}
                    </div>
                    <div className="subtask-item-right">
                      <span
                        className={`subtask-status ${task.status.toLowerCase()}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR COLUMN */}
          <div className="story-modal-sidebar">
            <div className="form-group">
              <label
                className="form-label"
                style={{ fontSize: "10px", textTransform: "uppercase" }}
              >
                Status
              </label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ fontSize: "10px", textTransform: "uppercase" }}
              >
                Priority
              </label>
              <select
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
              <label
                className="form-label"
                style={{ fontSize: "10px", textTransform: "uppercase" }}
              >
                Assignee
              </label>
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                  <div className="avatar">{creatorName ? creatorName.charAt(0).toUpperCase() : '?'}</div>
                  <span>{creatorName || 'Unknown'}</span>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isLoading}
                >
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.username}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ fontSize: "10px", textTransform: "uppercase" }}
              >
                Story Points
              </label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={storyPoints}
                onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)}
              />
            </div>

            {isEditing && (
              <div style={{ marginTop: "auto" }}>
                <div className="metadata-row">
                  <span>Created</span>
                  <span>
                    {createdAt ? new Date(createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <div
                  className="metadata-row"
                  style={{ borderTop: "none", paddingTop: 0 }}
                >
                  <span>Last Edited</span>
                  <span>
                    {editedAt ? new Date(editedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            borderTop: "1px solid var(--border-strong)",
            background: "var(--bg-root)",
          }}
        >
          <div className="modal-footer-left">
            {isEditing && (
              <>
                <button
                  className="btn-modal-cancel"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={handleArchive}
                >
                  Archive
                </button>
                <button
                  className="btn-modal-cancel"
                  style={{ color: "var(--error)" }}
                  onClick={() => {
                    if (onDelete && storyId) {
                      if (window.confirm("Are you sure you want to delete this user story?")) {
                        onDelete(storyId);
                      }
                    }
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn-modal-cancel" onClick={onClose}>
              Close
            </button>
            <button
              className="btn-modal-save"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
