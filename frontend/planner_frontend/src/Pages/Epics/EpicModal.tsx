import { useState, useRef, useEffect } from "react";
import type { Priority } from "../../types";
import { PRIORITY_CONFIG } from "../../types";
import "../../components/TaskModal.css";

interface EpicFormData {
  title: string;
  description: string;
  priority: Priority;
  status: string;
}

interface EpicModalProps {
  onSave: (data: EpicFormData) => void;
  onClose: () => void;
}

const priorities: Priority[] = ["low", "medium", "high", "urgent"];
const statuses = ["TODO", "IN_PROGRESS", "DONE"];

export default function EpicModal({ onClose, onSave }: EpicModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState("TODO");

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
      description: description.trim(),
      priority,
      status,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Create epic"
      >
        <div className="modal-header">
          <h2 className="modal-title">New Epic</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="epic-title">
              Title
            </label>
            <input
              ref={titleRef}
              id="epic-title"
              className="form-input"
              placeholder="Enter epic title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="epic-description">
              Description
            </label>
            <textarea
              id="epic-description"
              className="form-textarea"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="epic-priority">
                Priority
              </label>
              <select
                id="epic-priority"
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
              <label className="form-label" htmlFor="epic-status">
                Status
              </label>
              <select
                id="epic-status"
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
              Create Epic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
