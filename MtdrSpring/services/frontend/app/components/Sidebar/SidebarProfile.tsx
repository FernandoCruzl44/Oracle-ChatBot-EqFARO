// app/components/Sidebar/SidebarProfile.tsx
import { useState, useEffect, useRef } from "react";
import { generateAvatarColor } from "~/lib/utils";
import useTaskStore from "~/store";

export default function SidebarProfile({ isExpanded = true }) {
  const users = useTaskStore((state) => state.users);
  const currentUser = useTaskStore((state) => state.currentUser);
  const isLoadingUsers = useTaskStore((state) => state.isLoadingUsers);
  const fetchUsers = useTaskStore((state) => state.fetchUsers);
  const fetchCurrentUser = useTaskStore((state) => state.fetchCurrentUser);
  const logout = useTaskStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchUsers, fetchCurrentUser]);

  const colors = currentUser
    ? generateAvatarColor(currentUser.name)
    : { backgroundColor: "gray", color: "white" };

  if (isLoadingUsers) {
    return (
      <div className="flex items-center px-4 py-3">
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center">
          <i className="fa fa-spinner fa-spin text-stone-400"></i>
        </div>
        <div
          className={`ml-2 text-stone-400 transition-all duration-200 ${
            isExpanded ? "" : "w-0 overflow-hidden opacity-0"
          }`}
        >
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4" ref={profileRef}>
      <button
        className="flex h-[30px] w-full items-center text-start"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isLoadingUsers}
      >
        <span
          style={{
            backgroundColor: colors.backgroundColor,
            color: colors.color,
          }}
          className="border-oc-outline-light/60 hover:ring-oc-amber/50 flex h-[30px] w-[30px] flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border text-xs font-bold hover:ring-2"
          title={currentUser?.name}
        >
          {currentUser?.name?.slice(0, 1).toUpperCase() || "?"}
        </span>

        <div
          className={`ml-2 flex flex-1 items-center transition-all duration-200 ${
            isExpanded ? "" : "w-0 overflow-hidden opacity-0"
          }`}
        >
          {isExpanded && (
            <>
              <div className="flex-grow">
                <div className="truncate text-sm font-medium">
                  {currentUser?.name || "Selecciona usuario"}
                </div>
                {currentUser && (
                  <div className="truncate text-xs text-stone-400">
                    {currentUser.email}
                  </div>
                )}
              </div>

              <span className="ml-1 flex-shrink-0 text-white">
                <i
                  className={`fa fa-chevron-down text-xs transition-transform ${
                    isOpen ? "rotate-180 transform" : ""
                  }`}
                ></i>
              </span>
            </>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-oc-outline-light bg-oc-primary absolute bottom-15 left-1.5 z-50 mt-1 w-[210px] rounded-lg border shadow-lg">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg p-3 text-left text-sm text-white hover:bg-stone-700"
          >
            <i className="fa fa-sign-out"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
