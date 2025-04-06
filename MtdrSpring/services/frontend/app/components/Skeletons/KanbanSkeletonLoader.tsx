// app/components/Skeletons/KanbanSkeletonLoader.tsx
import React from "react";

interface KanbanSkeletonLoaderProps {
  columns?: number;
  cardsPerColumn?: number;
}

export default function KanbanSkeletonLoader({
  columns = 4,
  cardsPerColumn = 3,
}: KanbanSkeletonLoaderProps) {
  const statuses = ["Backlog", "En progreso", "Completada", "Cancelada"];
  const columnStatuses = statuses.slice(0, columns);

  return (
    <div className="flex-1 flex overflow-x-auto animate-pulse">
      {columnStatuses.map((status, columnIndex) => (
        <div
          key={columnIndex}
          className="flex-1 min-w-64 flex flex-col h-full border-r border-oc-outline-light/60 last:border-r-0"
        >
          {/* Column Header */}
          <div className="px-4 py-3 border-b border-oc-outline-light/60 flex justify-between items-center sticky top-0 bg-oc-primary z-10">
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-stone-700"></div>
              <div className="h-5 w-24 bg-stone-700 rounded"></div>
            </div>
            <div className="h-5 w-8 rounded-full bg-stone-700"></div>
          </div>

          {/* Column Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="p-3 bg-stone-800 border border-oc-outline-light rounded-lg"
              >
                {/* Card Title */}
                <div className="flex justify-between items-start mb-2">
                  <div className="h-5 bg-stone-700 rounded w-full max-w-40"></div>
                  <div className="w-4 h-4 ml-2 rounded bg-stone-700"></div>
                </div>

                {/* Card Tag */}
                <div className="flex items-center justify-between mb-2">
                  <div className="h-5 w-16 rounded-md bg-stone-700"></div>
                  <div className="h-4 w-20 rounded bg-stone-700"></div>
                </div>

                {/* Card Dates */}
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-24 bg-stone-700 rounded"></div>
                  <div className="h-4 w-24 bg-stone-700 rounded"></div>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-stone-700 rounded"></div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full bg-stone-700"></div>
                    <div className="w-6 h-6 rounded-full bg-stone-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
