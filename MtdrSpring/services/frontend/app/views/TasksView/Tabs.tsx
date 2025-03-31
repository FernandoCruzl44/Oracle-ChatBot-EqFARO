// app/components/Tasks/TasksTabs.tsx
import React from "react";

interface TabsProps {
  isManager: boolean;
  teams: any[];
  activeTab: string;
  changeTab: (tab: string) => void;
  isLoadingTasks: boolean;
  currentUser: any;
}

export function Tabs({
  isManager,
  teams,
  activeTab,
  changeTab,
  isLoadingTasks,
  currentUser,
}: TabsProps) {
  return (
    <div className="flex px-4 py-2 border-b pb-0 border-oc-outline-light/60 overflow-x-auto hide-scrollbar flex-shrink-0">
      {isManager ? (
        <>
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === "all"
                ? "text-stone-100 border-b-2 border-white"
                : "text-stone-400 hover:text-stone-200"
            } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isLoadingTasks && changeTab("all")}
            disabled={isLoadingTasks}
          >
            Todas las tareas
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === String(team.id)
                  ? "text-stone-100 border-b-2 border-stone-200"
                  : "text-stone-400 hover:text-stone-100"
              } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isLoadingTasks && changeTab(String(team.id))}
              disabled={isLoadingTasks}
            >
              {team.name}
            </button>
          ))}
        </>
      ) : (
        <>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "all"
                ? "text-stone-100 border-b-2 border-white"
                : "text-stone-400 hover:text-stone-200"
            } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isLoadingTasks && changeTab("all")}
            disabled={isLoadingTasks}
          >
            Mis tareas
          </button>
          {currentUser?.teamId && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "team"
                  ? "text-stone-100 border-b-2 border-white"
                  : "text-stone-400 hover:text-stone-200"
              } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isLoadingTasks && changeTab("team")}
              disabled={isLoadingTasks}
            >
              Proyecto
            </button>
          )}
        </>
      )}
    </div>
  );
}
