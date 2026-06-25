export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  labels: Tag[];
  columnId: string;
  username: string;
  order: string;
  createdAt: number;
  updatedAt: number;
  deadline?: string; // ISO date string e.g. "2026-06-30", optional
  isArchived?: boolean;
}

export interface Column {
  id: string;
  title: string;
  order: string;
  color: string;
}

export interface Board {
  columns: Column[];
  tasks: Task[];
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  low: { label: "Low", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.15)" },
  medium: { label: "Medium", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)" },
  high: { label: "High", color: "#fb923c", bg: "rgba(251, 146, 60, 0.15)" },
  urgent: {
    label: "Urgent",
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.15)",
  },
};

export const LABEL_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
];

export interface GroupData {
  id: string;
  name: string;
  iconType: "engineering" | "design" | "admin";
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  // tasksLeft: number;
  // progressPercent: number;
}

export interface UserProfileData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  createdDate: string;
  tasksCompleted: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}
