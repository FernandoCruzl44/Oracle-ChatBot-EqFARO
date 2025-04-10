// src/utils/api.ts

const API_BASE_URL = "/api"; // This will use your proxy setup

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

/**
 * Centralized API client that handles authentication and requests
 */
export const api = {
  /**
   * Make an API request
   */
  async request<T = any>(
    endpoint: string,
    options: ApiOptions = {},
  ): Promise<T> {
    const { method = "GET", body, headers = {}, requiresAuth = true } = options;
    const enableLogs = false;

    // Build request headers
    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    // Set Content-Type for JSON requests with body
    if (body && !requestHeaders["Content-Type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }

    // Add authorization header if required and token exists
    if (requiresAuth) {
      const token = localStorage.getItem("token");
      if (enableLogs) {
        console.log(
          "Token retrieved in api.request:",
          token ? "found" : "not found",
        ); // Add log
      }
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
        if (enableLogs) {
          console.log(
            "Authorization header set:",
            requestHeaders["Authorization"],
          ); // Add log
        }
      } else {
        if (enableLogs) {
          console.log(
            "Authorization header NOT set because token was not found.",
          ); // Add log
        }
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: "include", // Include cookies with all requests
    };

    // Add request body if present
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Make the request
    try {
      if (enableLogs) {
        console.log("Fetching:", `${API_BASE_URL}${endpoint}`, requestOptions); // Add log
      }

      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        requestOptions,
      );

      // Handle common HTTP errors
      if (!response.ok) {
        // Handle authentication errors (401/403)
        if (response.status === 401 || response.status === 403) {
          // Clear token on auth errors
          localStorage.removeItem("token");

          // You can redirect to login page here if needed
          // window.location.href = '/login';
        }

        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: response.statusText };
        }

        throw new Error(errorData.message || "API request failed");
      }

      // Check if response is empty (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      // Parse and return JSON response
      return (await response.json()) as T;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  },

  /**
   * Convenience methods for common HTTP verbs
   */
  get<T = any>(
    endpoint: string,
    options: Omit<ApiOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T = any>(
    endpoint: string,
    data: any,
    options: Omit<ApiOptions, "method"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data,
    });
  },

  put<T = any>(
    endpoint: string,
    data: any,
    options: Omit<ApiOptions, "method"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body: data });
  },

  delete<T = any>(
    endpoint: string,
    options: Omit<ApiOptions, "method"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  },

  /**
   * Delete multiple items by sending an array of IDs in the request body
   */
  deleteMultiple<T = any>(
    endpoint: string,
    ids: number[],
    options: Omit<ApiOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
      body: ids,
    });
  },

  /**
   * Authentication-specific methods
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: any }> {
    const response = await this.request<{
      token: string;
      expiresIn: number;
      user: any;
    }>("/auth/login", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    });

    // Store token in localStorage
    if (response.token) {
      localStorage.setItem("token", response.token);
    }

    return { token: response.token, user: response.user };
  },

  async logout(): Promise<void> {
    localStorage.removeItem("token");
    // You could also call a backend logout endpoint if needed
  },

  async getCurrentUser(): Promise<any> {
    return this.get("/users/me"); // Use the correct endpoint path
  },

  // Add other API-specific methods as needed
};
