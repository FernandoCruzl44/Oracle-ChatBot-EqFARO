// app/components/Tasks/TasksTabs.tsx
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
    <div className="border-oc-outline-light/60 hide-scrollbar flex flex-shrink-0 overflow-x-auto border-b px-4 py-2 pb-0">
      {isManager ? (
        <>
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === "all"
                ? "border-b-2 border-white text-stone-100"
                : "text-stone-400 hover:text-stone-200"
            } ${isLoadingTasks ? "cursor-not-allowed opacity-50" : ""}`}
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
                  ? "border-b-2 border-stone-200 text-stone-100"
                  : "text-stone-400 hover:text-stone-100"
              } ${isLoadingTasks ? "cursor-not-allowed opacity-50" : ""}`}
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
                ? "border-b-2 border-white text-stone-100"
                : "text-stone-400 hover:text-stone-200"
            } ${isLoadingTasks ? "cursor-not-allowed opacity-50" : ""}`}
            onClick={() => !isLoadingTasks && changeTab("all")}
            disabled={isLoadingTasks}
          >
            Mis tareas
          </button>
          {currentUser?.teamId && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "team"
                  ? "border-b-2 border-white text-stone-100"
                  : "text-stone-400 hover:text-stone-200"
              } ${isLoadingTasks ? "cursor-not-allowed opacity-50" : ""}`}
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
