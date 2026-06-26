import "./UserProfile.css";
import type { GroupData } from "../../types";
import { ProjectCardItem } from "../../components/Projectcard";
import { useEffect, useState } from "react";
import type { UserProjectResponse } from "../../DTO/UserProjectResponse";
import ProjectModal, {
  type ProjectFormData,
} from "../../components/ProjectModal";
import LogoIcon from "./LogoIcon";
import GroupSelector from "./GroupSelector";
import GroupModal from "./GroupModal";

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
      const url = new URL("http://localhost:8081/groups");
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
          `http://localhost:8081/groups/${newGroup.id}/users`,
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
