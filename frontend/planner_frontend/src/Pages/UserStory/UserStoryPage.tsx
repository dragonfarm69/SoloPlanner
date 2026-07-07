import { useState, useEffect } from "react";
import type { UserStory, Priority, UserStoryStatus } from "../../types";
import { PRIORITY_CONFIG, USER_STORY_STATUS_CONFIG } from "../../types";
import UserStoryModal from "./UserStoryModal";
import type { UserStoryFormData } from "./UserStoryModal";
import "./UserStoryPage.css";

interface UserStoryPageProps {
  projectId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapBackendStoryToFrontend(story: any): UserStory {
  return {
    ...story,
    priority: (story.priority?.toLowerCase() || "medium") as Priority,
    createdAt: story.createdAt,
    editedAt: story.editedAt,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ViewMode = "list" | "grid";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Builds the short "As a [role], I want [want]..." preview line for the table. */
function buildContextPreview(story: UserStory): string {
  const parts = [
    story.roleContext && `As a ${story.roleContext}`,
    story.wantContext && `I want ${story.wantContext}`,
  ].filter(Boolean);
  return parts.join(", ") + (parts.length ? "…" : "");
}

function buildProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className="us-priority-badge"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
      }}
    >
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStoryStatus }) {
  const cfg = USER_STORY_STATUS_CONFIG[status];
  return (
    <span
      className="us-status-badge"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function TaskProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = buildProgressPercent(completed, total);
  const isDone = total > 0 && completed === total;
  return (
    <div className="us-tasks-cell">
      <span className="us-tasks-label">
        {completed}/{total} tasks
      </span>
      <div className="us-progress-bar-track">
        <div
          className={`us-progress-bar-fill ${isDone ? "done" : ""}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${completed} of ${total} tasks complete`}
        />
      </div>
    </div>
  );
}

/** Story Points cell — shows the value when set, or a dashed "—" indicator when null/undefined. */
function StoryPointsCell({ points }: { points?: number }) {
  if (points == null) {
    return (
      <span className="us-sp-null" title="Not estimated">
        <span className="us-sp-dash">—</span>
      </span>
    );
  }
  return (
    <span className="us-sp-badge">
      {points} <span className="us-sp-unit">pt{points !== 1 ? "s" : ""}</span>
    </span>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function StoryRow({
  story,
  onEdit,
}: {
  story: UserStory;
  onEdit: (s: UserStory) => void;
}) {
  const preview = buildContextPreview(story);
  return (
    <tr>
      <td>
        <StoryPointsCell points={story.storyPoints} />
      </td>
      <td>
        <PriorityBadge priority={story.priority} />
      </td>
      <td>
        <div className="us-narrative-cell">
          <span className="us-narrative-title">{story.title}</span>
          {preview && (
            <span className="us-narrative-context" title={preview}>
              "{preview}"
            </span>
          )}
        </div>
      </td>
      <td>
        <TaskProgress
          completed={story.completedTaskCount}
          total={story.taskCount}
        />
      </td>
      <td>
        <StatusBadge status={story.status} />
      </td>
      <td className="us-date-cell">{formatDate(story.editedAt)}</td>
      <td>
        <button
          className="us-action-btn"
          aria-label={`Actions for ${story.title}`}
          title="Edit story"
          onClick={() => onEdit(story)}
        >
          ⋮
        </button>
      </td>
    </tr>
  );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function StoryCard({
  story,
  index,
  onEdit,
}: {
  story: UserStory;
  index: number;
  onEdit: (s: UserStory) => void;
}) {
  const preview = buildContextPreview(story);
  return (
    <article
      className="us-card"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onEdit(story)}
      aria-label={`User story ${story.id}: ${story.title}`}
    >
      <div className="us-card-header">
        <div className="us-card-badges">
          <span className="us-id-chip">{story.id}</span>
          <PriorityBadge priority={story.priority} />
        </div>
        <StatusBadge status={story.status} />
      </div>

      <h3 className="us-card-title">{story.title}</h3>

      {preview && <p className="us-card-context">"{preview}"</p>}

      <div className="us-card-footer">
        <TaskProgress
          completed={story.completedTaskCount}
          total={story.taskCount}
        />
        <StoryPointsCell points={story.storyPoints} />
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserStoryPage({ projectId }: UserStoryPageProps) {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── API Operations ───────────────────────────────────────

  useEffect(() => {
    if (!projectId) return;

    async function loadStories() {
      setLoading(true);
      setError(null);
      try {
        const url = `http://localhost:8081/projects/${projectId}/userstory`;
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch user stories");
        const data = await res.json();
        setStories(data.map(mapBackendStoryToFrontend));
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, [projectId]);

  async function handleSaveStory(formData: UserStoryFormData) {
    if (!projectId) return;

    const payload = {
      ...formData,
      priority: formData.priority.toUpperCase(),
    };

    const isEditing = editingStory !== undefined;
    const url = isEditing
      ? `http://localhost:8081/projects/${projectId}/userstory/${editingStory.id}`
      : `http://localhost:8081/projects/${projectId}/userstory`;

    const res = await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to ${isEditing ? "update" : "create"} user story`,
      );
    }

    const data = await res.json();
    const saved = mapBackendStoryToFrontend(data);

    setStories((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      return exists
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [...prev, saved];
    });
  }

  async function handleArchiveStory(id: string) {
    if (!projectId) return;
    const storyToArchive = stories.find((s) => s.id === id);
    if (!storyToArchive) return;

    const payload = {
      title: storyToArchive.title,
      roleContext: storyToArchive.roleContext,
      wantContext: storyToArchive.wantContext,
      benefitContext: storyToArchive.benefitContext,
      description: storyToArchive.description,
      priority: storyToArchive.priority.toUpperCase(),
      status: "archived",
      storyPoints: storyToArchive.storyPoints,
      parentId: storyToArchive.parentId,
    };

    const url = `http://localhost:8081/projects/${projectId}/userstory/${id}`;
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to archive user story");
    }

    const data = await res.json();
    const saved = mapBackendStoryToFrontend(data);

    setStories((prev) => prev.map((s) => (s.id === id ? saved : s)));
  }

  async function handleDeleteStory(id: string) {
    if (!projectId) return;

    const url = `http://localhost:8081/projects/${projectId}/userstory/${id}`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to delete user story");
    }

    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  // ─── Handlers ─────────────────────────────────────────────

  function handleNewStory() {
    setEditingStory(undefined);
    setIsModalOpen(true);
  }

  function handleEditStory(story: UserStory) {
    setEditingStory(story);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingStory(undefined);
  }

  // ─── Derived ──────────────────────────────────────────────

  const visibleStories = stories.filter((s) => s.status !== "archived");

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      <div className="us-page" id="user-story-page">
        {/* ── Toolbar ── */}
        <div className="us-toolbar">
          <div className="us-toolbar-left">
            <h1 className="us-toolbar-title">User Stories</h1>
            <p className="us-toolbar-subtitle">
              Centralized requirements backlog for this project.
            </p>
          </div>

          <div className="us-toolbar-right">
            <div className="us-view-toggle" role="group" aria-label="View mode">
              <button
                className={`us-view-btn ${viewMode === "list" ? "active" : ""}`}
                id="us-view-list"
                aria-pressed={viewMode === "list"}
                title="List view"
                onClick={() => setViewMode("list")}
              >
                ☰
              </button>
              <button
                className={`us-view-btn ${viewMode === "grid" ? "active" : ""}`}
                id="us-view-grid"
                aria-pressed={viewMode === "grid"}
                title="Grid view"
                onClick={() => setViewMode("grid")}
              >
                ⊞
              </button>
            </div>

            <button
              className="us-btn-new"
              id="us-btn-new-story"
              onClick={handleNewStory}
            >
              ＋ New Story
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="us-content">
          {loading ? (
            <div className="us-empty-state">
              <span className="us-empty-icon">⏳</span>
              <p className="us-empty-title">Loading user stories...</p>
            </div>
          ) : error ? (
            <div className="us-empty-state">
              <span className="us-empty-icon">⚠️</span>
              <p className="us-empty-title">Error loading stories</p>
              <p className="us-empty-subtitle">{error}</p>
            </div>
          ) : visibleStories.length === 0 ? (
            <div className="us-empty-state">
              <span className="us-empty-icon">📋</span>
              <p className="us-empty-title">No user stories yet</p>
              <p className="us-empty-subtitle">
                Click "New Story" to define your first requirement.
              </p>
            </div>
          ) : viewMode === "list" ? (
            <div className="us-table-wrap">
              <table className="us-table" aria-label="User stories list">
                <thead>
                  <tr>
                    <th scope="col">Story Pts</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Story Narrative</th>
                    <th scope="col">Tasks</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {visibleStories.map((story) => (
                    <StoryRow
                      key={story.id}
                      story={story}
                      onEdit={handleEditStory}
                    />
                  ))}
                </tbody>
              </table>

              <div
                className="us-draft-row"
                role="button"
                tabIndex={0}
                onClick={handleNewStory}
                onKeyDown={(e) => e.key === "Enter" && handleNewStory()}
              >
                <span>⊕</span>
                <span>Draft a New Story</span>
              </div>
            </div>
          ) : (
            <div className="us-grid">
              {visibleStories.map((story, i) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  index={i}
                  onEdit={handleEditStory}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="us-footer">
          <span className="us-footer-count">
            Showing {visibleStories.length} of {stories.length} stories
          </span>
          <div className="us-footer-actions">
            <button className="us-footer-btn" id="us-btn-filter">
              ⧩ Filter
            </button>
            <button className="us-footer-btn" id="us-btn-sort">
              ↕ Sort
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <UserStoryModal
          story={editingStory}
          stories={stories}
          onSave={handleSaveStory}
          onArchive={editingStory ? handleArchiveStory : undefined}
          onDelete={editingStory ? handleDeleteStory : undefined}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
