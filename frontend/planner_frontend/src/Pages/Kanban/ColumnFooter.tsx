import React from "react";

interface ColumnFooterProps {
  columnId: string;
  onAddTask: (columnId: string) => void;
}

export default function ColumnFooter({
  columnId,
  onAddTask,
}: ColumnFooterProps) {
  return (
    <div className="column-footer">
      <button
        className="column-add-btn"
        onClick={() => onAddTask(columnId)}
        id={`add-task-${columnId}`}
      >
        <span className="column-add-icon" aria-hidden="true">
          +
        </span>
        Add a card
      </button>
    </div>
  );
}
