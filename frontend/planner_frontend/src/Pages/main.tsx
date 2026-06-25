import { useState, useCallback, useEffect } from "react";
import { useBoard } from "../hooks/useBoard";
import { StompProvider } from "../context/StompContext";
import { useStompMessages } from "../hooks/useStompMessages";
import Sidebar from "../components/Sidebar";
import BoardHeader from "../components/BoardHeader";
import KanbanBoard from "./Kanban/KanbanBoard";
import TagManagement from "../components/TagManagement";
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
  const [activeTab, setActiveTab] = useState<"board" | "tags">("board");

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
    async (data: TaskFormData) => {
      if (editingTask) {
        const url = `http://localhost:8081/projects/${projectId}/${data.columnId}/${editingTask.id}`;
        try {
          const userId = localStorage.getItem("user_id");
          if (!userId) {
            console.error("User Id not found");
            return;
          }

          const payload = {
            title: data.title,
            description: data.description,
            userId: userId,
            tagIds: data.tags.map((tag) => tag.id),
            deadline: data.deadline
              ? new Date(data.deadline).toISOString()
              : null,
            priority: data.priority.toUpperCase(),
            isArchived: data.isArchived,
          };

          await fetch(url, {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.error("Error when trying to edit task: ", e);
          return;
        }

        dispatch({
          type: "UPDATE_TASK",
          payload: { id: editingTask.id, ...data },
        });
        // If column changed, move the task
        if (data.columnId !== editingTask.columnId) {
          const destTasks = getColumnTasks(data.columnId);
          const lastTask = destTasks[destTasks.length - 1];
          const newOrder = lastTask
            ? (parseInt(lastTask.order, 36) + 100000).toString(36)
            : (100000).toString(36);
          dispatch({
            type: "MOVE_TASK",
            payload: {
              taskId: editingTask.id,
              toColumnId: data.columnId,
              newOrder: newOrder,
            },
          });
        }
      } else {
        // do post request to backend to save task
        let url = `http://localhost:8081/projects/${projectId}/${data.columnId}/tasks`;
        try {
          const userId = localStorage.getItem("user_id");
          if (!userId) {
            console.error("User Id not found");
            return;
          }

          const payload = {
            title: data.title,
            description: data.description,
            userId: userId,
            tagIds: data.tags.map((tag) => tag.id),
            deadline: data.deadline
              ? new Date(data.deadline).toISOString()
              : null,
            priority: data.priority.toUpperCase(),
            isArchived: data.isArchived,
          };

          const response = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const response_data = await response.json();
          console.log("DATA AFTER CREATE TASK: ", data);

          if (response.status !== 201 && response.status !== 200) {
            console.error("Server errror, failed to add task: ", response_data);
            return;
          }
        } catch (e) {
          console.error("Error when trying to add task: ", e);
          return;
        }
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

  // ─── Fetch initial board data ───────────────
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
            labels: t.tags ?? [],
            username: t.username,
            columnId: col.id, // inject from parent column
            order: t.order, // order of the task in column
            deadline: t.deadline ? t.deadline.split("T")[0] : "",
          })),
        );
        console.log("loaded: ", data);
        dispatch({ type: "LOAD_BOARD", payload: { columns, tasks } });
      } catch (error) {
        console.log("error when fetching task: ", error);
      }
    }
    fetchTasks();
  }, [projectId, dispatch]);

  // ─── Real-time board events via STOMP ───────
  // The WebSocket connection is owned by <StompProvider> below.
  // This hook registers a listener that dispatches board actions when
  // another user creates, edits, deletes, or moves a task.
  const handleStompMessage = useCallback(
    (raw: unknown) => {
      const data = raw as {
        type: string;
        task?: any;
        taskId?: string;
        columnId?: string;
        newOrder?: string;
      };

      console.log("Received broadcast event:", data);

      switch (data.type) {
        // Another user created a task — add it to local state.
        // Note: ADD_TASK generates a new local id. The server id
        // (data.task.id) is stored in a comment for traceability;
        // local state syncs fully on next page load.
        case "TASK_CREATED":
          dispatch({
            type: "ADD_TASK",
            payload: {
              id: data.task.id,
              title: data.task.title,
              description: data.task.description ?? "",
              priority: (data.task.priority?.toLowerCase() ??
                "low") as Priority,
              username: data.task.username,
              labels: data.task.tags ?? [],
              columnId: data.task.columnId,
              deadline: data.task.deadline
                ? data.task.deadline.split("T")[0]
                : undefined,
            },
          });
          break;

        // Another user deleted a task — remove it from local state.
        case "TASK_DELETED":
          dispatch({
            type: "DELETE_TASK",
            payload: { id: data.task.id },
          });
          break;

        // Another user edited a task — patch the existing task in state.
        case "TASK_EDITED":
          dispatch({
            type: "UPDATE_TASK",
            payload: {
              id: data.task.id,
              title: data.task.title,
              username: data.task.username,
              description: data.task.description ?? "",
              priority: (data.task.priority?.toLowerCase() ??
                "low") as Priority,
              labels: data.task.tags ?? [],
              deadline: data.task.deadline
                ? data.task.deadline.split("T")[0]
                : undefined,
            },
          });
          break;

        // Another user moved a task — update its column and order.
        case "TASK_MOVED":
          dispatch({
            type: "MOVE_TASK",
            payload: {
              taskId: data.taskId!,
              toColumnId: data.columnId!,
              newOrder: data.newOrder!,
            },
          });
          break;

        case "COLUMN_MOVED":
          dispatch({
            type: "MOVE_COLUMN",
            payload: {
              columnId: data.columnId!,
              newOrder: data.newOrder!,
            },
          });
          break;

        default:
          console.warn("Unhandled broadcast event type:", data.type, data);
          break;
      }
    },
    [dispatch],
  );

  useStompMessages(handleStompMessage);

  return (
    <StompProvider projectId={projectId}>
      <Sidebar
        totalTasks={board.tasks.length}
        completedTasks={completedTasks}
        filterPriority={filterPriority}
        onFilterPriority={setFilterPriority}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {activeTab === "board" ? (
          <>
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
          </>
        ) : (
          <TagManagement projectId={projectId!} />
        )}
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
    </StompProvider>
  );
}
