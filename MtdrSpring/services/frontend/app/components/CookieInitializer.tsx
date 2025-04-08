import { useEffect } from "react";
import { useCookies } from "react-cookie";
import useTaskStore from "~/store";

export const CookieInitializer = () => {
  const [cookies, setCookie, removeCookie] = useCookies([
    "viewMode",
    "sidebarExpanded",
  ]);
  const initializeCookieHandler = useTaskStore(
    (state) => state.initializeCookieHandler
  );

  useEffect(() => {
    // Create a cookieHandler that uses react-cookie
    const cookieHandler = {
      get: (name: string, defaultValue: any) => {
        return name in cookies
          ? cookies[name as keyof typeof cookies]
          : defaultValue;
      },
      set: (name: string, value: string, options: any = {}) => {
        const cookieOptions = {
          path: "/",
          maxAge: options.maxAge || 60 * 60 * 24 * 365, // Default 1 year
          sameSite: "lax" as const,
        };
        setCookie(name as "viewMode" | "sidebarExpanded", value, cookieOptions);
      },
    };

    // Initialize the store with this handler
    initializeCookieHandler(cookieHandler);
  }, [cookies, setCookie, initializeCookieHandler]);

  // This is a utility component that doesn't render anything
  return null;
};
