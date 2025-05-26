// app/components/Tasks/TasksHeader.tsx
interface HeaderProps {
  currentUser: any;
}

export function Header({ currentUser }: HeaderProps) {
  const isManager = currentUser?.role === "manager";

  return (
    <div className="flex items-center justify-between gap-2 pb-2">
      <div className="flex items-center gap-2 pb-2">
        <h1 className="text-xl font-medium text-white">Tareas</h1>
      </div>
      {/* {currentUser && (
        <div className="flex flex-wrap items-center text-sm text-stone-300">
          <span className="font-medium">{currentUser.name}</span>
          <span className="mx-2">|</span>
          <span className="font-medium text-stone-300">
            {isManager ? "Manager" : "Developer"}
          </span>
          {!isManager && currentUser.teamName && (
            <>
              <span className="mx-1 font-medium">en</span>
              <span className="font-medium text-stone-300">
                {currentUser.teamName}
              </span>
            </>
          )}
        </div>
      )} */}
    </div>
  );
}
