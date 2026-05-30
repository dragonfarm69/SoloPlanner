import './BoardHeader.css';

interface BoardHeaderProps {
  taskCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask: () => void;
}

export default function BoardHeader({
  taskCount,
  searchQuery,
  onSearchChange,
  onNewTask,
}: BoardHeaderProps) {
  return (
    <header className="board-header" id="board-header">
      <div className="board-header-left">
        <h1 className="board-header-title">My Board</h1>
        <span className="board-header-count">{taskCount} tasks</span>
      </div>

      <div className="board-header-right">
        <div className="board-search">
          <span className="board-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="board-search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            id="search-input"
            aria-label="Search tasks"
          />
        </div>

        <button
          className="btn-new-task"
          onClick={onNewTask}
          id="btn-new-task"
        >
          <span className="btn-new-task-icon" aria-hidden="true">+</span>
          New Task
        </button>
      </div>
    </header>
  );
}
