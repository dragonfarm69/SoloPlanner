import { useState } from "react";
import type { UserStory, Priority, UserStoryStatus } from "../../types";
import { PRIORITY_CONFIG, USER_STORY_STATUS_CONFIG } from "../../types";
import UserStoryModal from "./UserStoryModal";
import "./UserStoryPage.css";

interface UserStoryPageProps {
  projectId: string;
}

// ─── Mock seed data ──────────────────────────────────────────────────────────
// Replace with fetch() once backend endpoint is ready.

const MOCK_STORIES: UserStory[] = [
  {
    id: "US-102",
    title: "User Authentication",
    roleContext: "registered user",
    wantContext: "securely log in to the app",
    benefitContext: "my data remains private",
    description:
      "Implement JWT-based auth with refresh tokens. Support email/password and future OAuth providers.",
    priority: "high",
    status: "in_progress",
    storyPoints: 8,
    taskCount: 2,
    completedTaskCount: 1,
    createdAt: "2026-10-01T08:00:00Z",
    editedAt: "2026-10-24T12:00:00Z",
  },
  {
    id: "US-105",
    title: "Automated Report Generation",
    roleContext: "project manager",
    wantContext: "generate weekly progress reports",
    benefitContext: "stakeholders stay informed",
    description:
      "PDF export of sprint metrics: velocity, burndown, open issues. Scheduled email delivery.",
    priority: "medium",
    status: "open",
    storyPoints: undefined, // unestimated
    taskCount: 2,
    completedTaskCount: 0,
    createdAt: "2026-10-15T09:00:00Z",
    editedAt: "2026-11-02T11:00:00Z",
  },
  {
    id: "US-108",
    title: "Dark Mode Toggle",
    roleContext: "accessible user",
    wantContext: "switch between light and dark themes",
    benefitContext: "I can reduce eye strain",
    description:
      "Use CSS variables and a persisted user preference. Respect OS-level prefers-color-scheme by default.",
    priority: "low",
    status: "done",
    storyPoints: 3,
    taskCount: 1,
    completedTaskCount: 1,
    createdAt: "2026-10-20T10:00:00Z",
    editedAt: "2026-10-30T15:00:00Z",
  },
];

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

export default function UserStoryPage({
  projectId: _projectId,
}: UserStoryPageProps) {
  const [stories, setStories] = useState<UserStory[]>(MOCK_STORIES);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | undefined>(
    undefined,
  );

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

  function handleSaveStory(saved: UserStory) {
    setStories((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      return exists
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [...prev, saved];
    });
  }

  /** Marks a story as archived (keeps it in state but hidden from the list) */
  function handleArchiveStory(id: string) {
    setStories((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "archived", editedAt: new Date().toISOString() }
          : s,
      ),
    );
  }

  /** Permanently removes a story from local state */
  function handleDeleteStory(id: string) {
    setStories((prev) => prev.filter((s) => s.id !== id));
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
          {visibleStories.length === 0 ? (
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
          onSave={handleSaveStory}
          onArchive={editingStory ? handleArchiveStory : undefined}
          onDelete={editingStory ? handleDeleteStory : undefined}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
