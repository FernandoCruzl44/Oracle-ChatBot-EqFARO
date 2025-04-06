// app/components/SidebarProfile.tsx
import { useEffect } from "react";
import { generateAvatarColor } from "~/lib/utils";
import useTaskStore from "~/store";

export default function SidebarProfile({ isExpanded = true }) {
  const users = useTaskStore((state) => state.users);
  const currentUser = useTaskStore((state) => state.currentUser);
  const isLoadingUsers = useTaskStore((state) => state.isLoadingUsers);
  const fetchUsers = useTaskStore((state) => state.fetchUsers);
  const fetchCurrentUser = useTaskStore((state) => state.fetchCurrentUser);
  const handleChangeUser = useTaskStore((state) => state.handleChangeUser);

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
    <div className="py-4 px-3 flex items-center">
      <span
        style={{
          backgroundColor: colors.backgroundColor,
          color: colors.color,
        }}
        className="w-[30px] h-[30px] text-xs rounded-xl border border-oc-outline-light/60 flex items-center justify-center font-bold flex-shrink-0"
        title={currentUser?.name}
      >
        {currentUser?.name?.slice(0, 1).toUpperCase() || "?"}
      </span>

      <div
        className={`ml-1 flex-1 transition-all duration-200 ${
          isExpanded ? "" : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <select
          className="w-full border-none p-0 bg-transparent focus:outline-none cursor-pointer"
          value={currentUser?.id || ""}
          onChange={(e) => handleChangeUser(Number(e.target.value))}
        >
          <option value="" disabled>
            Selecciona usuario
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        {currentUser && (
          <div className="text-xs text-stone-400 truncate pl-1">
            {currentUser.email}
          </div>
        )}
      </div>
    </div>
  );
}
