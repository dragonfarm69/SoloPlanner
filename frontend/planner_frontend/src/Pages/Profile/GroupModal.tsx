import React, { useState } from "react";

interface GroupModalProps {
  onSave: (groupName: string) => void;
  onClose: () => void;
}

export default function GroupModal({ onSave, onClose }: GroupModalProps) {
  const [groupName, setGroupName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      onSave(groupName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Create group"
      >
        <div className="modal-header">
          <h2 className="modal-title">Create New Group</h2>
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
            <label className="form-label" htmlFor="group-name-input">
              Group Name
            </label>
            <input
              type="text"
              id="group-name-input"
              className="form-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Development Team"
              autoFocus
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            <button className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-modal-save"
              onClick={handleSubmit}
              disabled={!groupName.trim()}
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
