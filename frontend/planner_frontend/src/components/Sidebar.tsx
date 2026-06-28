import { useNavigate } from "react-router-dom";
import type { Priority } from "../types";
import { PRIORITY_CONFIG } from "../types";
import "./Sidebar.css";

interface SidebarProps {
  totalTasks: number;
  completedTasks: number;
  filterPriority: Priority | null;
  onFilterPriority: (priority: Priority | null) => void;
  activeTab: "board" | "tags";
  onTabChange: (tab: "board" | "tags") => void;
}

const priorities: Priority[] = ["low", "medium", "high", "urgent"];

export default function Sidebar({
  totalTasks,
  completedTasks,
  filterPriority,
  onFilterPriority,
  activeTab,
  onTabChange,
}: SidebarProps) {
  const activeTasks = totalTasks - completedTasks;
  const navigate = useNavigate();

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div
        className="sidebar-logo"
        onClick={() => {
          navigate("/");
        }}
      >
        <div className="sidebar-logo-icon" aria-hidden="true"></div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">SoloPlanner</span>
          <span className="sidebar-logo-subtitle">Personal Board</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="sidebar-section-title">Planning</div>
        <button
          className={`sidebar-nav-item ${activeTab === "board" ? "active" : ""}`}
          id="nav-board"
          onClick={() => onTabChange("board")}
        >
          <span className="sidebar-nav-icon" aria-hidden="true">
            ⊞
          </span>
          Board
        </button>
        <button className="sidebar-nav-item" id="nav-my-tasks" disabled>
          <span className="sidebar-nav-icon" aria-hidden="true">
            ✓
          </span>
          My Tasks
        </button>
        <button className="sidebar-nav-item" id="nav-calendar" disabled>
          <span className="sidebar-nav-icon" aria-hidden="true">
            ◫
          </span>
          Calendar
        </button>

        <div className="sidebar-section-title">Manage</div>
        <button
          className={`sidebar-nav-item ${activeTab === "tags" ? "active" : ""}`}
          id="nav-tags"
          onClick={() => onTabChange("tags")}
        >
          <span className="sidebar-nav-icon" aria-hidden="true">
            🏷
          </span>
          Tags
        </button>
        <button className="sidebar-nav-item" id="nav-archive" disabled>
          <span className="sidebar-nav-icon" aria-hidden="true">
            ▤
          </span>
          Archive
        </button>
        <button className="sidebar-nav-item" id="nav-settings" disabled>
          <span className="sidebar-nav-icon" aria-hidden="true">
            ⚙
          </span>
          Settings
        </button>
      </nav>

      {/* Filters */}
      <div className="sidebar-filters">
        <div className="sidebar-filter-group">
          <div className="sidebar-filter-label">Priority Filter</div>
          <div className="sidebar-filter-chips">
            <button
              className={`filter-chip ${filterPriority === null ? "active" : ""}`}
              onClick={() => onFilterPriority(null)}
              id="filter-all"
            >
              All
            </button>
            {priorities.map((p) => (
              <button
                key={p}
                className={`filter-chip ${filterPriority === p ? "active" : ""}`}
                onClick={() =>
                  onFilterPriority(filterPriority === p ? null : p)
                }
                id={`filter-${p}`}
                style={
                  filterPriority === p
                    ? {
                        borderColor: PRIORITY_CONFIG[p].color,
                        color: PRIORITY_CONFIG[p].color,
                        background: PRIORITY_CONFIG[p].bg,
                      }
                    : undefined
                }
              >
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="sidebar-bottom">
        <div className="sidebar-stats">
          <div className="sidebar-stat">
            <div className="sidebar-stat-value">{totalTasks}</div>
            <div className="sidebar-stat-label">Total</div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-value">{activeTasks}</div>
            <div className="sidebar-stat-label">Active</div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-value">{completedTasks}</div>
            <div className="sidebar-stat-label">Done</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
