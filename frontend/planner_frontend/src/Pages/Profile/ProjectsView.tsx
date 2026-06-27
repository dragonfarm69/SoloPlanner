import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutOutletContext } from "../AppLayout";
import type { UserProjectResponse } from "../../DTO/UserProjectResponse";
import { ProjectCardItem } from "../../components/Projectcard";
import ProjectModal, {
  type ProjectFormData,
} from "../../components/ProjectModal";
import "./UserProfile.css";

/* ──────────────────────────────────────────────────────────
   Local Icons
   ────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */

export default function ProjectsView() {
  const { selectedGroupId, onOpenGroupModal } =
    useOutletContext<AppLayoutOutletContext>();

  const [projects, setProjects] = useState<UserProjectResponse[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  /* ── Data fetching ── */

  const fetchProjects = async () => {
    try {
      const url = new URL("http://localhost:8081/projects");
      url.searchParams.append("userId", localStorage.getItem("user_id")!);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error("Error when trying to fetch project data");
      const data: UserProjectResponse[] = await response.json();
      setProjects(
        data.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          ownerId: p.ownerId,
          groupId: p.groupId,
        })),
      );
    } catch (e) {
      console.error("Error when trying to fetch project data", e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ── Actions ── */

  const createNewProject = async (data: ProjectFormData) => {
    try {
      const response = await fetch("http://localhost:8081/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create project");
      await fetchProjects();
    } catch (e) {
      console.error("Error when trying to create new project:", e);
    } finally {
      setIsProjectModalOpen(false);
    }
  };

  /* ── Derived state ── */

  const filteredProjects =
    selectedGroupId === "all"
      ? projects
      : projects.filter((p) => p.groupId === selectedGroupId);

  /* ── Render ── */

  return (
    <div className="profile-main">
      {/* Project create modal */}
      {isProjectModalOpen && (
        <ProjectModal
          project={null}
          onSave={(data: ProjectFormData) => createNewProject(data)}
          onClose={() => setIsProjectModalOpen(false)}
        />
      )}

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
            onClick={() => setIsProjectModalOpen(true)}
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
          {filteredProjects.map((project) => (
            <ProjectCardItem key={project.id} project={project} />
          ))}
        </div>
      </main>
    </div>
  );
}
