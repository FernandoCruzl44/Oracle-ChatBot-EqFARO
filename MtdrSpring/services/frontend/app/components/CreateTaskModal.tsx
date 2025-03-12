// app/components/CreateTaskModal.tsx
import { useState, useEffect } from "react";
import type { User, Task, Team } from "~/types";

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: (task: Task) => void;
  currentUser?: User | null;
  selectedTeamId?: number;
}

export default function CreateTaskModal({
  onClose,
  onSave,
  currentUser,
  selectedTeamId,
}: CreateTaskModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<"Feature" | "Issue">("Feature");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState<number | undefined>(selectedTeamId);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);

  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userTeam, setUserTeam] = useState<any | null>(null);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingUserTeam, setIsLoadingUserTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = currentUser?.role === "manager";

  useEffect(() => {
    setIsVisible(true);

    // Para managers, obtener la lista de equipos
    if (isManager) {
      setIsLoadingTeams(true);
      fetch("/api/teams/")
        .then((res) => res.json())
        .then((data) => {
          setTeams(data);
          setIsLoadingTeams(false);
        })
        .catch((error) => {
          console.error("Error fetching teams:", error);
          setIsLoadingTeams(false);
          setError("Error al cargar equipos");
        });
    }
    // Para desarrolladores, obtener su equipo
    else {
      setIsLoadingUserTeam(true);
      fetch("/api/identity/current")
        .then((res) => res.json())
        .then((userData) => {
          if (userData.teamId && userData.teamName) {
            setUserTeam({
              id: userData.teamId,
              name: userData.teamName,
              role: userData.teamRole || "member",
            });
            setTeamId(userData.teamId);
          }
          setIsLoadingUserTeam(false);
        })
        .catch((error) => {
          console.error("Error fetching user team:", error);
          setIsLoadingUserTeam(false);
          setError("Error al cargar equipo del usuario");
        });
    }

    setIsLoadingUsers(true);
    fetch("/api/users/")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setIsLoadingUsers(false);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setIsLoadingUsers(false);
        setError("Error al cargar usuarios");
      });

    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
  }, [isManager]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const toggleAssignee = (userId: number) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter((id) => id !== userId));
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startDate) {
      return;
    }

    // Para desarrolladores, si no tienen equipo, mostrar error
    if (!isManager && !userTeam?.id) {
      setError("No tienes un equipo asignado. Contacta a un administrador.");
      return;
    }

    // Para managers, el equipo es obligatorio
    if (isManager && !teamId) {
      setError("Debes seleccionar un equipo");
      return;
    }

    const newTask = {
      title,
      tag,
      status: "Backlog",
      startDate,
      endDate: endDate || null,
      description,
      team_id: teamId,
      assignee_ids: assigneeIds.length > 0 ? assigneeIds : undefined,
      // Usar user ID actual si esta disponible
      created_by_id: currentUser?.id,
    };

    fetch("/api/tasks/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.detail || "Error al crear la tarea");
          });
        }
        return response.json();
      })
      .then((data) => {
        const processedTask = {
          ...data,
          created_by:
            data.created_by ||
            data.creator?.name ||
            currentUser?.name ||
            "Usuario",
        };
        onSave(processedTask);
        handleClose();
      })
      .catch((error) => {
        console.error("Error creating task:", error);
        setError(error.message || "Error al crear la tarea");
      });
  };

  // Filtrar usuarios para mostrar solo los del equipo seleccionado
  const filteredUsers = teamId
    ? users.filter((user) => {
        return user.teamId === teamId;
      })
    : users;

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-lg w-full max-w-2xl p-6 bg-oc-primary transition-transform duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Crear Nueva Tarea</h2>
          <button
            onClick={handleClose}
            className="border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center hover:bg-oc-neutral text-gray-500 hover:text-gray-700"
          >
            <i className="fa fa-times text-xl"></i>
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4 flex items-center">
            <i className="fa fa-exclamation-circle mr-2"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitTask} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            className="w-full outline outline-oc-outline-light/60 rounded-lg p-3 text-sm bg-white"
            required
          />
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as "Feature" | "Issue")}
            className="w-full border-r-8 border-transparent p-3 text-sm rounded-lg outline outline-oc-outline-light/60 bg-white"
          >
            <option value="Feature">Feature</option>
            <option value="Issue">Issue</option>
          </select>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">
                Fecha inicio*
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full outline outline-oc-outline-light/60 rounded-lg p-3 text-sm bg-white"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full outline outline-oc-outline-light/60 rounded-lg p-3 text-sm bg-white"
              />
            </div>
          </div>

          {/* Mostrar selector de equipo solo para managers */}
          {isManager && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Equipo*
              </label>
              <select
                value={teamId || ""}
                onChange={(e) => setTeamId(Number(e.target.value) || undefined)}
                className="w-full p-3 text-sm rounded-lg outline outline-oc-outline-light/60 bg-white"
                required
              >
                <option value="">Selecciona un equipo</option>
                {isLoadingTeams ? (
                  <option disabled>Cargando equipos...</option>
                ) : (
                  teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Para desarrolladores, mostrar su equipo */}
          {!isManager && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Tu equipo
              </label>
              {isLoadingUserTeam ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-100 rounded-lg">
                  Cargando información de equipo...
                </div>
              ) : userTeam?.id ? (
                <div className="p-3 text-sm bg-blue-50 border border-blue-100 text-blue-800 rounded-lg">
                  {userTeam.name}{" "}
                  <span className="text-xs text-blue-600">
                    ({userTeam.role})
                  </span>
                </div>
              ) : (
                <div className="p-3 text-sm bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg flex items-center">
                  <span className="fa fas fa-warning mr-2"></span>
                  No perteneces a ningún equipo. Contacta a un administrador.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Asignados
            </label>
            <div className="bg-white p-2 max-h-32 overflow-y-auto rounded-lg outline outline-oc-outline-light/60">
              {isLoadingUsers ? (
                <p className="text-sm p-2">Cargando usuarios...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm p-2 text-gray-500">
                  No hay usuarios disponibles en este equipo
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center p-1">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={assigneeIds.includes(user.id)}
                      onChange={() => toggleAssignee(user.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`user-${user.id}`} className="text-sm">
                      {user.name}{" "}
                      <span className="text-xs text-gray-500">
                        ({user.role})
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (Opcional)"
            className="w-full outline outline-oc-outline-light/60 bg-white rounded-lg p-3 text-sm min-h-[80px]"
          ></textarea>

          {currentUser && (
            <div className="text-sm text-gray-500">
              Creando como: {currentUser.name}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!title || !startDate || (isManager && !teamId)}
              className="px-4 py-2 bg-white hover:bg-oc-brown rounded-lg border border-oc-outline-light flex items-center text-black hover:text-white text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
