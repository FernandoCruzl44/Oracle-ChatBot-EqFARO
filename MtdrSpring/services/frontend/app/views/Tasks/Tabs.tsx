// app/components/Tasks/TasksTabs.tsx
interface TabsProps {
  isManager: boolean;
  teams: any[];
  activeTab: string;
  isLoadingTasks: boolean;
  currentUser: any;
  changeTab: (tab: string) => void;
  reloadTasks: () => void;
}

export function Tabs({
  isManager,
  teams,
  activeTab,
  changeTab,
  isLoadingTasks,
  currentUser,
  reloadTasks,
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
      <button onClick={reloadTasks} className="bg-whites ml-auto text-white">
        <i className="fa fa-refresh hover:bg-oc-amber/20 hover:text-oc-amber mb-1 rounded-md p-1 transition-colors"></i>
      </button>
    </div>
  );
}
