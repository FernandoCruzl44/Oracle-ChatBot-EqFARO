// app/views/Auth/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import useTaskStore from "~/store";

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login, isAuthLoading } = useTaskStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const user = await login(email, password);
      if (user) {
        navigate("/");
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An error occurred during login");
      }
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#181614]">
      <div className="border-oc-outline-light/60 bg-oc-primary w-full max-w-md rounded-lg border p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <img src="/logo.png" alt="Logo" className="h-16 w-16" />
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Iniciar sesión
        </h1>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-600 bg-red-500/10 p-3 text-sm text-red-400">
            <i className="fa fa-exclamation-circle mr-2"></i>
            {errorMessage}
          </div>
        )}

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
              className="border-oc-outline-light bg-oc-neutral/50 mt-1 block w-full rounded-md border px-3 py-2 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
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
              className="border-oc-outline-light bg-oc-neutral/50 mt-1 block w-full rounded-md border px-3 py-2 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              placeholder="Introduce tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={isAuthLoading}
            className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-blue-400"
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
  );
}
