// app/components/SidebarProfile.tsx
import { useState, useEffect, useRef } from "react";
import { generateAvatarColor } from "~/lib/utils";
import useTaskStore from "~/store";
import UserSelectModal from "~/components/Selectors/UserSelectModal";

export default function SidebarProfile({ isExpanded = true }) {
  const users = useTaskStore((state) => state.users);
  const currentUser = useTaskStore((state) => state.currentUser);
  const isLoadingUsers = useTaskStore((state) => state.isLoadingUsers);
  const fetchUsers = useTaskStore((state) => state.fetchUsers);
  const fetchCurrentUser = useTaskStore((state) => state.fetchCurrentUser);
  const handleChangeUser = useTaskStore((state) => state.handleChangeUser);
  const [isOpen, setIsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, [fetchUsers, fetchCurrentUser]);

  const colors = currentUser
    ? generateAvatarColor(currentUser.name)
    : { backgroundColor: "gray", color: "white" };

  if (isLoadingUsers) {
    return (
      <div className="py-3 px-4 flex items-center">
        <div className="w-[30px] h-[30px] flex items-center justify-center flex-shrink-0">
          <i className="fa fa-spinner fa-spin text-stone-400"></i>
        </div>
        <div
          className={`ml-2 text-stone-400 transition-all duration-200 ${
            isExpanded ? "" : "w-0 opacity-0 overflow-hidden"
          }`}
        >
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-3" ref={profileRef}>
      <button
        className="flex items-center text-start w-full h-[30px] "
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
          className="w-[30px] h-[30px] text-xs rounded-xl border border-oc-outline-light/60 flex items-center justify-center font-bold flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-oc-amber/50"
          title={currentUser?.name}
          onClick={() => setIsOpen(!isOpen)}
        >
          {currentUser?.name?.slice(0, 1).toUpperCase() || "?"}
        </span>

        <div
          className={`ml-2 flex-1 transition-all duration-200 flex items-center ${
            isExpanded ? "" : "w-0 opacity-0 overflow-hidden"
          }`}
        >
          {isExpanded && (
            <>
              <div className="flex-grow">
                <div className="font-medium text-sm truncate">
                  {currentUser?.name || "Selecciona usuario"}
                </div>
                {currentUser && (
                  <div className="text-xs text-stone-400 truncate">
                    {currentUser.email}
                  </div>
                )}
              </div>

              <span className="ml-1 text-white flex-shrink-0">
                <i
                  className={`fa fa-chevron-down text-xs transition-transform ${
                    isOpen ? "transform rotate-180" : ""
                  }`}
                ></i>
              </span>
            </>
          )}
        </div>
      </button>

      <UserSelectModal
        users={users}
        currentUser={currentUser}
        onUserChange={handleChangeUser}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        anchorRef={profileRef}
      />
    </div>
  );
}
