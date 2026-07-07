import React from "react";
import type { UserStory, UserStoryStatus, Priority } from "../../types";
import { PRIORITY_CONFIG, USER_STORY_STATUS_CONFIG } from "../../types";

// ─── Form state ────────────────────────────────────────────────────────────────

/** Raw form values — all strings so inputs stay controlled without type coercion. */
export type FormState = {
  title: string;
  roleContext: string;
  wantContext: string;
  benefitContext: string;
  description: string;
  priority: Priority;
  status: UserStoryStatus;
  /** Stored as a string in the form; parsed to a number only on submit. */
  storyPoints: string;
  parentId: string;
};

const ACTIVE_STATUSES: UserStoryStatus[] = ["open", "in_progress", "done"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

/** Build initial form state from an existing story, or return blank defaults. */
export function buildForm(story?: UserStory): FormState {
  if (story) {
    return {
      title: story.title,
      roleContext: story.roleContext || "",
      wantContext: story.wantContext || "",
      benefitContext: story.benefitContext || "",
      description: story.description || "",
      priority: story.priority,
      status: story.status === "archived" ? "open" : story.status,
      storyPoints: story.storyPoints != null ? String(story.storyPoints) : "",
      parentId: story.parentId || "",
    };
  }
  return {
    title: "",
    roleContext: "",
    wantContext: "",
    benefitContext: "",
    description: "",
    priority: "medium",
    status: "open",
    storyPoints: "",
    parentId: "",
  };
}

// ─── CustomSelect ──────────────────────────────────────────────────────────────

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}

/**
 * Wraps a native <select> in a styled div so the custom dropdown arrow
 * is consistent across browsers on dark themes.
 */
function CustomSelect({ id, value, onChange, children }: CustomSelectProps) {
  return (
    <div className="us-select-wrap">
      <select
        id={id}
        className="us-form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <span className="us-select-arrow" aria-hidden="true">
        ▾
      </span>
    </div>
  );
}

// ─── UserStoryForm ─────────────────────────────────────────────────────────────

interface UserStoryFormProps {
  /** Controlled form values. */
  form: FormState;
  /** Update a single field by name. */
  setField: (field: keyof FormState, value: string) => void;
  /** The story being edited (undefined when creating). Used to exclude itself from the parent dropdown. */
  editingStory?: UserStory;
  /** Full list of stories available as parent options. */
  stories: UserStory[];
  /** Called when the form is submitted via the Save button. */
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Renders the user-story form fields (Title, Narrative, Description,
 * Story Points, Parent Story, Priority, Status).
 *
 * State lives in the parent (UserStoryModal) — this component is purely
 * presentational and delegates all changes back via `setField`.
 */
export function UserStoryForm({
  form,
  setField,
  editingStory,
  stories,
  onSubmit,
}: UserStoryFormProps) {
  return (
    <form id="us-story-form" onSubmit={onSubmit} className="us-modal-form">
      {/* ── Title ── */}
      <div className="us-form-group">
        <label htmlFor="us-input-title" className="us-form-label">
          Title <span className="us-form-required">*</span>
        </label>
        <input
          id="us-input-title"
          className="us-form-input"
          type="text"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="e.g. User Authentication"
          maxLength={120}
          required
          autoFocus
        />
      </div>

      {/* ── Story Narrative (3 parts) ── */}
      <div className="us-form-group">
        <label className="us-form-label">Story Narrative</label>

        <div className="us-narrative-fields">
          <div className="us-narrative-row">
            <span className="us-narrative-prefix">As a…</span>
            <input
              id="us-input-role"
              className="us-form-input us-narrative-input"
              type="text"
              value={form.roleContext}
              onChange={(e) => setField("roleContext", e.target.value)}
              placeholder="e.g. Registered User"
              maxLength={120}
            />
          </div>

          <div className="us-narrative-row">
            <span className="us-narrative-prefix">I want…</span>
            <input
              id="us-input-want"
              className="us-form-input us-narrative-input"
              type="text"
              value={form.wantContext}
              onChange={(e) => setField("wantContext", e.target.value)}
              placeholder="e.g. to securely log in"
              maxLength={200}
            />
          </div>

          <div className="us-narrative-row">
            <span className="us-narrative-prefix">So that…</span>
            <textarea
              id="us-input-benefit"
              className="us-form-textarea us-narrative-input"
              rows={2}
              value={form.benefitContext}
              onChange={(e) => setField("benefitContext", e.target.value)}
              placeholder="e.g. I can access my personal dashboard"
              maxLength={200}
            />
          </div>
        </div>

        <span className="us-form-hint">Keep your narrative concise.</span>
      </div>

      {/* ── Description ── */}
      <div className="us-form-group">
        <label htmlFor="us-input-description" className="us-form-label">
          Description
        </label>
        <textarea
          id="us-input-description"
          className="us-form-textarea"
          rows={4}
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Additional context, acceptance criteria, notes…"
          maxLength={1000}
        />
      </div>

      {/* ── Story Points + Parent Story ── */}
      <div className="us-form-row">
        <div className="us-form-group">
          <label htmlFor="us-input-points" className="us-form-label">
            Story Points
          </label>
          <input
            id="us-input-points"
            className="us-form-input"
            type="number"
            min={0}
            max={999}
            value={form.storyPoints}
            onChange={(e) => setField("storyPoints", e.target.value)}
            placeholder="—"
          />
        </div>

        <div className="us-form-group">
          <label htmlFor="us-input-parent" className="us-form-label">
            Parent Story
          </label>
          <CustomSelect
            id="us-input-parent"
            value={form.parentId}
            onChange={(v) => setField("parentId", v)}
          >
            <option value="">None (Epic)</option>
            {stories
              .filter(
                (s) => s.id !== editingStory?.id && s.status !== "archived",
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
          </CustomSelect>
        </div>
      </div>

      {/* ── Priority + Status ── */}
      <div className="us-form-row">
        <div className="us-form-group">
          <label htmlFor="us-input-priority" className="us-form-label">
            Priority
          </label>
          <CustomSelect
            id="us-input-priority"
            value={form.priority}
            onChange={(v) => setField("priority", v)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_CONFIG[p].label}
              </option>
            ))}
          </CustomSelect>
        </div>

        <div className="us-form-group">
          <label htmlFor="us-input-status" className="us-form-label">
            Status
          </label>
          <CustomSelect
            id="us-input-status"
            value={form.status}
            onChange={(v) => setField("status", v)}
          >
            {ACTIVE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {USER_STORY_STATUS_CONFIG[s].label}
              </option>
            ))}
          </CustomSelect>
        </div>
      </div>
    </form>
  );
}
