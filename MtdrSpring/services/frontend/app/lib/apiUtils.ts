// app/lib/apiUtils.ts
import useTaskStore from "~/store";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = useTaskStore.getState().getToken();

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401) {
    useTaskStore.getState().logout();

    // Only throw if in browser
    if (typeof window !== "undefined") {
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
}
