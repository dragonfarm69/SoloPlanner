import "./UserProfile.css";
import type { GroupData, UserProfileData } from "../../types";
import { ProjectCardItem } from "../../components/Projectcard";
import { useEffect, useState } from "react";
import type { UserProjectResponse } from "../../DTO/UserProjectResponse";
import ProjectModal, {
  type ProjectFormData,
} from "../../components/ProjectModal";

// Helper components for modularity and readability
function LogoIcon() {
  return (
    <div className="profile-logo-container">
      <svg
        className="profile-logo"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="1"
          transform="rotate(45 12 12)"
        />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    </div>
  );
}

function renderGroupIcon(type: string) {
  switch (type) {
    case "all":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="18"
          height="18"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="18"
          height="18"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
  }
}

interface GroupSelectorProps {
  groups: GroupData[];
  selectedGroupId: string;
  onSelect: (id: string) => void;
  onCreateGroupClick: () => void;
}

function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  onCreateGroupClick,
}: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedGroup =
    selectedGroupId === "all"
      ? { id: "all", name: "All Groups", iconType: "all" }
      : groups.find((g) => g.id === selectedGroupId) || {
          id: "all",
          name: "All Groups",
          iconType: "all",
        };

  return (
    <div className="group-selector-container">
      <button
        className="group-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="group-selector-left">
          <span className={`group-selector-icon ${selectedGroup.iconType}`}>
            {renderGroupIcon(selectedGroup.iconType)}
          </span>
          <span className="group-selector-name">{selectedGroup.name}</span>
        </div>
        <span className={`group-selector-caret ${isOpen ? "open" : ""}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            width="14"
            height="14"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="group-selector-dropdown" role="listbox">
          <div
            role="option"
            aria-selected={selectedGroupId === "all"}
            className={`group-selector-item ${
              selectedGroupId === "all" ? "selected" : ""
            }`}
            onClick={() => {
              onSelect("all");
              setIsOpen(false);
            }}
          >
            <div className="group-selector-item-left">
              <span className="group-selector-icon all">
                {renderGroupIcon("all")}
              </span>
              <span className="group-selector-item-name">Show All</span>
            </div>
            {selectedGroupId === "all" && (
              <span className="group-selector-check">✓</span>
            )}
          </div>

          <div className="group-selector-divider"></div>

          {groups.map((group) => (
            <div
              key={group.id}
              role="option"
              aria-selected={group.id === selectedGroupId}
              className={`group-selector-item ${
                group.id === selectedGroupId ? "selected" : ""
              }`}
              onClick={() => {
                onSelect(group.id);
                setIsOpen(false);
              }}
            >
              <div className="group-selector-item-left">
                <span className={`group-selector-icon ${group.iconType}`}>
                  {renderGroupIcon(group.iconType)}
                </span>
                <span className="group-selector-item-name">{group.name}</span>
              </div>
              {group.id === selectedGroupId && (
                <span className="group-selector-check">✓</span>
              )}
            </div>
          ))}

          <div className="group-selector-divider"></div>

          <button
            className="group-selector-create-btn"
            onClick={() => {
              onCreateGroupClick();
              setIsOpen(false);
            }}
          >
            <span className="group-selector-create-icon">+</span>
            <span>Create Group</span>
          </button>
        </div>
      )}
    </div>
  );
}

interface GroupModalProps {
  onSave: (groupName: string) => void;
  onClose: () => void;
}

function GroupModal({ onSave, onClose }: GroupModalProps) {
  const [groupName, setGroupName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      onSave(groupName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Create group"
      >
        <div className="modal-header">
          <h2 className="modal-title">Create New Group</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="group-name-input">
              Group Name
            </label>
            <input
              type="text"
              id="group-name-input"
              className="form-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Development Team"
              autoFocus
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            <button className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-modal-save"
              onClick={handleSubmit}
              disabled={!groupName.trim()}
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  //TODO: replace this with user data
  const formattedDate = new Date("2026-06-03T15:30:00Z").toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  async function getProjects() {
    try {
      const url = new URL("http://localhost:8081/projects");
      url.searchParams.append("userId", localStorage.getItem("user_id")!);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Error when tring to fetch project data");
      }
      const response_data = await response.json();
      const data: UserProjectResponse[] = response_data.map(
        (project: UserProjectResponse) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          ownerId: project.ownerId,
          groupId: project.groupId,
        }),
      );

      setProjects(data);
    } catch (e) {
      console.error("Error when tring to fetch project data", e);
    }
  }

  const getUserGroups = async () => {
    try {
      const url = new URL(`http://localhost:8081/user/me/groups`);
      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const response_data = await response.json();
      console.log("GROUPS: ", response_data);

      if (response_data && response_data.length > 0) {
        const fetchedGroups: GroupData[] = response_data.map((g: any) => ({
          id: g.id || g.name,
          name: g.name,
          iconType: g.iconType || "admin",
        }));
        setGroups(fetchedGroups);
      }

      await getProjects();
    } catch (e) {
      console.error("Error when trying to fetch groups: ", e);
    }
  };

  useEffect(() => {
    getProjects();
    getUserGroups();
  }, []);

  const createNewProject = async (data: ProjectFormData) => {
    console.log("data: ", data);
    try {
      const url = new URL(`http://localhost:8081/projects`);
      const response = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const response_data = await response.json();
      console.log(response_data);

      await getProjects();
    } catch (e) {
      console.error("Error when trying to create new project: ", e);
    }
    setIsModalOpen(false);
  };

  const createNewGroup = async (groupName: string) => {
    try {
      const url = new URL("http://localhost:8081/group");
      const response = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: groupName }),
      });
      if (!response.ok) throw new Error("Failed to create group");
      const newGroup = await response.json();
      console.log("Created Group: ", newGroup);

      const userId = localStorage.getItem("user_id");
      if (userId && newGroup.id) {
        const addUserUrl = new URL(
          `http://localhost:8081/group/${newGroup.id}/users`,
        );
        await fetch(addUserUrl.toString(), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
      }

      await getUserGroups();
    } catch (e) {
      console.error("Error when trying to create new group: ", e);
    }
    setIsGroupModalOpen(false);
  };

  const filteredProjects =
    selectedGroupId === "all"
      ? projects
      : projects.filter((project: any) => project.groupId === selectedGroupId);

  return (
    <div className="profile-page-container">
      {isModalOpen && (
        <ProjectModal
          project={null}
          onSave={(data: ProjectFormData) => createNewProject(data)}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isGroupModalOpen && (
        <GroupModal
          onSave={(name) => createNewGroup(name)}
          onClose={() => setIsGroupModalOpen(false)}
        />
      )}
      {/* Left Column */}
      <div className="profile-left-column">
        {/* Group Selector at top left */}
        <GroupSelector
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={(id) => setSelectedGroupId(id)}
          onCreateGroupClick={() => setIsGroupModalOpen(true)}
        />

        {/* Dark Profile Header Card */}
        <div className="profile-identity-card">
          <LogoIcon />

          <div className="profile-user-info-row">
            <div className="profile-avatar-container">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt={`${localStorage.getItem("firstName")} ${localStorage.getItem("lastName")}`}
                className="profile-avatar-img"
              />
              <span className="profile-status-dot"></span>
            </div>
            <div className="profile-name-stack">
              <h2 className="profile-display-name">
                {localStorage.getItem("firstName")}{" "}
                {localStorage.getItem("lastName")}
              </h2>
              <span className="profile-handle">
                @{localStorage.getItem("username")}
              </span>
            </div>
          </div>

          <div className="profile-divider"></div>

          <div className="profile-member-since-section">
            <span className="member-since-label">MEMBER SINCE</span>
            <span className="member-since-date">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="profile-right-column">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 className="section-heading-dark">Current Projects</h3>
          <button
            className="section-heading-dark"
            onClick={() => setIsModalOpen(true)}
          >
            +
          </button>
        </div>
        <div className="projects-stack">
          {filteredProjects.map((project: any) => (
            <ProjectCardItem key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
