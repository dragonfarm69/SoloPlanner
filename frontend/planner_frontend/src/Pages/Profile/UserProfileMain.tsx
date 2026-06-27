import "./UserProfile.css";
import type { GroupData } from "../../types";
import { ProjectCardItem } from "../../components/Projectcard";
import { useEffect, useState } from "react";
import type { UserProjectResponse } from "../../DTO/UserProjectResponse";
import ProjectModal, {
  type ProjectFormData,
} from "../../components/ProjectModal";
import AppSidebar from "../../components/AppSidebar";
import GroupModal from "./GroupModal";

function IconBell() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="18"
      height="18"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="18"
      height="18"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="15"
      height="15"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function UserProfile() {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  /* ── Data fetching ── */

  async function getProjects() {
    try {
      const url = new URL("http://localhost:8081/projects");
      url.searchParams.append("userId", localStorage.getItem("user_id")!);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error("Error when trying to fetch project data");
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
      console.error("Error when trying to fetch project data", e);
    }
  }

  const getUserGroups = async () => {
    try {
      const url = new URL(`http://localhost:8081/user/me/groups`);
      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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

  /* ── Actions ── */

  const createNewProject = async (data: ProjectFormData) => {
    console.log("data: ", data);
    try {
      const url = new URL(`http://localhost:8081/projects`);
      const response = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
      const url = new URL("http://localhost:8081/groups");
      const response = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });
      if (!response.ok) throw new Error("Failed to create group");
      const newGroup = await response.json();
      console.log("Created Group: ", newGroup);
      const userId = localStorage.getItem("user_id");
      if (userId && newGroup.id) {
        const addUserUrl = new URL(
          `http://localhost:8081/groups/${newGroup.id}/users`,
        );
        await fetch(addUserUrl.toString(), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      }
      await getUserGroups();
    } catch (e) {
      console.error("Error when trying to create new group: ", e);
    }
    setIsGroupModalOpen(false);
  };

  const joinGroup = async (inviteCode: string) => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;
      const url = new URL("http://localhost:8081/groups/users/join");
      const response = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, inviteCode }),
      });
      if (!response.ok) throw new Error("Failed to join group");
      await getUserGroups();
    } catch (e) {
      console.error("Error when trying to join group: ", e);
    }
    setIsGroupModalOpen(false);
  };

  const filteredProjects =
    selectedGroupId === "all"
      ? projects
      : projects.filter((project: any) => project.groupId === selectedGroupId);

  /* ── Render ── */

  return (
    <div className="profile-page-container">
      {/* ── Modals ── */}
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
          onJoin={(code) => joinGroup(code)}
          onClose={() => setIsGroupModalOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <AppSidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(id) => setSelectedGroupId(id)}
        onCreateGroupClick={() => setIsGroupModalOpen(true)}
      />

      {/* RIGHT MAIN AREA */}
      <div className="profile-main">
        {/* Header bar */}
        <header className="profile-header">
          <div className="profile-header-search">
            <span className="profile-header-search-icon">
              <IconSearch />
            </span>
            <input
              className="profile-header-search-input"
              type="text"
              placeholder="Search projects..."
              aria-label="Search projects"
            />
          </div>

          <div className="profile-header-spacer" />

          <div className="profile-header-actions">
            <button className="header-icon-btn" aria-label="Notifications">
              <IconBell />
            </button>
            <button className="header-icon-btn" aria-label="Help">
              <IconHelp />
            </button>
            <div className="header-separator" />
            <button
              className="header-add-project-btn"
              onClick={() => setIsModalOpen(true)}
              id="add-project-btn"
            >
              + Add Project
            </button>
          </div>
        </header>

        {/* Content body */}
        <main className="profile-content">
          <div className="content-title-row">
            <div className="content-title-block">
              <h1 className="content-section-title">Current Projects</h1>
              <p className="content-section-subtitle">
                Manage and track your active workflow clusters
              </p>
            </div>
          </div>

          <div className="projects-stack">
            {filteredProjects.map((project: any) => (
              <ProjectCardItem key={project.id} project={project} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
