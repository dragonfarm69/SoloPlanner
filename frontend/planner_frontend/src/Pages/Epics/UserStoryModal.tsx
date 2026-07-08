import { useState, useRef, useEffect } from "react";
import type { Priority } from "../../types";
import { PRIORITY_CONFIG } from "../../types";
import "../../components/TaskModal.css";

interface UserStoryFormData {
  title: string;
  roleContext: string;
  wantContext: string;
  benefitContext: string;
  description: string;
  priority: Priority;
  status: string;
  storyPoints: number;
}

interface UserStoryModalProps {
  onSave: (data: UserStoryFormData) => void;
  onClose: () => void;
}

const priorities: Priority[] = ["low", "medium", "high", "urgent"];
const statuses = ["TODO", "IN_PROGRESS", "DONE"];

export default function UserStoryModal({ onClose, onSave }: UserStoryModalProps) {
  const [title, setTitle] = useState("");
  const [roleContext, setRoleContext] = useState("");
  const [wantContext, setWantContext] = useState("");
  const [benefitContext, setBenefitContext] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState("TODO");
  const [storyPoints, setStoryPoints] = useState<number>(0);

  const titleRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      roleContext: roleContext.trim(),
      wantContext: wantContext.trim(),
      benefitContext: benefitContext.trim(),
      description: description.trim(),
      priority,
      status,
      storyPoints,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Create user story"
        style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">New User Story</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="us-title">
              Title
            </label>
            <input
              ref={titleRef}
              id="us-title"
              className="form-input"
              placeholder='e.g. "User Login"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="us-role">
              As a... (Role)
            </label>
            <input
              id="us-role"
              className="form-input"
              placeholder="registered user"
              value={roleContext}
              onChange={(e) => setRoleContext(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="us-want">
              I want to... (Action)
            </label>
            <input
              id="us-want"
              className="form-input"
              placeholder="login securely"
              value={wantContext}
              onChange={(e) => setWantContext(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="us-benefit">
              So that... (Benefit)
            </label>
            <input
              id="us-benefit"
              className="form-input"
              placeholder="my data is safe"
              value={benefitContext}
              onChange={(e) => setBenefitContext(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="us-description">
              Description / Acceptance Criteria
            </label>
            <textarea
              id="us-description"
              className="form-textarea"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: '100px' }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="us-priority">
                Priority
              </label>
              <select
                id="us-priority"
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
              <label className="form-label" htmlFor="us-status">
                Status
              </label>
              <select
                id="us-status"
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
              <label className="form-label" htmlFor="us-points">
                Story Points
              </label>
              <input
                id="us-points"
                type="number"
                className="form-input"
                min="0"
                value={storyPoints}
                onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-left"></div>
          <div className="modal-footer-right">
            <button className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-modal-save"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              Create User Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
