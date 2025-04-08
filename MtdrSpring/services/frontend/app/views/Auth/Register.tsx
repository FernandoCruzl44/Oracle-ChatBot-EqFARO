// app/views/Auth/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import useTaskStore from "~/store";

export default function RegisterView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { register, isAuthLoading } = useTaskStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const user = await register({
        name,
        email,
        password,
        role: "developer",
      });

      if (user) {
        navigate("/login");
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An error occurred during registration");
      }
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#181614]">
      <div className="border-oc-outline-light/60 bg-oc-primary w-full max-w-md rounded-lg border p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <img src="/favicon.ico" alt="Logo" className="h-16 w-16" />
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Register for Faro
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
              htmlFor="name"
              className="block text-sm font-medium text-white"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-oc-outline-light bg-oc-neutral/50 mt-1 block w-full rounded-md border px-3 py-2 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-oc-outline-light bg-oc-neutral/50 mt-1 block w-full rounded-md border px-3 py-2 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-oc-outline-light bg-oc-neutral/50 mt-1 block w-full rounded-md border px-3 py-2 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter a password"
            />
          </div>

          <button
            type="submit"
            disabled={isAuthLoading}
            className="flex w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:bg-green-400"
          >
            {isAuthLoading ? (
              <i className="fa fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fa fa-user-plus mr-2"></i>
            )}
            {isAuthLoading ? "Registering..." : "Register"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Already have an account? Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
