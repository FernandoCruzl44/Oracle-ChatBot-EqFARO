// app/routes/home-layout.tsx
import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar/Sidebar";
import { Toaster, toast } from "sonner";
import { useEffect, useRef } from "react";

export default function HomeLayout() {
  const hasShownError = useRef(false);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch("/api/healthcheck");
        if (response.status !== 204 && !hasShownError.current) {
          hasShownError.current = true;
          toast.error("API no esta disponible");
        }
      } catch (error) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          toast.error("API no esta disponible");
        }
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div className="flex h-screen bg-stone-100">
      <Toaster richColors closeButton position="top-center" />
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
