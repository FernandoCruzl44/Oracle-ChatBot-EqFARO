import React from "react";

interface TeamSkeletonLoaderProps {
  cards?: number;
  rowsPerCard?: number;
}

const TeamSkeletonLoader: React.FC<TeamSkeletonLoaderProps> = ({
  cards = 2,
  rowsPerCard = 3,
}) => {
  return (
    <div className="animate-pulse space-y-6">
      {Array.from({ length: cards }).map((_, cardIndex) => (
        <div
          key={`skeleton-card-${cardIndex}`}
          className="border-oc-outline-light/60 bg-oc-primary overflow-hidden rounded-lg border"
        >
          {/* Skeleton Card Header */}
          <div className="border-oc-outline-light/60 flex items-center justify-between border-b bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-32 rounded bg-stone-700"></div>{" "}
              {/* Team name placeholder */}
              <div className="h-5 w-5 rounded bg-stone-700"></div>{" "}
              {/* Edit icon placeholder */}
            </div>
            <div className="h-7 w-24 rounded-lg bg-stone-700"></div>{" "}
            {/* Add Member button placeholder */}
          </div>

          {/* Skeleton Member Table */}
          <div className="overflow-x-auto">
            <table className="divide-oc-outline-light/60 min-w-full divide-y">
              <thead className="bg-black/30">
                <tr>
                  {/* Header Cells Placeholders */}
                  <th className="w-12 px-4 py-3">
                    <div className="mx-auto h-4 w-4 rounded bg-stone-700"></div>
                  </th>
                  <th className="w-16 px-4 py-3">
                    <div className="h-4 w-12 rounded bg-stone-700"></div>
                  </th>
                  <th className="px-4 py-3">
                    <div className="h-4 w-20 rounded bg-stone-700"></div>
                  </th>
                  <th className="px-4 py-3">
                    <div className="h-4 w-16 rounded bg-stone-700"></div>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <div className="ml-auto h-4 w-16 rounded bg-stone-700"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-oc-outline-light/60 divide-y">
                {Array.from({ length: rowsPerCard }).map((_, rowIndex) => (
                  <tr key={`skeleton-row-${cardIndex}-${rowIndex}`}>
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto h-4 w-4 rounded bg-stone-700"></div>{" "}
                      {/* Checkbox */}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="mx-auto h-9 w-9 rounded-full bg-stone-700"></div>{" "}
                      {/* Avatar */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="mb-1 h-4 w-3/4 rounded bg-stone-700"></div>{" "}
                      {/* Name */}
                      <div className="h-3 w-1/2 rounded bg-stone-700"></div>{" "}
                      {/* Email */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="h-7 w-full rounded bg-stone-700"></div>{" "}
                      {/* Role Select */}
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-block h-5 w-5 rounded bg-stone-700"></div>{" "}
                      {/* Action 1 */}
                      <div className="inline-block h-5 w-5 rounded bg-stone-700"></div>{" "}
                      {/* Action 2 */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamSkeletonLoader;
