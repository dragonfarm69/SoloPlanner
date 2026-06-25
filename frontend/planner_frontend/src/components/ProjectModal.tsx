import { useState, useEffect, useRef, useCallback } from "react";
import "./TaskModal.css";
import "./ProjectModal.css";
import type { GroupData } from "../types";

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
  groupId: string;
}

export default function ProjectModal({
  project,
  onSave,
  onDelete,
  onClose,
}: ProjectModalProps) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [groupId, setGroupId] = useState(project?.groupId ?? "");
  const [groups, setGroups] = useState<GroupData[]>([]);

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = project !== null;

  // Focus title on open
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Fetch groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        const url = new URL(`http://localhost:8081/user/me/groups`);
        const response = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        }
      } catch (e) {
        console.error("Failed to fetch groups", e);
      }
    }
    fetchGroups();
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
      groupId,
    });
  }, [title, description, groupId, project, onSave]);

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

          {/* Associated Group */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-group">
              Associated Group
            </label>
            <select
              id="project-group"
              className="form-select"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            >
              <option value="">No Group (Personal Project)</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
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
