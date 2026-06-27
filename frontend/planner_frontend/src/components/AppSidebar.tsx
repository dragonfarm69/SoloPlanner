import { useNavigate } from "react-router-dom";
import type { GroupData } from "../types";
import GroupSelector from "../Pages/Profile/GroupSelector";
import "../Pages/Profile/UserProfile.css";

/* ──────────────────────────────────────────────────────────
   SVG Icons
   ────────────────────────────────────────────────────────── */

function AppLogoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      width="15"
      height="15"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconProjects() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="17"
      height="17"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconGroups() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="17"
      height="17"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="17"
      height="17"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="17"
      height="17"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="17"
      height="17"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

interface AppSidebarProps {
  groups: GroupData[];
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  onCreateGroupClick: () => void;
}

export default function AppSidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroupClick,
}: AppSidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  return (
    <aside className="profile-sidebar">
      {/* Top: Logo + Group Selector + Navigation */}
      <div className="profile-sidebar-top">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <AppLogoIcon />
          </div>
          <span className="sidebar-logo-text">SoloPlanner</span>
        </div>

        <GroupSelector
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={onSelectGroup}
          onCreateGroupClick={onCreateGroupClick}
        />

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className="sidebar-nav-item active" aria-current="page">
            <span className="sidebar-nav-icon">
              <IconProjects />
            </span>
            Projects
          </button>
          <button
            className="sidebar-nav-item disabled"
            disabled
            aria-disabled="true"
          >
            <span className="sidebar-nav-icon">
              <IconGroups />
            </span>
            Groups
          </button>
          <button
            className="sidebar-nav-item disabled"
            disabled
            aria-disabled="true"
          >
            <span className="sidebar-nav-icon">
              <IconProfile />
            </span>
            Profile
          </button>
          <button
            className="sidebar-nav-item disabled"
            disabled
            aria-disabled="true"
          >
            <span className="sidebar-nav-icon">
              <IconSettings />
            </span>
            Settings
          </button>
        </nav>
      </div>

      {/* Bottom: User info + actions */}
      <div className="profile-sidebar-bottom">
        {/* User card */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar-wrap">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt={`${localStorage.getItem("firstName")} ${localStorage.getItem("lastName")}`}
              className="sidebar-avatar-img"
            />
            <span className="sidebar-avatar-dot" />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {localStorage.getItem("firstName")}{" "}
              {localStorage.getItem("lastName")}
            </span>
            <span className="sidebar-user-handle">
              @{localStorage.getItem("username")}
            </span>
          </div>
        </div>

        {/* Log Out */}
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <span className="sidebar-nav-icon">
            <IconLogout />
          </span>
          Log Out
        </button>
      </div>
    </aside>
  );
}
