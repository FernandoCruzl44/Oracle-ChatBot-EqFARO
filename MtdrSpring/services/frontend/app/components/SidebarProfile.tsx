// app/components/SidebarProfile.tsx
import { useState, useEffect } from "react";

interface User {
  id: number;
  nombre: string;
  email: string;
  role: string;
}

export default function SidebarProfile() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/identity/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.message !== "No identity set") {
          setCurrentUser(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching current user:", error);
      });
  }, []);

  const handleChangeUser = (userId: number) => {
    if (!userId) return;

    const selectedUser = users.find((user) => user.id === Number(userId));
    if (!selectedUser) return;

    fetch(`/api/identity/set/${userId}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then(() => {
        setCurrentUser(selectedUser);

        window.location.reload();
      })
      .catch((error) => {
        console.error("Error changing user:", error);
      });
  };

  return (
    <div className="p-2 flex items-center m-3 rounded-xl transition-colors">
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
        <i className="fa fa-user text-gray-600"></i>
      </div>

      {isLoading ? (
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
                {user.nombre}
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
