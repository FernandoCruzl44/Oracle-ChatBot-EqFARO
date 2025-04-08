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
    <div className="flex flex-1 animate-pulse overflow-x-auto">
      {columnStatuses.map((status, columnIndex) => (
        <div
          key={columnIndex}
          className="border-oc-outline-light/60 flex h-full min-w-64 flex-1 flex-col border-r last:border-r-0"
        >
          {/* Column Header */}
          <div className="border-oc-outline-light/60 bg-oc-primary sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded bg-stone-700"></div>
              <div className="h-5 w-24 rounded bg-stone-700"></div>
            </div>
            <div className="h-5 w-8 rounded-full bg-stone-700"></div>
          </div>

          {/* Column Content */}
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="border-oc-outline-light rounded-lg border bg-stone-800 p-3"
              >
                {/* Card Title */}
                <div className="mb-2 flex items-start justify-between">
                  <div className="h-5 w-full max-w-40 rounded bg-stone-700"></div>
                  <div className="ml-2 h-4 w-4 rounded bg-stone-700"></div>
                </div>

                {/* Card Tag */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-5 w-16 rounded-md bg-stone-700"></div>
                  <div className="h-4 w-20 rounded bg-stone-700"></div>
                </div>

                {/* Card Dates */}
                <div className="mb-2 flex justify-between">
                  <div className="h-4 w-24 rounded bg-stone-700"></div>
                  <div className="h-4 w-24 rounded bg-stone-700"></div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 rounded bg-stone-700"></div>
                  <div className="flex gap-1">
                    <div className="h-6 w-6 rounded-full bg-stone-700"></div>
                    <div className="h-6 w-6 rounded-full bg-stone-700"></div>
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
