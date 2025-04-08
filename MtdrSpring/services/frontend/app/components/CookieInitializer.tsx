import { useEffect } from "react";
import { useCookies } from "react-cookie";
import useTaskStore from "~/store";

export const CookieInitializer = () => {
  const [cookies, setCookie, removeCookie] = useCookies([
    "viewMode",
    "sidebarExpanded",
  ]);
  const initializeCookieHandler = useTaskStore(
    (state) => state.initializeCookieHandler,
  );

  useEffect(() => {
    const cookieHandler = {
      get: (name: string, defaultValue: any) => {
        return name in cookies
          ? cookies[name as keyof typeof cookies]
          : defaultValue;
      },
      set: (name: string, value: string, options: any = {}) => {
        const cookieOptions = {
          path: "/",
          maxAge: options.maxAge || 60 * 60 * 24 * 365,
          sameSite: "lax" as const,
        };
        setCookie(name as "viewMode" | "sidebarExpanded", value, cookieOptions);
      },
    };

    initializeCookieHandler(cookieHandler);
  }, [cookies, setCookie, initializeCookieHandler]);

  return null;
};
