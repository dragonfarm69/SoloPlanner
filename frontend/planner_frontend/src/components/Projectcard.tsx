import { useNavigate } from "react-router-dom";
import type { ProjectData } from "../types";
import "../Pages/Profile/UserProfile.css";

interface ProjectCardProps {
  project: ProjectData;
}

export function ProjectCardItem({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="project-card-item"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="project-card-info">
        <div className="project-title-row">
          <h4 className="project-name-text">{project.title}</h4>
        </div>
        <p className="project-desc-text">{project.description}</p>
      </div>

      <div className="project-tasks-left-badge">
        <span className="tasks-left-number">100</span>
        <span className="tasks-left-label">Tasks Left</span>
      </div>
    </div>
  );
}
