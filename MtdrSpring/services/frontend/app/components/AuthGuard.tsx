// app/components/AuthGuard.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import useTaskStore from "~/store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useTaskStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const initialCheckCompleted = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function performInitialCheck() {
      if (!initialCheckCompleted.current) {
        try {
          await checkAuth();
        } finally {
          if (isMounted) {
            initialCheckCompleted.current = true;
            setIsVerifying(false);
          }
        }
      } else {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    performInitialCheck();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    if (!initialCheckCompleted.current || isVerifying) {
      return;
    }

    const isAuth = isAuthenticated;
    const currentPath = location.pathname;
    const isPublicRoute =
      currentPath.startsWith("/login") || currentPath.startsWith("/register");

    if (!isAuth && !isPublicRoute) {
      navigate(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
    } else if (isAuth && isPublicRoute) {
      navigate("/");
    }
  }, [isAuthenticated, location.pathname, navigate, isVerifying]);

  if (isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#181614]">
        <div className="text-center">
          <i className="fa fa-spinner fa-spin fa-3x animate-spin text-white"></i>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const isPublicRoute =
    currentPath.startsWith("/login") || currentPath.startsWith("/register");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return isAuthenticated ? <>{children}</> : null;
}
