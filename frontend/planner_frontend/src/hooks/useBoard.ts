import { useReducer, useEffect, useCallback } from "react";
import type { Board, Task, Column } from "../types";

// ─── Constants ────────────────────────────────────────

const STORAGE_KEY = "soloplanner-board";

const DEFAULT_COLUMNS: Column[] = [
  { id: "col-todo", title: "To Do", order: 0, color: "#6366f1" },
  { id: "col-progress", title: "In Progress", order: 1, color: "#f59e0b" },
  { id: "col-review", title: "In Review", order: 2, color: "#8b5cf6" },
  { id: "col-done", title: "Done", order: 3, color: "#34d399" },
];

const DEFAULT_BOARD: Board = {
  columns: DEFAULT_COLUMNS,
  tasks: [],
};

// ─── ID Generator ─────────────────────────────────────

let counter = 0;
export function generateId(prefix: string = "item"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

// ─── Action Types ─────────────────────────────────────

type BoardAction =
  | {
      type: "ADD_TASK";
      payload: Omit<Task, "id" | "order" | "createdAt" | "updatedAt">;
    }
  | { type: "UPDATE_TASK"; payload: { id: string } & Partial<Task> }
  | { type: "DELETE_TASK"; payload: { id: string } }
  | {
      type: "MOVE_TASK";
      payload: { taskId: string; toColumnId: string; toIndex: number };
    }
  | { type: "ADD_COLUMN"; payload: { title: string; color: string } }
  | { type: "UPDATE_COLUMN"; payload: { id: string } & Partial<Column> }
  | { type: "DELETE_COLUMN"; payload: { id: string } };

// ─── Helpers ──────────────────────────────────────────

function getTasksForColumn(tasks: Task[], columnId: string): Task[] {
  return tasks
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.order - b.order);
}

function reorderTasksInColumn(tasks: Task[], columnId: string): Task[] {
  const columnTasks = getTasksForColumn(tasks, columnId);
  const otherTasks = tasks.filter((t) => t.columnId !== columnId);
  const reordered = columnTasks.map((t, i) => ({ ...t, order: i }));
  return [...otherTasks, ...reordered];
}

// ─── Reducer ──────────────────────────────────────────

function boardReducer(state: Board, action: BoardAction): Board {
  const now = Date.now();

  switch (action.type) {
    case "ADD_TASK": {
      const columnTasks = getTasksForColumn(
        state.tasks,
        action.payload.columnId,
      );
      const newTask: Task = {
        ...action.payload,
        id: generateId("task"),
        order: columnTasks.length,
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, tasks: [...state.tasks, newTask] };
    }

    case "UPDATE_TASK": {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: now } : t,
        ),
      };
    }

    case "DELETE_TASK": {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (!task) return state;
      const filtered = state.tasks.filter((t) => t.id !== action.payload.id);
      return { ...state, tasks: reorderTasksInColumn(filtered, task.columnId) };
    }

    case "MOVE_TASK": {
      const { taskId, toColumnId, toIndex } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      const fromColumnId = task.columnId;

      // Remove task from its current position
      let updatedTasks = state.tasks.filter((t) => t.id !== taskId);

      // Reorder the source column
      updatedTasks = reorderTasksInColumn(updatedTasks, fromColumnId);

      // Get destination column tasks and insert at the right position
      const destTasks = getTasksForColumn(updatedTasks, toColumnId);
      const clampedIndex = Math.min(toIndex, destTasks.length);

      // Insert the moved task
      const movedTask: Task = {
        ...task,
        columnId: toColumnId,
        order: clampedIndex,
        updatedAt: now,
      };

      // Shift subsequent tasks in the destination column
      updatedTasks = updatedTasks.map((t) => {
        if (t.columnId === toColumnId && t.order >= clampedIndex) {
          return { ...t, order: t.order + 1 };
        }
        return t;
      });

      updatedTasks.push(movedTask);
      return { ...state, tasks: updatedTasks };
    }

    case "ADD_COLUMN": {
      const newColumn: Column = {
        id: generateId("col"),
        title: action.payload.title,
        color: action.payload.color,
        order: state.columns.length,
      };
      return { ...state, columns: [...state.columns, newColumn] };
    }

    case "UPDATE_COLUMN": {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        columns: state.columns.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      };
    }

    case "DELETE_COLUMN": {
      return {
        ...state,
        columns: state.columns
          .filter((c) => c.id !== action.payload.id)
          .map((c, i) => ({ ...c, order: i })),
        tasks: state.tasks.filter((t) => t.columnId !== action.payload.id),
      };
    }

    default:
      return state;
  }
}

// ─── Load from Storage ────────────────────────────────

function loadBoard(): Board {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Board;
      if (parsed.columns && parsed.tasks) return parsed;
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return DEFAULT_BOARD;
}

// ─── Hook ─────────────────────────────────────────────

export function useBoard() {
  const [board, dispatch] = useReducer(boardReducer, null, loadBoard);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const getColumnTasks = useCallback(
    (columnId: string) => getTasksForColumn(board.tasks, columnId),
    [board.tasks],
  );

  return { board, dispatch, getColumnTasks };
}

export type BoardDispatch = React.Dispatch<BoardAction>;
