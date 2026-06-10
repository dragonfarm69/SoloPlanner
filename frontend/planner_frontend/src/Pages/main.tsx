import { useState, useCallback, useEffect } from "react";
import { useBoard } from "../hooks/useBoard";
import Sidebar from "../components/Sidebar";
import BoardHeader from "../components/BoardHeader";
import KanbanBoard from "./Kanban/KanbanBoard";
import TaskModal from "../components/TaskModal";
import AiChatPanel from "../components/AiChatPanel";
import type { Task, Priority, Column } from "../types";
import type { TaskFormData } from "../components/TaskModal";
import { useParams } from "react-router-dom";

export default function MainPage() {
  const { board, dispatch, getColumnTasks } = useBoard();

  // ─── UI State ───────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);

  // ─── Modal State ────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState("");

  // ─── Derived Data ───────────────────────
  const doneColumn = board.columns.find(
    (c) => c.title.toLowerCase() === "done",
  );
  const completedTasks = doneColumn ? getColumnTasks(doneColumn.id).length : 0;

  // ─── Modal Handlers ────────────────────

  const handleNewTask = useCallback(() => {
    setEditingTask(null);
    setDefaultColumnId(board.columns[0]?.id ?? "");
    setIsModalOpen(true);
  }, [board.columns]);

  const handleAddTaskToColumn = useCallback(async (columnId: string) => {
    setEditingTask(null);
    setDefaultColumnId(columnId);
    setIsModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleSaveTask = useCallback(
    (data: TaskFormData) => {
      if (editingTask) {
        dispatch({
          type: "UPDATE_TASK",
          payload: { id: editingTask.id, ...data },
        });
        // If column changed, move the task
        if (data.columnId !== editingTask.columnId) {
          const destTasks = getColumnTasks(data.columnId);
          dispatch({
            type: "MOVE_TASK",
            payload: {
              taskId: editingTask.id,
              toColumnId: data.columnId,
              toIndex: destTasks.length,
            },
          });
        }
      } else {
        // do post request to backend to save task

        dispatch({
          type: "ADD_TASK",
          payload: {
            title: data.title,
            description: data.description,
            priority: data.priority,
            labels: data.labels,
            columnId: data.columnId,
          },
        });
      }
      handleCloseModal();
    },
    [editingTask, dispatch, getColumnTasks, handleCloseModal],
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      dispatch({ type: "DELETE_TASK", payload: { id: taskId } });
      handleCloseModal();
    },
    [dispatch, handleCloseModal],
  );

  const { projectId } = useParams<{ projectId: string }>();
  useEffect(() => {
    async function fetchTasks() {
      try {
        const url = `http://localhost:8081/projects/${projectId}/board`;
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        const columns: Column[] = data.columns.map((col: any) => ({
          id: col.id,
          title: col.name, // "name" → "title"
          order: col.position, // "position" → "order"
          color: col.color,
        }));

        const tasks: Task[] = data.columns.flatMap((col: any) =>
          col.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description ?? "",
            priority: (t.priority?.toLowerCase() ?? "low") as Priority, // "HIGH" → "high"
            labels: [], // not implemented yet
            columnId: col.id, // inject from parent column
            order: t.order, // order of the task in column
            deadline: t.deadline ? t.deadline.split("T")[0] : "",
          })),
        );
        console.log("tasks: ", data);
        dispatch({ type: "LOAD_BOARD", payload: { columns, tasks } });
      } catch (error) {
        console.log("error when fetching task: ", error);
      }
    }
    fetchTasks();
  }, [projectId]);

  return (
    <>
      <Sidebar
        totalTasks={board.tasks.length}
        completedTasks={completedTasks}
        filterPriority={filterPriority}
        onFilterPriority={setFilterPriority}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <BoardHeader
          taskCount={board.tasks.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewTask={handleNewTask}
        />

        <KanbanBoard
          projectId={projectId}
          columns={board.columns}
          tasks={board.tasks}
          dispatch={dispatch}
          searchQuery={searchQuery}
          filterPriority={filterPriority}
          onEditTask={handleEditTask}
          onAddTask={handleAddTaskToColumn}
        />
      </main>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          columns={board.columns}
          defaultColumnId={defaultColumnId}
          onSave={handleSaveTask}
          onDelete={editingTask ? handleDeleteTask : undefined}
          onClose={handleCloseModal}
        />
      )}

      {/* AI Chat */}
      {!isChatOpen && (
        <button
          className="chat-fab"
          onClick={() => setIsChatOpen(true)}
          aria-label="Open AI chat"
          id="chat-fab"
        >
          ✦
        </button>
      )}
      {isChatOpen && (
        <AiChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}
    </>
  );
}
