import React from "react";

interface ColumnDropPreviewProps {
  preview: { title: string; color: string } | null;
}

export default function ColumnDropPreview({ preview }: ColumnDropPreviewProps) {
  if (!preview) return null;
  return (
    <div
      className="column-drop-indicator-preview"
      style={
        { "--col-color": preview.color } as React.CSSProperties
      }
    >
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-title">{preview.title}</span>
        </div>
      </div>
      <div className="column-body" style={{ minHeight: "150px" }} />
    </div>
  );
}
