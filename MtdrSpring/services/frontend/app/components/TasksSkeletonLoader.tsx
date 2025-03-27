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
          className="border-b border-oc-outline-light/60"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              className="py-3 px-2"
            >
              {colIndex === 0 ? (
                <div className="w-4 h-4 mx-auto bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div
                  className={`h-5 bg-gray-200 rounded animate-pulse ${
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
