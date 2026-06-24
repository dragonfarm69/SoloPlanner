import React from "react";
import type { Column } from "../../types";

interface ColumnHeaderProps {
  column: Column;
  tasksLength: number;
  isEditingTitle: boolean;
  editTitle: string;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  setEditTitle: (val: string) => void;
  onStartEdit: () => void;
  onSaveTitle: () => void;
  onCancelEdit: () => void;
  onDeleteColumn: () => void;
}

export default function ColumnHeader({
  column,
  tasksLength,
  isEditingTitle,
  editTitle,
  titleInputRef,
  setEditTitle,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onDeleteColumn,
}: ColumnHeaderProps) {
  return (
    <div
      className="column-header"
      style={{ "--col-color": column.color } as React.CSSProperties}
    >
      <style>{`#column-${column.id} .column-header::before { background: ${column.color}; }`}</style>
      <div className="column-header-left">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            className="column-title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={onSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveTitle();
              if (e.key === "Escape") onCancelEdit();
            }}
            aria-label="Column title"
          />
        ) : (
          <span className="column-title">{column.title}</span>
        )}
        <span className="column-count">{tasksLength}</span>
      </div>

      <div className="column-header-actions">
        <button
          className="column-action-btn"
          onClick={onStartEdit}
          title="Rename column"
          aria-label={`Rename ${column.title}`}
        >
          ✎
        </button>
        <button
          className="column-action-btn delete"
          onClick={onDeleteColumn}
          title="Delete column"
          aria-label={`Delete ${column.title}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
