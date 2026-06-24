import { useEffect, useRef, useState, useCallback } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Task, Column } from "../../types";
import type { BoardDispatch } from "../../hooks/useBoard";
import ColumnHeader from "./ColumnHeader";
import ColumnBody from "./ColumnBody";
import ColumnFooter from "./ColumnFooter";
import ColumnDropPreview from "./ColumnDropPreview";
import "./KanbanColumn.css";

interface KanbanColumnProps {
  projectId?: String;
  column: Column;
  index: number;
  allColumns: Column[];
  tasks: Task[];
  dispatch: BoardDispatch;
  onEditTask: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

export default function KanbanColumn({
  projectId,
  column,
  index,
  allColumns,
  tasks,
  dispatch,
  onEditTask,
  onAddTask,
}: KanbanColumnProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [closestColumnEdge, setClosestColumnEdge] = useState<Edge | null>(null);
  const [columnDragPreview, setColumnDragPreview] = useState<{
    title: string;
    color: string;
  } | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ─── Column Drag and Drop ────────────────
  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({
          type: "column",
          columnId: column.id,
          title: column.title,
          color: column.color,
          index,
        }),
        onDragStart: () => setIsDraggingColumn(true),
        onDrop: () => setIsDraggingColumn(false),
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          const data = {
            type: "column",
            columnId: column.id,
            index,
          };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["left", "right"],
          });
        },
        canDrop: ({ source }) => {
          return (
            source.data.type === "column" && source.data.columnId !== column.id
          );
        },
        onDragEnter: ({ self, source }) => {
          setClosestColumnEdge(extractClosestEdge(self.data));
          setColumnDragPreview({
            title: source.data.title as string,
            color: source.data.color as string,
          });
        },
        onDrag: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestColumnEdge((current) =>
            current !== edge ? edge : current,
          );
        },
        onDragLeave: () => {
          setClosestColumnEdge(null);
          setColumnDragPreview(null);
        },
        onDrop: async ({ source, self }) => {
          setClosestColumnEdge(null);
          setColumnDragPreview(null);

          const sourceId = source.data.columnId as string;
          const targetIndex = self.data.index as number;
          const edge = extractClosestEdge(self.data);
          const toIndex = edge === "right" ? targetIndex + 1 : targetIndex;

          try {
            // 1. Remove the dragged column from the current list
            const otherColumns = allColumns.filter((c) => c.id !== sourceId);

            // 2. Clamp the index so it doesn't exceed bounds
            const clampedIndex = Math.min(toIndex, otherColumns.length);

            // 3. Find the column before and after the new insertion spot
            const prevColumn =
              clampedIndex > 0 ? otherColumns[clampedIndex - 1] : null;
            const nextColumn =
              clampedIndex < otherColumns.length
                ? otherColumns[clampedIndex]
                : null;
            const payload = {
              prevColumnId: prevColumn ? prevColumn.id : null,
              nextColumnId: nextColumn ? nextColumn.id : null,
            };

            const url = `http://localhost:8081/projects/${projectId}/${sourceId}/position`;
            console.log("REQUESTIONG URL: ", url);
            console.log("REQUESTING MOVING COLUMN: ", payload);
            const response = await fetch(url, {
              method: "PATCH",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            console.log("SERVER RETURNED: ", response.status);
          } catch (e) {
            console.error("Error when trying to update column position: ", e);
          }
        },
      }),
    );
  }, [column.id, column.title, column.color, index, dispatch]);

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
      onDrop: async ({ source, location }) => {
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
          try {
            const otherTasks = tasks.filter((t) => t.id !== taskId);
            const clampedIndex = Math.min(toIndex, otherTasks.length);

            const prevTask =
              clampedIndex > 0 ? otherTasks[clampedIndex - 1] : null;

            const nextTask =
              clampedIndex < otherTasks.length
                ? otherTasks[clampedIndex]
                : null;

            const previous_id = prevTask ? prevTask.id : null;
            const next_id = nextTask ? nextTask.id : null;

            const payload = {
              columnId: column.id,
              prevTaskId: previous_id,
              nextTaskId: next_id,
            };
            const url = `http://localhost:8081/projects/${projectId}/${column.id}/${taskId}/position`;

            console.log("REQUESTING MOVING TASK: ", payload);
            const response = await fetch(url, {
              method: "PATCH",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            console.log("SERVER RETURNED: ", response.status);
          } catch (e) {
            console.error("Error when trying to update task position: ", e);
          }
        } else {
          // dispatch({
          //   type: "MOVE_TASK",
          //   payload: { taskId, toColumnId: column.id, newOrder: tasks.length },
          // });
          try {
            const payload = {
              columnId: column.id,
              prevTaskId: null,
              nextTaskId: null,
            };
            const url = `http://localhost:8081/projects/${projectId}/${column.id}/${taskId}/position`;

            console.log("REQUESTING MOVING TASK TO EMPTY: ", payload);
            const response = await fetch(url, {
              method: "PATCH",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            console.log("SERVER RETURNED: ", response.status);
          } catch (e) {
            console.error("Error when trying to update task position: ", e);
          }
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
    <div className="kanban-column-wrapper" ref={columnRef}>
      <ColumnDropPreview
        preview={closestColumnEdge === "left" ? columnDragPreview : null}
      />
      <div
        className={`kanban-column ${isDraggingColumn ? "is-dragging" : ""}`}
        id={`column-${column.id}`}
      >
        <ColumnHeader
          column={column}
          tasksLength={tasks.length}
          isEditingTitle={isEditingTitle}
          editTitle={editTitle}
          titleInputRef={titleInputRef}
          setEditTitle={setEditTitle}
          onStartEdit={handleStartEdit}
          onSaveTitle={handleSaveTitle}
          onCancelEdit={() => setIsEditingTitle(false)}
          onDeleteColumn={handleDeleteColumn}
        />

        <ColumnBody
          bodyRef={bodyRef}
          isDragOver={isDragOver}
          tasks={tasks}
          onEditTask={onEditTask}
          onDeleteTask={handleDeleteTask}
        />

        <ColumnFooter columnId={column.id} onAddTask={onAddTask} />
      </div>
      <ColumnDropPreview
        preview={closestColumnEdge === "right" ? columnDragPreview : null}
      />
    </div>
  );
}
