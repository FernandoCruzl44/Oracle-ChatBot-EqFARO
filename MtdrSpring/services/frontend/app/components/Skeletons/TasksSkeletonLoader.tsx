// app/components/TasksSkeletonLoader.tsx
import React from "react";

interface TasksSkeletonLoaderProps {
  rows?: number;
  columns?: number;
}

const TasksSkeletonLoader: React.FC<TasksSkeletonLoaderProps> = ({
  rows = 5,
  columns = 7,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={`skeleton-row-${rowIndex}`}
          className="border-oc-outline-light/60 border-b"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              className="px-2 py-3"
            >
              {colIndex === 0 ? (
                <div className="mx-auto h-4 w-4 animate-pulse rounded bg-stone-700"></div>
              ) : (
                <div
                  className={`h-5 animate-pulse rounded bg-stone-700 ${
                    colIndex === 1 ? "w-4/5" : "w-2/3"
                  }`}
                ></div>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TasksSkeletonLoader;
