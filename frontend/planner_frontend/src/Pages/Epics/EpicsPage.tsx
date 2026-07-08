import { useState, useEffect } from "react";
import "./EpicsPage.css";
import EpicModal from "./EpicModal";
import UserStoryModal from "./UserStoryModal";

interface UserStory {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completedTasks: number;
  totalTasks: number;
  storyPoints?: number;
}

interface Epic {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completedStories: number;
  totalStories: number;
  owner: {
    name: string;
    avatar?: string;
  };
  date: string;
  userStories: UserStory[];
}

export default function EpicsPage({ projectId }: { projectId: string }) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [epics, setEpics] = useState<Epic[]>([]);

  // Modal states
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [activeEpicIdForStory, setActiveEpicIdForStory] = useState<
    string | null
  >(null);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEpics() {
      try {
        const response = await fetch(
          `http://localhost:8081/projects/${projectId}/epics`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          const mapped: Epic[] = data.map((epic: any) => ({
            id: epic.id,
            title: epic.title,
            priority: epic.priority || "LOW",
            completedStories:
              epic.userStories?.filter(
                (s: any) => s.status?.toLowerCase() === "done",
              ).length || 0,
            totalStories: epic.userStories?.length || 0,
            owner: {
              name: epic.creatorUsername || "Unknown",
            },
            date: new Date(epic.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            }),
            userStories: (epic.userStories || []).map((s: any) => ({
              id: s.id,
              title: s.title,
              priority: "MEDIUM",
              completedTasks: s.status?.toLowerCase() === "done" ? 1 : 0,
              totalTasks: 1,
              storyPoints: s.storyPoints,
            })),
          }));
          setEpics(mapped);
          if (mapped.length > 0) {
            setExpandedEpics(new Set([mapped[0].id]));
          }
        }
      } catch (e) {
        console.error("Failed to fetch epics", e);
      }
    }
    fetchEpics();
  }, [projectId]);

  const handleCreateEpic = async (data: any) => {
    try {
      const userId = localStorage.getItem("user_id");
      const payload = {
        title: data.title,
        description: data.description,
        priority: data.priority.toUpperCase(),
        status: data.status,
        creatorId: userId,
      };

      const res = await fetch(
        `http://localhost:8081/projects/${projectId}/epics`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        setIsEpicModalOpen(false);
        // Quick reload by dispatching a custom event or reloading window
        // For simplicity, we just reload the page or we could re-fetch
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to create epic:", e);
    }
  };

  const handleSaveUserStory = async (data: any, storyId?: string) => {
    try {
      const payload = {
        title: data.title,
        roleContext: data.roleContext,
        wantContext: data.wantContext,
        benefitContext: data.benefitContext,
        description: data.description,
        priority: data.priority?.toUpperCase(),
        status: data.status,
        storyPoints: data.storyPoints,
        creatorId: data.creatorId,
        epicId: data.epicId, // Can be null/undefined if updating
      };

      const url = storyId
        ? `http://localhost:8081/projects/${projectId}/userstory/${storyId}`
        : `http://localhost:8081/projects/${projectId}/userstory`;
      const method = storyId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActiveEpicIdForStory(null);
        setEditingStoryId(null);
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to save user story:", e);
    }
  };

  const handleDeleteUserStory = async (storyId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8081/projects/${projectId}/userstory/${storyId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (res.ok) {
        setEditingStoryId(null);
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to delete user story:", e);
    }
  };

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  return (
    <div className="epics-page">
      <div className="epics-header">
        <div className="epics-header-title">
          <h1>Epic Backlog</h1>
          <p>Strategic management of product epics and nested user stories.</p>
        </div>
        <div className="epics-controls">
          <div className="view-toggle">
            <button className="view-btn active">≣</button>
            <button className="view-btn">⊞</button>
          </div>
          <button
            className="new-epic-btn"
            onClick={() => setIsEpicModalOpen(true)}
          >
            <span>+</span> New Epic
          </button>
        </div>
      </div>

      <div className="epics-table-container">
        <div className="epics-table-header">
          <div></div>
          <div>PRIORITY</div>
          <div>EPIC TITLE</div>
          <div>COMPLETION</div>
          <div>OWNER</div>
          <div>DATE</div>
          <div></div>
        </div>

        <div className="epics-table-body">
          {epics.map((epic) => {
            const isExpanded = expandedEpics.has(epic.id);
            const progress =
              epic.totalStories > 0
                ? (epic.completedStories / epic.totalStories) * 100
                : 0;
            return (
              <div key={epic.id} className="epics-table-row">
                <div
                  className="epic-main-row"
                  onClick={() => toggleEpic(epic.id)}
                >
                  <div className="epic-col epic-col-id">
                    <span className="toggle-icon">
                      {isExpanded ? "˅" : "˃"}
                    </span>
                  </div>
                  <div className="epic-col">
                    <span className={`badge ${epic.priority.toLowerCase()}`}>
                      {epic.priority}
                    </span>
                  </div>
                  <div className="epic-col epic-col-title">{epic.title}</div>
                  <div className="epic-col epic-col-completion">
                    <span>
                      {epic.completedStories}/{epic.totalStories} Stories Done
                    </span>
                  </div>
                  <div className="epic-col epic-col-owner">
                    <div className="avatar">{epic.owner.name.charAt(0)}</div>
                    <span className="owner-name">{epic.owner.name}</span>
                  </div>
                  <div className="epic-col epic-col-date">{epic.date}</div>
                  <div className="epic-col epic-col-actions">
                    <button className="action-btn">⋮</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="nested-stories">
                    {epic.userStories.map((story) => (
                      <div 
                        key={story.id} 
                        className="user-story-row"
                        onClick={() => setEditingStoryId(story.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="story-col-points">{story.storyPoints ?? 0} pts</div>
                        <div className="story-col-title">
                          {story.title}
                          <span
                            className={`badge ${story.priority.toLowerCase()}`}
                          >
                            {story.priority}
                          </span>
                        </div>
                        <div className="story-col-tasks">
                          {story.completedTasks === story.totalTasks &&
                          story.totalTasks > 0 ? (
                            <span className="task-check">✓</span>
                          ) : (
                            <span className="task-circle">○</span>
                          )}
                          <span>
                            {story.completedTasks}/{story.totalTasks} Tasks
                          </span>
                        </div>
                        <div></div>
                      </div>
                    ))}
                    <button
                      className="add-story-btn"
                      onClick={() => setActiveEpicIdForStory(epic.id)}
                    >
                      <span>⊕</span> Add a User Story to this Epic
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="epics-footer">
        <div>Showing {epics.length} active epics</div>
        <div className="footer-actions">
          <button className="footer-btn">≡ Filter</button>
          <button className="footer-btn">⇅ Sort</button>
        </div>
      </div>

      {isEpicModalOpen && (
        <EpicModal
          onClose={() => setIsEpicModalOpen(false)}
          onSave={handleCreateEpic}
        />
      )}

      {(activeEpicIdForStory || editingStoryId) && (
        <UserStoryModal
          projectId={projectId}
          epicId={activeEpicIdForStory || undefined}
          storyId={editingStoryId || undefined}
          onClose={() => {
            setActiveEpicIdForStory(null);
            setEditingStoryId(null);
          }}
          onSave={handleSaveUserStory}
          onDelete={handleDeleteUserStory}
        />
      )}
    </div>
  );
}
