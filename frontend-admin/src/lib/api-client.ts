const BASE_URL = "http://localhost:8080/api";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  responseType?: "json" | "text" | "blob";
}

export async function apiClient<T>(
  endpoint: string,
  { requireAuth = true, responseType = "json", ...customConfig }: FetchOptions = {}
): Promise<T> {
  // Chuẩn bị headers mặc định
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized: Token expired or invalid");
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          window.location.href = "/auth/login";
        }
      }

      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API error: ${response.status}`);
    }

    // Nếu response rỗng (VD: 204 No Content), không parse JSON
    if (response.status === 204) {
      return {} as T;
    }

    if (responseType === "text") {
      return (await response.text()) as any as T;
    }
    if (responseType === "blob") {
      return (await response.blob()) as any as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Client Error] at ${endpoint}:`, error);
    throw error;
  }
}
