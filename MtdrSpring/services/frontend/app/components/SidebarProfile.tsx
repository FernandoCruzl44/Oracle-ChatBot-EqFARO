// app/components/SidebarProfile.tsx
import { useEffect } from "react";
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

  return (
    <div className="p-2 flex items-center my-3 mx-1 rounded-xl transition-colors">
      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center mr-2">
        <i className="fa fa-user text-gray-600"></i>
      </div>

      {isLoadingUsers ? (
        <div className="flex-1">
          <div className="font-medium text-gray-400">Cargando...</div>
        </div>
      ) : (
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
            <div className="text-xs text-gray-400 pl-1">
              {currentUser.email}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
