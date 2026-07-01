import { WsProvider } from "../context/WsContext";
import Sidebar from "../components/Sidebar";
import BoardHeader from "../components/BoardHeader";
import KanbanBoard from "./Kanban/KanbanBoard";
import TagManagement from "../components/TagManagement";
import TaskModal from "../components/TaskModal";
import AiChatPanel from "../components/AiChatPanel";
import { useMainPage } from "./useMainPage";

export default function MainPage() {
  const {
    board,
    searchQuery,
    setSearchQuery,
    isChatOpen,
    setIsChatOpen,
    filterPriority,
    setFilterPriority,
    activeTab,
    setActiveTab,
    isModalOpen,
    editingTask,
    defaultColumnId,
    completedTasks,
    handleNewTask,
    handleAddTaskToColumn,
    handleEditTask,
    handleCloseModal,
    handleSaveTask,
    handleDeleteTask,
    projectId,
    dispatch,
  } = useMainPage();

  return (
    <WsProvider projectId={projectId}>
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
    </WsProvider>
  );
}
