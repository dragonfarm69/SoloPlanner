import { useState, useEffect, useRef, useCallback } from "react";
import "./TaskModal.css";
import "./ProjectModal.css";

interface ProjectModalProps {
  project: ProjectFormData | null; // null = creating new project
  onSave: (data: ProjectFormData) => void;
  onDelete?: (projectId: string) => void;
  onClose: () => void;
}

export interface ProjectFormData {
  id?: string;
  title: string;
  ownerId: string;
  description: string;
  users: string[]; // usernames of participants
}

/** Return the first character of a username for the mini-avatar. */
function avatarInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}

export default function ProjectModal({
  project,
  onSave,
  onDelete,
  onClose,
}: ProjectModalProps) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [users, setUsers] = useState<string[]>(project?.users ?? []);
  const [userInput, setUserInput] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = project !== null;

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
      ...(project?.id ? { id: project.id } : {}),
      title: title.trim(),
      ownerId: localStorage.getItem("user_id") as string,
      description: description.trim(),
      users,
    });
  }, [title, description, users, project, onSave]);

  const handleAddUser = useCallback(() => {
    const trimmed = userInput.trim();
    if (trimmed && !users.includes(trimmed)) {
      setUsers([...users, trimmed]);
    }
    setUserInput("");
  }, [userInput, users]);

  const handleRemoveUser = useCallback(
    (username: string) => {
      setUsers(users.filter((u) => u !== username));
    },
    [users],
  );

  return (
    <div className="modal-overlay" onClick={onClose} id="project-modal-overlay">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={isEditing ? "Edit project" : "Create project"}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? "Edit Project" : "New Project"}
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
            <label className="form-label" htmlFor="project-title">
              Title
            </label>
            <input
              ref={titleRef}
              id="project-title"
              className="form-input"
              placeholder="Enter project title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-description">
              Description
            </label>
            <textarea
              id="project-description"
              className="form-textarea"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Participants / Users */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-users">
              Participants
            </label>
            <input
              id="project-users"
              className="form-input"
              placeholder="Type a username and press Enter..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUser();
                }
              }}
            />
            <span className="form-hint">Press Enter to add a participant</span>
            {users.length > 0 && (
              <div className="form-users-display">
                {users.map((username) => (
                  <span key={username} className="form-user-chip">
                    <span className="form-user-avatar">
                      {avatarInitial(username)}
                    </span>
                    {username}
                    <span
                      className="form-user-remove"
                      onClick={() => handleRemoveUser(username)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove participant ${username}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRemoveUser(username);
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
            {isEditing && onDelete && project?.id && (
              <button
                className="btn-modal-delete"
                onClick={() => onDelete(project.id!)}
                id="btn-delete-project"
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
              id="btn-save-project"
            >
              {isEditing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
