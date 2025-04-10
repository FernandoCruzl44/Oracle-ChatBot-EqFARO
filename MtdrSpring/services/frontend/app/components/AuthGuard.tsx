// app/components/AuthGuard.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import useTaskStore from "~/store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useTaskStore();
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function verifyAuth() {
      setIsChecking(true);
      const isAuth = await checkAuth();

      if (
        !isAuth &&
        !location.pathname.startsWith("/login") &&
        !location.pathname.startsWith("/register")
      ) {
        // Redirect to login if not authenticated and not already on login page
        navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      } else if (
        isAuth &&
        (location.pathname.startsWith("/login") ||
          location.pathname.startsWith("/register"))
      ) {
        navigate("/");
      }

      setIsChecking(false);
    }

    verifyAuth();
  }, [location.pathname, checkAuth, navigate, isAuthenticated]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#181614]">
        <div className="text-center">
          <i className="fa fa-spinner fa-spin fa-3x animate-spin text-white"></i>
        </div>
      </div>
    );
  }

  // For login/register routes, we just render children
  if (
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register")
  ) {
    return <>{children}</>;
  }

  // For protected routes, we only render if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
