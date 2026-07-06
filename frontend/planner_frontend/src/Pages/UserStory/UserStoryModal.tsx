import React, { useState, useEffect } from "react";
import type { UserStory, UserStoryStatus, Priority } from "../../types";
import { PRIORITY_CONFIG, USER_STORY_STATUS_CONFIG } from "../../types";

interface UserStoryModalProps {
  story?: UserStory;
  onSave: (story: UserStory) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

// Status options shown in the select — "archived" is excluded (handled via dedicated button)
const ACTIVE_STATUSES: UserStoryStatus[] = ["open", "in_progress", "done"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return `US-${100 + Math.floor(Math.random() * 900)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

type FormState = {
  title: string;
  roleContext: string;
  wantContext: string;
  benefitContext: string;
  description: string;
  priority: Priority;
  status: UserStoryStatus;
  storyPoints: string; // stored as string in the form, parsed on save
};

function buildForm(story?: UserStory): FormState {
  if (story) {
    return {
      title: story.title,
      roleContext: story.roleContext,
      wantContext: story.wantContext,
      benefitContext: story.benefitContext,
      description: story.description,
      priority: story.priority,
      status: story.status === "archived" ? "open" : story.status,
      storyPoints: story.storyPoints != null ? String(story.storyPoints) : "",
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
  };
}

// ─── Confirmation Dialog ───────────────────────────────────────────────────────

interface ConfirmDialogProps {
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ message, confirmLabel, confirmClass, onConfirm, onCancel }: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="us-confirm-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="us-confirm-msg"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="us-confirm-box">
        <p id="us-confirm-msg" className="us-confirm-message">{message}</p>
        <div className="us-confirm-actions">
          <button className="us-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className={confirmClass} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Select ─────────────────────────────────────────────────────────────
// Wraps a native <select> in a styled div to fix the broken native arrow on dark themes.

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}

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
      <span className="us-select-arrow" aria-hidden="true">▾</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UserStoryModal({ story, onSave, onArchive, onDelete, onClose }: UserStoryModalProps) {
  const isEditing = story !== undefined;

  const [form, setForm] = useState<FormState>(buildForm(story));
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);

  // Reset when story prop changes
  useEffect(() => { setForm(buildForm(story)); }, [story]);

  // Close on Escape (only when no confirm dialog is open)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirm === null) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, confirm]);

  // ─── Field helpers ────────────────────────────────────────

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ─── Submit ───────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const now = nowIso();
    const points = form.storyPoints.trim() === "" ? undefined : Number(form.storyPoints);

    const saved: UserStory = isEditing
      ? {
          ...story,
          title: form.title,
          roleContext: form.roleContext,
          wantContext: form.wantContext,
          benefitContext: form.benefitContext,
          description: form.description,
          priority: form.priority,
          status: form.status,
          storyPoints: points,
          editedAt: now,
        }
      : {
          id: generateId(),
          taskCount: 0,
          completedTaskCount: 0,
          createdAt: now,
          editedAt: now,
          title: form.title,
          roleContext: form.roleContext,
          wantContext: form.wantContext,
          benefitContext: form.benefitContext,
          description: form.description,
          priority: form.priority,
          status: form.status,
          storyPoints: points,
        };

    onSave(saved);
    onClose();
  }

  // ─── Danger action handlers ───────────────────────────────

  function handleConfirmArchive() {
    if (story && onArchive) { onArchive(story.id); }
    onClose();
  }

  function handleConfirmDelete() {
    if (story && onDelete) { onDelete(story.id); }
    onClose();
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      <div
        className="us-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="us-modal-title"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="us-modal">

          {/* ── Header ── */}
          <div className="us-modal-header">
            <h2 id="us-modal-title" className="us-modal-title">
              {isEditing ? "Edit User Story" : "New User Story"}
            </h2>
            <button className="us-modal-close" onClick={onClose} aria-label="Close modal">✕</button>
          </div>

          {/* ── Form ── */}
          <form id="us-story-form" onSubmit={handleSubmit} className="us-modal-form">

            {/* Title */}
            <div className="us-form-group">
              <label htmlFor="us-input-title" className="us-form-label">
                Title <span className="us-form-required">*</span>
              </label>
              <input
                id="us-input-title"
                className="us-form-input"
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. User Authentication"
                maxLength={120}
                required
                autoFocus
              />
            </div>

            {/* Story Narrative — 3 parts */}
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
                    onChange={(e) => set("roleContext", e.target.value)}
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
                    onChange={(e) => set("wantContext", e.target.value)}
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
                    onChange={(e) => set("benefitContext", e.target.value)}
                    placeholder="e.g. I can access my personal dashboard"
                    maxLength={200}
                  />
                </div>
              </div>

              <span className="us-form-hint">Keep your narrative concise. Use the description box below for technical details.</span>
            </div>

            {/* Description */}
            <div className="us-form-group">
              <label htmlFor="us-input-description" className="us-form-label">Description</label>
              <textarea
                id="us-input-description"
                className="us-form-textarea"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Additional context, acceptance criteria, notes…"
                maxLength={1000}
              />
            </div>

            {/* Story Points + Parent Story row */}
            <div className="us-form-row">
              <div className="us-form-group">
                <label htmlFor="us-input-points" className="us-form-label">Story Points</label>
                <input
                  id="us-input-points"
                  className="us-form-input"
                  type="number"
                  min={0}
                  max={999}
                  value={form.storyPoints}
                  onChange={(e) => set("storyPoints", e.target.value)}
                  placeholder="—"
                />
              </div>

              <div className="us-form-group">
                <label htmlFor="us-input-parent" className="us-form-label">Parent Story</label>
                <CustomSelect id="us-input-parent" value="" onChange={() => {}}>
                  <option value="">None (Epic)</option>
                </CustomSelect>
              </div>
            </div>

            {/* Priority + Status row */}
            <div className="us-form-row">
              <div className="us-form-group">
                <label htmlFor="us-input-priority" className="us-form-label">Priority</label>
                <CustomSelect id="us-input-priority" value={form.priority} onChange={(v) => set("priority", v)}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </CustomSelect>
              </div>

              <div className="us-form-group">
                <label htmlFor="us-input-status" className="us-form-label">Status</label>
                <CustomSelect id="us-input-status" value={form.status} onChange={(v) => set("status", v)}>
                  {ACTIVE_STATUSES.map((s) => (
                    <option key={s} value={s}>{USER_STORY_STATUS_CONFIG[s].label}</option>
                  ))}
                </CustomSelect>
              </div>
            </div>

          </form>

          {/* ── Footer ── */}
          <div className="us-modal-footer">
            {/* Danger zone — only shown when editing */}
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
                    ▤ Archive
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
                    🗑 Delete
                  </button>
                )}
              </div>
            )}

            <div className="us-modal-footer-right">
              <button type="button" className="us-btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" form="us-story-form" className="us-btn-save">
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
