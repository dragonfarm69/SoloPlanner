import { WsProvider } from "../context/WsContext";
import Sidebar from "../components/Sidebar";
import BoardHeader from "../components/BoardHeader";
import KanbanBoard from "./Kanban/KanbanBoard";
import TagManagement from "../components/TagManagement";
import ArchivedTasksPage from "../components/ArchivedTasksPage";
import TaskModal from "../components/TaskModal";
import { useMainPage } from "./useMainPage";
import EpicsPage from "./Epics/EpicsPage";

export default function MainPage() {
  const {
    board,
    searchQuery,
    setSearchQuery,
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
        ) : activeTab === "tags" ? (
          <TagManagement projectId={projectId!} />
        ) : activeTab === "epics" ? (
          <EpicsPage projectId={projectId!} />
        ) : (
          <ArchivedTasksPage projectId={projectId!} />
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
    </WsProvider>
  );
}
