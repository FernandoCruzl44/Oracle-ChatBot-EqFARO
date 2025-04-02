// app/components/SidebarProfile.tsx
import { useEffect } from "react";
import { generateAvatarColor } from "~/lib/utils";
import useTaskStore from "~/store";

export default function SidebarProfile() {
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

  return (
    <div className="p-2 flex items-center my-3 mx-1 rounded-xl transition-colors">
      {isLoadingUsers ? (
        <div className="flex-1">
          <div className="font-medium text-stone-400">Cargando...</div>
        </div>
      ) : (
        <>
          <span
            style={{
              backgroundColor: colors.backgroundColor,
              color: colors.color,
            }}
            className="w-[30px] h-[30px] text-xs rounded-xl border border-oc-outline-light/60 whitespace-nowrap flex items-center justify-center mr-2 font-bold"
            {...(currentUser && { title: currentUser.name })}
          >
            {currentUser?.name.slice(0, 1).toUpperCase()}
          </span>

          <div className="flex-1">
            <select
              className="w-full bg-transparent border-none p-0 focus:outline-none cursor-pointer"
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
              <div className="text-xs text-stone-400 pl-1">
                {currentUser.email}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
