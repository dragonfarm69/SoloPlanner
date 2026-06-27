import { useState } from "react";
import type { GroupData } from "../../types";

function renderGroupIcon(type: string) {
  switch (type) {
    case "all":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="18"
          height="18"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
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
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
  }
}

interface GroupSelectorProps {
  groups: GroupData[];
  selectedGroupId: string;
  onSelect: (id: string) => void;
  onCreateGroupClick: () => void;
}

export default function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  onCreateGroupClick,
}: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedGroup =
    selectedGroupId === "all"
      ? { id: "all", name: "All Groups", iconType: "all" }
      : groups.find((g) => g.id === selectedGroupId) || {
          id: "all",
          name: "All Groups",
          iconType: "all",
        };

  return (
    <div className="group-selector-container">
      <button
        className="group-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="group-selector-left">
          <span className={`group-selector-icon ${selectedGroup.iconType}`}>
            {renderGroupIcon(selectedGroup.iconType)}
          </span>
          <span className="group-selector-name">{selectedGroup.name}</span>
        </div>
        <span className={`group-selector-caret ${isOpen ? "open" : ""}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            width="14"
            height="14"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="group-selector-dropdown" role="listbox">
          <div
            role="option"
            aria-selected={selectedGroupId === "all"}
            className={`group-selector-item ${
              selectedGroupId === "all" ? "selected" : ""
            }`}
            onClick={() => {
              onSelect("all");
              setIsOpen(false);
            }}
          >
            <div className="group-selector-item-left">
              <span className="group-selector-icon all">
                {renderGroupIcon("all")}
              </span>
              <span className="group-selector-item-name">Show All</span>
            </div>
            {selectedGroupId === "all" && (
              <span className="group-selector-check">✓</span>
            )}
          </div>

          <div className="group-selector-divider"></div>

          {groups.map((group) => (
            <div
              key={group.id}
              role="option"
              aria-selected={group.id === selectedGroupId}
              className={`group-selector-item ${
                group.id === selectedGroupId ? "selected" : ""
              }`}
              onClick={() => {
                onSelect(group.id);
                setIsOpen(false);
              }}
            >
              <div className="group-selector-item-left">
                <span className={`group-selector-icon ${group.iconType}`}>
                  {renderGroupIcon(group.iconType)}
                </span>
                <span className="group-selector-item-name">{group.name}</span>
              </div>
            </div>
          ))}

          <div className="group-selector-divider"></div>

          <button
            className="group-selector-create-btn"
            onClick={() => {
              onCreateGroupClick();
              setIsOpen(false);
            }}
          >
            <span className="group-selector-create-icon">+</span>
            <span>Create/Join Group</span>
          </button>
        </div>
      )}
    </div>
  );
}
