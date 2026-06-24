import React from "react";
import type { Task } from "../../types";
import TaskCard from "../../components/TaskCard";

interface ColumnBodyProps {
  bodyRef: React.RefObject<HTMLDivElement | null>;
  isDragOver: boolean;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function ColumnBody({
  bodyRef,
  isDragOver,
  tasks,
  onEditTask,
  onDeleteTask,
}: ColumnBodyProps) {
  return (
    <div
      ref={bodyRef}
      className={`column-body ${isDragOver ? "is-drag-over" : ""}`}
    >
      {tasks.length === 0 ? (
        <div className="column-body-empty">Drop tasks here</div>
      ) : (
        tasks.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            index={i}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))
      )}
    </div>
  );
}
