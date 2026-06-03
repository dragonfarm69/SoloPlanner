import React from "react";
import "./UserProfile.css";
import { useNavigate } from "react-router-dom";

interface GroupData {
  id: string;
  name: string;
  iconType: "engineering" | "design" | "admin";
}

interface ProjectData {
  id: string;
  name: string;
  status: "Active" | "In Review" | "System";
  description: string;
  tasksLeft: number;
  progressPercent: number;
}

interface UserProfileData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  createdDate: string;
  groups: GroupData[];
  tasksCompleted: number;
  projects: ProjectData[];
}

const mockUser: UserProfileData = {
  id: "d3b07384-d113-49cd-a5d6-8ee5c84f8841",
  username: "johndoe99",
  firstName: "John",
  lastName: "Doe",
  createdDate: "2026-06-03T15:30:00Z",
  tasksCompleted: 128,
  groups: [
    { id: "1", name: "Engineering Team", iconType: "engineering" },
    { id: "2", name: "Product Design", iconType: "design" },
    { id: "3", name: "SoloPlanner Admins", iconType: "admin" },
  ],
  projects: [
    {
      id: "p1",
      name: "Engineering project",
      status: "Active",
      description: "Building the core backend infrastructure.",
      tasksLeft: 24,
      progressPercent: 65,
    },
    {
      id: "p2",
      name: "Product project",
      status: "In Review",
      description: "Redesigning core user flows.",
      tasksLeft: 3,
      progressPercent: 90,
    },
    {
      id: "p3",
      name: "Admin Console",
      status: "System",
      description: "Internal tooling for managing clusters.",
      tasksLeft: 15,
      progressPercent: 45,
    },
  ],
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

interface GroupItemProps {
  group: GroupData;
}

function GroupListItem({ group }: GroupItemProps) {
  const renderIcon = (type: string) => {
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
  };

  return (
    <div className="group-list-item">
      <div className="group-left-part">
        <div className={`group-icon-wrapper ${group.iconType}`}>
          {renderIcon(group.iconType)}
        </div>
        <span className="group-item-name">{group.name}</span>
      </div>
      <span className="group-arrow-caret">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          width="16"
          height="16"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectData;
}

function ProjectCardItem({ project }: ProjectCardProps) {
  const statusClass = project.status.toLowerCase().replace(" ", "-");
  const navigate = useNavigate();
  return (
    <div
      className="project-card-item"
      onClick={() => {
        navigate("/");
      }}
    >
      <div className="project-card-info">
        <div className="project-title-row">
          <h4 className="project-name-text">{project.name}</h4>
          <span className={`project-status-badge ${statusClass}`}>
            {project.status}
          </span>
        </div>
        <p className="project-desc-text">{project.description}</p>
      </div>

      <div className="project-card-progress-section">
        <div className="progress-bar-wrapper">
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${statusClass}`}
              style={{ width: `${project.progressPercent}%` }}
            ></div>
          </div>
          <span className="progress-tasks-left">
            {project.tasksLeft} tasks left
          </span>
        </div>
        <span className={`progress-percentage-label ${statusClass}`}>
          {project.progressPercent}%
        </span>
      </div>
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

  return (
    <div className="profile-page-container">
      {/* Left Column */}
      <div className="profile-left-column">
        {/* Dark Profile Header Card */}
        <div className="profile-identity-card">
          <LogoIcon />

          <div className="profile-user-info-row">
            <div className="profile-avatar-container">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt={`${mockUser.firstName} ${mockUser.lastName}`}
                className="profile-avatar-img"
              />
              <span className="profile-status-dot"></span>
            </div>
            <div className="profile-name-stack">
              <h2 className="profile-display-name">
                {mockUser.firstName} {mockUser.lastName}
              </h2>
              <span className="profile-handle">@{mockUser.username}</span>
            </div>
          </div>

          <div className="profile-divider"></div>

          <div className="profile-member-since-section">
            <span className="member-since-label">MEMBER SINCE</span>
            <span className="member-since-date">{formattedDate}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="profile-stat-box">
            <span className="stat-number-blue">{mockUser.tasksCompleted}</span>
            <span className="stat-label-gray">Tasks Completed</span>
          </div>
          <div className="profile-stat-box">
            <span className="stat-number-blue">{mockUser.projects.length}</span>
            <span className="stat-label-gray">Active Projects</span>
          </div>
        </div>

        {/* Groups List */}
        <div className="profile-groups-section">
          <h3 className="section-heading-dark">Groups</h3>
          <div className="groups-stack">
            {mockUser.groups.map((group) => (
              <GroupListItem key={group.id} group={group} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="profile-right-column">
        <h3 className="section-heading-dark">Current Projects</h3>
        <div className="projects-stack">
          {mockUser.projects.map((project) => (
            <ProjectCardItem key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
