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
            tagIds: null, //null for now
            deadline: data.deadline
              ? new Date(data.deadline).toISOString()
              : null,
            priority: data.priority.toUpperCase(),
          };

          const response = await fetch(url, {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const response_data = await response.json();
          console.log("DATA AFTER EDIT TASK: ", response_data);
          if (response.status !== 201 && response.status !== 200) {
            console.error("Server errror, failed to add task: ", response_data);
            return;
          }
        } catch (e) {
          console.error("Error when trying to add task: ", e);
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
          const newOrder = lastTask ? lastTask.order + 100000 : 100000;
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
            tags: null,
            deadline: data.deadline
              ? new Date(data.deadline).toISOString()
              : null,
            priority: data.priority.toUpperCase(),
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

        dispatch({
          type: "ADD_TASK",
          payload: {
            title: data.title,
            description: data.description,
            priority: data.priority,
            labels: data.labels,
            columnId: data.columnId,
            deadline: data.deadline,
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

    // establish WebSocket Connection
    if (!projectId) return;

    const ws = new WebSocket("ws://localhost:8081/ws-connect/websocket");

    ws.onopen = () => {
      console.log("WebSocket connection established. Sending CONNECT frame...");
      // Send STOMP CONNECT frame
      const connectFrame =
        "CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\u0000";
      ws.send(connectFrame);
    };

    ws.onmessage = (event) => {
      const messageText = event.data;

      // Check if this is a CONNECTED frame
      if (messageText.startsWith("CONNECTED")) {
        console.log("STOMP Session Connected! Subscribing to topic...");
        // Send STOMP SUBSCRIBE frame
        const subscribeFrame = `SUBSCRIBE\nid:sub-0\ndestination:/topic/projects/${projectId}\n\n\u0000`;
        ws.send(subscribeFrame);
      }
      // Check if this is a MESSAGE frame
      else if (messageText.startsWith("MESSAGE")) {
        // Parse the body out of the STOMP message
        // STOMP body starts after a double newline (\n\n) and ends with the null character (\u0000)
        const parts = messageText.split("\n\n");
        if (parts.length > 1) {
          const body = parts[1].replace(/\u0000/g, "").trim();
          try {
            const data = JSON.parse(body);
            console.log("Received task moved broadcast event:", data);

            // payload: { taskId, toColumnId: column.id, toIndex },

            // Dispatch/update state when another user moves a task
            dispatch({
              type: "MOVE_TASK",
              payload: {
                taskId: data.taskId,
                toColumnId: data.columnId,
                newOrder: parseInt(data.newOrder, 36),
              },
            });
          } catch (e) {
            console.error("Failed to parse STOMP message body:", e);
          }
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
    };

    // Cleanup connection on unmount or when projectId changes
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send STOMP DISCONNECT frame before closing
        ws.send("DISCONNECT\n\n\u0000");
        ws.close();
      }
    };
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
