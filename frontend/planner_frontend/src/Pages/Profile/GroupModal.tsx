import React, { useState } from "react";

interface GroupModalProps {
  onSave: (groupName: string) => void;
  onJoin?: (groupCode: string) => void;
  onClose: () => void;
}

export default function GroupModal({
  onSave,
  onJoin,
  onClose,
}: GroupModalProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      if (groupName.trim()) {
        onSave(groupName.trim());
      }
    } else {
      if (groupCode.trim() && onJoin) {
        onJoin(groupCode.trim());
      }
    }
  };

  const isSubmitDisabled =
    mode === "create" ? !groupName.trim() : !groupCode.trim();

  const renderTabs = () => {
    return (
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "15px",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("create")}
          style={{
            flex: 1,
            padding: "10px",
            background: "none",
            border: "none",
            borderBottom:
              mode === "create"
                ? "2px solid var(--accent-light, #3b82f6)"
                : "none",
            color:
              mode === "create"
                ? "var(--text-primary)"
                : "var(--text-secondary)",
            fontWeight: mode === "create" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Create Group
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          style={{
            flex: 1,
            padding: "10px",
            background: "none",
            border: "none",
            borderBottom:
              mode === "join"
                ? "2px solid var(--accent-light, #3b82f6)"
                : "none",
            color:
              mode === "join" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: mode === "join" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Join Group
        </button>
      </div>
    );
  };

  const renderFormContent = () => {
    if (mode === "create") {
      return (
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
      );
    } else {
      return (
        <div className="form-group">
          <label className="form-label" htmlFor="group-code-input">
            Group Code
          </label>
          <input
            type="text"
            id="group-code-input"
            className="form-input"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
            placeholder="Enter invite code"
            autoFocus
            required
          />
        </div>
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={mode === "create" ? "Create group" : "Join group"}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === "create" ? "Create New Group" : "Join Group"}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {renderTabs()}

        <div className="modal-body">{renderFormContent()}</div>

        <div className="modal-footer">
          <div className="modal-footer-right">
            <button className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-modal-save"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
            >
              {mode === "create" ? "Create Group" : "Join Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
