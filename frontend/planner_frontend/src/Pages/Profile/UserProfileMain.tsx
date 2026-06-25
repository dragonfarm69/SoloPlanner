import "./UserProfile.css";
import type { GroupData, UserProfileData } from "../../types";
import { ProjectCardItem } from "../../components/Projectcard";
import { useEffect, useState } from "react";
import type { UserProjectResponse } from "../../DTO/UserProjectResponse";
import ProjectModal, {
  type ProjectFormData,
} from "../../components/ProjectModal";
import { useParams } from "react-router-dom";

const mockUser: UserProfileData = {
  id: "74b145fb-330f-494a-b6c1-27cd8f06737a",
  username: "johndoe99",
  firstName: "John",
  lastName: "Doe",
  createdDate: "2026-06-03T15:30:00Z",
  tasksCompleted: 128,
};

const mockGroupData: GroupData = {
  id: "hello",
  name: "hello",
  iconType: "engineering",
};

const mockGroupData2: GroupData = {
  id: "hello",
  name: "hello",
  iconType: "design",
};

const mockGroupData3: GroupData = {
  id: "hello",
  name: "hello",
  iconType: "admin",
};

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
    case "engineering":
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
    case "design":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="18"
          height="18"
        >
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
          <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
          <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor" />
          <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor" />
          <circle cx="15.5" cy="14.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "admin":
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
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
  }
}

interface GroupSelectorProps {
  groups: GroupData[];
  selectedGroupId: string;
  onSelect: (id: string) => void;
}

function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
}: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedGroup =
    groups.find((g) => g.id === selectedGroupId) || groups[0];

  if (!selectedGroup) return null;

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
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  const formattedDate = new Date(mockUser.createdDate).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState<GroupData[]>([
    { id: "hello1", name: "Engineering Group", iconType: "engineering" },
    { id: "hello2", name: "Design Group", iconType: "design" },
    { id: "hello3", name: "Admin Group", iconType: "admin" },
  ]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("hello1");

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
        setSelectedGroupId(fetchedGroups[0].id);
      }

      await getProjects();
    } catch (e) {
      console.error("Error when trying to fetch groups: ", e);
    }
    setIsModalOpen(false);
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

  return (
    <div className="profile-page-container">
      {isModalOpen && (
        <ProjectModal
          project={null}
          onSave={(data: ProjectFormData) => createNewProject(data)}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {/* Left Column */}
      <div className="profile-left-column">
        {/* Group Selector at top left */}
        <GroupSelector
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={(id) => setSelectedGroupId(id)}
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
          {projects.map((project) => (
            <ProjectCardItem key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
