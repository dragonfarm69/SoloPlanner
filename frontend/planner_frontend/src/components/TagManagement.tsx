import React, { useState, useEffect } from "react";
import type { Tag } from "../types";
import "./TagManagement.css";

interface TagManagementProps {
  projectId: string;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#ef4444", // Red
];

export default function TagManagement({ projectId }: TagManagementProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tags
  useEffect(() => {
    async function fetchTags() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:8081/projects/${projectId}/tags`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) {
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        setTags(data);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching tags");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTags();
  }, [projectId]);

  // Handle Add Tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:8081/projects/${projectId}/tags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: newTagName.trim(),
            color: selectedColor,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create tag");
      }

      const createdTag = await response.json();
      setTags((prev) => [...prev, createdTag]);
      setNewTagName("");
    } catch (err: any) {
      alert(err.message || "Could not add tag");
    }
  };

  // Handle Delete Tag
  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const response = await fetch(
        `http://localhost:8081/projects/${projectId}/tags/${tagId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete tag");
      }

      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err: any) {
      alert(err.message || "Could not delete tag");
    }
  };

  return (
    <div className="tag-management-container" id="tag-management">
      <div className="tag-management-header">
        <h1 className="tag-management-title">Tag Management</h1>
        <p className="tag-management-subtitle">
          Create and organize project tags to categorize your tasks.
        </p>
      </div>

      <div className="tag-management-content">
        {/* Left Side: Create Tag Form */}
        <section className="tag-form-card" aria-labelledby="create-tag-heading">
          <h2 id="create-tag-heading" className="tag-card-section-title">
            Create New Tag
          </h2>
          <form onSubmit={handleAddTag} className="tag-form">
            <div className="form-group">
              <label htmlFor="tag-name-input" className="form-label">
                Tag Name
              </label>
              <input
                id="tag-name-input"
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. Bug, Feature, Documentation"
                maxLength={30}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Color</label>
              <div className="preset-colors-grid">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`preset-color-dot ${selectedColor === color ? "active" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <div className="custom-color-picker-group">
                <span className="form-label-secondary">
                  Or choose a custom color:
                </span>
                <div className="custom-color-input-wrapper">
                  <input
                    type="color"
                    id="custom-color-input"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    aria-label="Custom color picker"
                  />
                  <span className="custom-color-value">
                    {selectedColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="tag-preview-section">
              <span className="form-label-secondary">Preview</span>
              <div className="tag-preview-badge-wrapper">
                <span
                  className="tag-badge-preview"
                  style={{ backgroundColor: selectedColor }}
                >
                  {newTagName.trim() || "Tag Preview"}
                </span>
              </div>
            </div>

            <button type="submit" className="btn-create-tag">
              Create Tag
            </button>
          </form>
        </section>

        {/* Right Side: Tags List */}
        <section
          className="tags-list-card"
          aria-labelledby="existing-tags-heading"
        >
          <h2 id="existing-tags-heading" className="tag-card-section-title">
            Project Tags ({tags.length})
          </h2>

          {isLoading ? (
            <div className="tags-loading">Loading tags...</div>
          ) : error ? (
            <div className="tags-error">{error}</div>
          ) : tags.length === 0 ? (
            <div className="tags-empty-state">
              <span className="empty-state-icon">🏷</span>
              <p>No tags created yet. Use the form on the left to add tags.</p>
            </div>
          ) : (
            <div className="tags-grid">
              {tags.map((tag) => (
                <div key={tag.id} className="tag-item-card">
                  <span
                    className="tag-badge"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                  <button
                    className="btn-delete-tag"
                    onClick={() => handleDeleteTag(tag.id)}
                    title={`Delete tag ${tag.name}`}
                    aria-label={`Delete tag ${tag.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
