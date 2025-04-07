// app/components/Tasks/TasksHeader.tsx
import React from "react";

interface HeaderProps {
  currentUser: any;
}

export function Header({ currentUser }: HeaderProps) {
  const isManager = currentUser?.role === "manager";

  return (
    <div className="flex justify-between items-center pb-2 gap-2">
      <div className="flex items-center pb-2 gap-2">
        <h1 className="text-xl font-medium text-white">Tareas</h1>
      </div>
      {currentUser && (
        <div className="text-sm text-stone-300 flex items-center flex-wrap">
          <span className="font-medium">{currentUser.name}</span>
          <span className="mx-2">|</span>
          <span
            className={`${
              isManager ? "text-blue-200" : "text-green-200"
            } font-medium`}
          >
            {isManager ? "Manager" : "Developer"}
          </span>
          {!isManager && currentUser.teamName && (
            <>
              <span className="mx-2">en</span>
              <span className="text-cyan-200 font-medium">
                {currentUser.teamName}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
