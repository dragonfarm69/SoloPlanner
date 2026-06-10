import { useEffect, useRef, useState, useCallback } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Task, Column } from "../../types";
import type { BoardDispatch } from "../../hooks/useBoard";
import TaskCard from "../../components/TaskCard";
import "./KanbanColumn.css";

interface KanbanColumnProps {
  projectId?: String;
  column: Column;
  tasks: Task[];
  dispatch: BoardDispatch;
  onEditTask: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

export default function KanbanColumn({
  projectId,
  column,
  tasks,
  dispatch,
  onEditTask,
  onAddTask,
}: KanbanColumnProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ─── Drop Target ────────────────────────
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ type: "column", columnId: column.id }),
      canDrop: ({ source }) => source.data.type === "task",
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: ({ source, location }) => {
        setIsDragOver(false);
        const taskId = source.data.taskId as string;

        // Check if the drop landed on a task card (innermost drop target)
        const innerTarget = location.current.dropTargets[0];
        if (innerTarget && innerTarget.data.type === "task") {
          // Dropped on a specific card — compute index from edge
          const targetIndex = innerTarget.data.index as number;
          const closestEdge = extractClosestEdge(innerTarget.data);
          const toIndex =
            closestEdge === "bottom" ? targetIndex + 1 : targetIndex;

          dispatch({
            type: "MOVE_TASK",
            payload: { taskId, toColumnId: column.id, toIndex },
          });
        } else {
          // Dropped on the column body directly (empty area) — append at end
          dispatch({
            type: "MOVE_TASK",
            payload: { taskId, toColumnId: column.id, toIndex: tasks.length },
          });
        }
      },
    });
  }, [column.id, tasks.length, dispatch]);

  // ─── Title Editing ──────────────────────
  const handleStartEdit = useCallback(() => {
    setIsEditingTitle(true);
    setEditTitle(column.title);
    // Focus after render
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [column.title]);

  const handleSaveTitle = useCallback(() => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== column.title) {
      dispatch({
        type: "UPDATE_COLUMN",
        payload: { id: column.id, title: trimmed },
      });
    }
    setIsEditingTitle(false);
  }, [editTitle, column.id, column.title, dispatch]);

  const handleDeleteColumn = useCallback(async () => {
    try {
      const url = `http://localhost:8081/projects/${projectId}/${column.id}`;

      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("URL: ", url);

      console.log("Column deleted: ", response.status);
    } catch (e) {
      console.error("Error when deleting columns: ", e);
      return;
    }

    if (tasks.length > 0) {
      const confirmed = window.confirm(
        `Delete "${column.title}" and its ${tasks.length} task(s)?`,
      );
      if (!confirmed) return;
    }
    dispatch({ type: "DELETE_COLUMN", payload: { id: column.id } });
  }, [column.id, column.title, tasks.length, dispatch]);

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        const url = `http://localhost:8081/projects/${projectId}/${column.id}/${taskId}`;

        const response = await fetch(url, {
          method: "DELETE",
          credentials: "include",
        });

        console.log("URL: ", url);

        console.log("task deleted: ", response.status);
      } catch (e) {
        console.error("Error when deleting task: ", e);
        return;
      }

      if (tasks.length > 0) {
        const confirmed = window.confirm(
          `Delete "${column.title}" and its ${tasks.length} task(s)?`,
        );
        if (!confirmed) return;
      }
      dispatch({ type: "DELETE_TASK", payload: { id: taskId } });
    },
    [dispatch],
  );

  return (
    <div className="kanban-column" id={`column-${column.id}`}>
      {/* Header */}
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
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
              aria-label="Column title"
            />
          ) : (
            <span className="column-title">{column.title}</span>
          )}
          <span className="column-count">{tasks.length}</span>
        </div>

        <div className="column-header-actions">
          <button
            className="column-action-btn"
            onClick={handleStartEdit}
            title="Rename column"
            aria-label={`Rename ${column.title}`}
          >
            ✎
          </button>
          <button
            className="column-action-btn delete"
            onClick={handleDeleteColumn}
            title="Delete column"
            aria-label={`Delete ${column.title}`}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body — Drop Target */}
      <div
        ref={bodyRef}
        className={`column-body ${isDragOver ? "is-drag-over" : ""}`}
      >
        {tasks.length === 0 ? (
          <div className="column-body-empty">Drop tasks here</div>
        ) : (
          tasks.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              onEdit={onEditTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>

      {/* Footer — Add Card */}
      <div className="column-footer">
        <button
          className="column-add-btn"
          onClick={() => onAddTask(column.id)}
          id={`add-task-${column.id}`}
        >
          <span className="column-add-icon" aria-hidden="true">
            +
          </span>
          Add a card
        </button>
      </div>
    </div>
  );
}
