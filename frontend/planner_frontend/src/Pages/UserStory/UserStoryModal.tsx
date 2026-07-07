import { useState, useEffect } from "react";
import type { UserStory, UserStoryStatus, Priority } from "../../types";
import { USER_STORY_STATUS_CONFIG } from "../../types";
import { UserStoryForm, buildForm } from "./UserStoryForm";
import type { FormState } from "./UserStoryForm";

// ─── Public types ──────────────────────────────────────────────────────────────

export interface UserStoryFormData {
  title: string;
  roleContext: string;
  wantContext: string;
  benefitContext: string;
  description: string;
  priority: Priority;
  status: UserStoryStatus;
  storyPoints?: number;
  parentId?: string;
}

/** Shape of the details fetched from GET /{project_id}/userstory/{story_id} */
export interface UserStoryDetails {
  tasks: Array<{ id: string; title: string; status: string }>;
  subStories: Array<{ id: string; title: string; status: string; storyPoints?: number }>;
  storyPoints?: number;
}

interface UserStoryModalProps {
  story?: UserStory;
  stories?: UserStory[];
  details?: UserStoryDetails; // populated for editing; undefined for new
  onSave: (data: UserStoryFormData) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

// ─── ConfirmDialog ─────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="us-confirm-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="us-confirm-msg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="us-confirm-box">
        <p id="us-confirm-msg" className="us-confirm-message">
          {message}
        </p>
        <div className="us-confirm-actions">
          <button className="us-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className={confirmClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RelationshipsSidebar ──────────────────────────────────────────────────────

/** Derive a status-dot colour from a board column name (best-effort). */
function deriveDotColor(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("done") || s.includes("complete")) return "#34d399";
  if (s.includes("progress") || s.includes("doing")) return "#fbbf24";
  if (s.includes("block") || s.includes("review")) return "#f87171";
  return "#6366f1";
}

/** A small card representing a linked task in the sidebar. */
function TaskCard({ title, status }: { title: string; status: string }) {
  return (
    <div className="us-rel-card">
      <span className="us-rel-card-title">{title}</span>
      <span
        className="us-rel-dot"
        style={{ background: deriveDotColor(status) }}
        title={status}
        aria-label={`Status: ${status}`}
      />
    </div>
  );
}

/** A small card representing a sub-story or parent story in the sidebar. */
function StoryCard({
  title,
  storyPoints,
  status,
}: {
  title: string;
  storyPoints?: number;
  status: string;
}) {
  const cfg =
    USER_STORY_STATUS_CONFIG[status as UserStoryStatus] ??
    USER_STORY_STATUS_CONFIG["open"];

  console.log(storyPoints);

  return (
    <div className="us-rel-card">
      <span className="us-rel-card-title">{title}</span>
      <span className="us-rel-card-sub" style={{ color: cfg.color }}>
        {storyPoints != null
          ? `${storyPoints} pt${storyPoints !== 1 ? "s" : ""}`
          : "—"}
      </span>
    </div>
  );
}

interface RelationshipsSidebarProps {
  details?: UserStoryDetails;
  /** The parent story object, looked up from the full stories list */
  parentStory?: UserStory;
}

function RelationshipsSidebar({
  details,
  parentStory,
}: RelationshipsSidebarProps) {
  const tasks = details?.tasks ?? [];
  const subStories = details?.subStories ?? [];

  return (
    <aside className="us-modal-sidebar" aria-label="Relationships">
      <h3 className="us-sidebar-title">Relationships</h3>

      <div className="us-sidebar-cols">
        {/* Linked Tasks */}
        <div className="us-sidebar-col">
          <span className="us-sidebar-section-title">Linked Tasks</span>
          <div className="us-sidebar-cards">
            {tasks.length === 0 ? (
              <span className="us-sidebar-empty">None</span>
            ) : (
              tasks.map((t) => (
                <TaskCard key={t.id} title={t.title} status={t.status} />
              ))
            )}
          </div>
          <button
            className="us-rel-add-btn"
            type="button"
            aria-label="Add linked task"
            title="Add linked task"
          >
            +
          </button>
        </div>

        {/* Sub-stories (or parent story when editing a child) */}
        <div className="us-sidebar-col">
          <span className="us-sidebar-section-title">
            {parentStory ? "Parent Story" : "Sub-Stories"}
          </span>
          <div className="us-sidebar-cards">
            {parentStory ? (
              <StoryCard
                title={parentStory.title}
                storyPoints={parentStory.storyPoints}
                status={parentStory.status}
              />
            ) : subStories.length === 0 ? (
              <span className="us-sidebar-empty">None</span>
            ) : (
              subStories.map((s) => (
                <StoryCard key={s.id} title={s.title} status={s.status} storyPoints={s.storyPoints} />
              ))
            )}
          </div>
          <button
            className="us-rel-add-btn"
            type="button"
            aria-label="Add story relationship"
            title="Add story relationship"
          >
            +
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── UserStoryModal ────────────────────────────────────────────────────────────

export default function UserStoryModal({
  story,
  stories = [],
  details,
  onSave,
  onArchive,
  onDelete,
  onClose,
}: UserStoryModalProps) {
  const isEditing = story !== undefined;

  const [form, setForm] = useState<FormState>(buildForm(story));
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);

  // Reset form whenever the story being edited changes
  useEffect(() => {
    setForm(buildForm(story));
  }, [story]);

  // Close on Escape (only when no confirm dialog is open)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirm === null) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, confirm]);

  // ─── Field update helper ──────────────────────────────────

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ─── Submit ───────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const storyPoints =
      form.storyPoints.trim() === "" ? undefined : Number(form.storyPoints);
    const parentId = form.parentId.trim() === "" ? undefined : form.parentId;

    onSave({
      title: form.title,
      roleContext: form.roleContext,
      wantContext: form.wantContext,
      benefitContext: form.benefitContext,
      description: form.description,
      priority: form.priority,
      status: form.status,
      storyPoints,
      parentId,
    })
      .then(() => onClose())
      .catch((err) => console.error("Save failed:", err));
  }

  // ─── Danger actions ───────────────────────────────────────

  function handleConfirmArchive() {
    if (story && onArchive) onArchive(story.id);
    onClose();
  }

  function handleConfirmDelete() {
    if (story && onDelete) onDelete(story.id);
    onClose();
  }

  // ─── Derived ─────────────────────────────────────────────

  const parentStory =
    form.parentId && isEditing
      ? stories.find((s) => s.id === form.parentId)
      : undefined;

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      <div
        className="us-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="us-modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="us-modal">
          {/* ── Header ── */}
          <div className="us-modal-header">
            <h2 id="us-modal-title" className="us-modal-title">
              {isEditing ? "Edit User Story" : "New User Story"}
            </h2>
            <button
              className="us-modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* ── Two-column body ── */}
          <div className="us-modal-body">
            <UserStoryForm
              form={form}
              setField={setField}
              editingStory={story}
              stories={stories}
              onSubmit={handleSubmit}
            />

            <RelationshipsSidebar details={details} parentStory={parentStory} />
          </div>

          {/* ── Footer ── */}
          <div className="us-modal-footer">
            {isEditing && (
              <div className="us-modal-danger-zone">
                {onArchive && (
                  <button
                    type="button"
                    className="us-btn-danger"
                    id="us-btn-archive"
                    onClick={() => setConfirm("archive")}
                    title="Archive this story"
                  >
                    Archive
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="us-btn-danger us-btn-danger--delete"
                    id="us-btn-delete"
                    onClick={() => setConfirm("delete")}
                    title="Delete this story permanently"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}

            <div className="us-modal-footer-right">
              <button type="button" className="us-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                form="us-story-form"
                className="us-btn-save"
              >
                {isEditing ? "Save Changes" : "Save Story"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation dialogs ── */}
      {confirm === "archive" && (
        <ConfirmDialog
          message="Archive this story? It will be hidden from the backlog but can be restored later."
          confirmLabel="Archive"
          confirmClass="us-btn-danger"
          onConfirm={handleConfirmArchive}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          message="Permanently delete this story? This action cannot be undone."
          confirmLabel="Delete"
          confirmClass="us-btn-danger us-btn-danger--delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
