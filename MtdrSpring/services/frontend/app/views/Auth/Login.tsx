// app/views/Auth/Login.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import useTaskStore from "~/store";
import { ShadowTask } from "~/components/ShadowTask";

const shadowTasks = [
  {
    title: "Diseño de UI para dashboard",
    tag: "Feature" as const,
    sprint: "Sprint 2",
    startDate: "12/05/2023",
    endDate: "25/05/2023",
    rotation: 0,
  },
  {
    title: "Integración API de usuarios",
    tag: "Bug" as const,
    sprint: "Sprint 1",
    startDate: "05/04/2023",
    endDate: "15/04/2023",
    rotation: 0,
  },
  {
    title: "Optimización de rendimiento",
    tag: "Feature" as const,
    sprint: "Sprint 3",
    startDate: "10/06/2023",
    endDate: "20/06/2023",
    rotation: 0,
  },
  {
    title: "Implementar filtros avanzados",
    tag: "Feature" as const,
    sprint: "Sprint 4",
    startDate: "01/07/2023",
    endDate: "15/07/2023",
    rotation: 0,
  },
  {
    title: "Pruebas de seguridad",
    tag: "Feature" as const,
    sprint: "Sprint 5",
    startDate: "15/08/2023",
    endDate: "30/08/2023",
    rotation: 0,
  },
  {
    title: "Documentación APIs",
    tag: "Feature" as const,
    sprint: "Sprint 2",
    startDate: "20/05/2023",
    endDate: "25/05/2023",
    rotation: 0,
  },
  {
    title: "Error en autenticación",
    tag: "Bug" as const,
    sprint: "Sprint 3",
    startDate: "15/06/2023",
    endDate: "18/06/2023",
    rotation: 0,
  },
  {
    title: "Integración con Jira",
    tag: "Feature" as const,
    sprint: "Sprint 4",
    startDate: "05/07/2023",
    endDate: "20/07/2023",
    rotation: 0,
  },
  {
    title: "Exportación a Excel",
    tag: "Feature" as const,
    sprint: "Sprint 5",
    startDate: "10/08/2023",
    endDate: "20/08/2023",
    rotation: 0,
  },
  {
    title: "Notificaciones por email",
    tag: "Feature" as const,
    sprint: "Sprint 3",
    startDate: "12/06/2023",
    endDate: "22/06/2023",
    rotation: 0,
  },
  {
    title: "Mejora de rendimiento",
    tag: "Feature" as const,
    sprint: "Sprint 6",
    startDate: "03/09/2023",
    endDate: "15/09/2023",
    rotation: 0,
  },
  {
    title: "Panel de administración",
    tag: "Feature" as const,
    sprint: "Sprint 2",
    startDate: "10/05/2023",
    endDate: "20/05/2023",
    rotation: 0,
  },
  {
    title: "Error en carga de imágenes",
    tag: "Bug" as const,
    sprint: "Sprint 4",
    startDate: "10/07/2023",
    endDate: "12/07/2023",
    rotation: 0,
  },
  {
    title: "Sincronización con Google Calendar",
    tag: "Feature" as const,
    sprint: "Sprint 5",
    startDate: "18/08/2023",
    endDate: "28/08/2023",
    rotation: 0,
  },
];

const getGridPosition = () => {
  const gridCells = [
    // Top Row
    { top: "8%", left: "10%" },
    { top: "4%", left: "43%" },
    { top: "8%", right: "10%" },

    // Upper-Mid Row
    { top: "30%", left: "5%" },
    { top: "30%", left: "35%" },
    { top: "30%", right: "35%" },
    { top: "30%", right: "5%" },

    // Lower-Mid Row (Adjusted)
    { bottom: "30%", left: "10%" },
    { bottom: "40%", left: "40%" },
    { bottom: "40%", right: "40%" },
    { bottom: "25%", right: "10%" },

    // Bottom Row (Adjusted)
    { bottom: "5%", left: "10%" },
    { bottom: "4%", left: "43%" },
    { bottom: "5%", right: "10%" },
  ];

  return gridCells.map((cell) => ({
    style: cell,
    opacity: 0.5,
    scale: (Math.random() * 0.2 + 0.95).toFixed(2),
    rotation: (Math.random() * 10 - 5).toFixed(1),
  }));
};

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login, isAuthLoading } = useTaskStore();
  const navigate = useNavigate();

  const memoizedPositions = useMemo(() => getGridPosition(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const user = await login(email, password);
      if (user) {
        navigate("/");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred during login",
      );
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#181614] transition-discrete duration-300">
      {/* <div className="absolute top-0 left-1/2 h-[calc(50%-280px)] w-[0.5px] -translate-x-[0.5px] transform bg-gradient-to-b from-transparent to-white/15" />

      <div className="absolute bottom-0 left-1/2 h-[calc(50%-280px)] w-[0.5px] -translate-x-[0.5px] transform bg-gradient-to-t from-transparent to-white/15" /> */}

      {/* Shadow Task Cards */}
      {shadowTasks.map((task, index) => {
        const position = memoizedPositions[index % memoizedPositions.length];
        return (
          <ShadowTask
            key={index}
            title={task.title}
            tag={task.tag}
            sprint={task.sprint}
            startDate={task.startDate}
            endDate={task.endDate}
            style={position.style}
            opacity={Number(position.opacity)}
            rotation={Number(position.rotation)}
            scale={Number(position.scale)}
          />
        );
      })}

      <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center bg-gradient-to-b from-transparent to-black/30" />

      <div className="border-oc-outline-light/60 bg-oc-primary relative z-10 flex h-auto w-full max-w-5xl items-stretch overflow-hidden rounded-lg border shadow-2xl">
        {/* Left side - Full image */}
        <div className="border-oc-outline-light relative w-1/2 border-r">
          <img
            src="/login.png"
            alt="App Screenshot"
            className="absolute inset-0 h-[585px] w-full object-cover object-left"
          />
        </div>

        {/* Right side - Logo, text and login form */}
        <div className="flex w-1/2 flex-col">
          <div className="border-oc-outline-light/60 border-b p-10">
            <div className="mb-6 flex flex-row items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-10 w-10" />
              <h1 className="text-3xl font-bold text-white">Faro Tasks</h1>
            </div>

            <p className="text-base text-white/80">
              Tu plataforma para manejar tus tareas. Mejora la productividad y
              obtén visibilidad de tu equipo.
            </p>
          </div>

          <div className="p-10">
            <h2 className="mb-4 text-xl font-bold text-white">Inicia sesión</h2>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                errorMessage ? "mb-6 max-h-24 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center rounded-md border border-red-600 bg-red-500/10 p-4 text-sm text-red-400">
                <i className="fa fa-exclamation-circle mr-2"></i>
                <span className="line-clamp-1">{errorMessage}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white"
                >
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-oc-outline-light bg-oc-neutral/50 mt-2 block w-full rounded-md border px-4 py-3 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  placeholder="Introduce tu correo"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-oc-outline-light bg-oc-neutral/50 mt-2 block w-full rounded-md border px-4 py-3 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  placeholder="Introduce tu contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="bg-oc-red mt-4 flex w-full justify-center rounded-md px-4 py-3 text-base font-medium text-white transition-colors hover:bg-red-800 disabled:bg-red-900"
              >
                {isAuthLoading ? (
                  <i className="fa fa-spinner fa-spin mr-2 animate-spin self-center"></i>
                ) : (
                  <i className="fa fa-sign-in mr-2 self-center"></i>
                )}

                {isAuthLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
