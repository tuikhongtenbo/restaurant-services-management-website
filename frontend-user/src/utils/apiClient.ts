import type { ApiError } from "../types/auth";

export class ApiClient {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: `HTTP Error: ${response.status}`,
      };

      try {
        const data = await response.json();
        error.message = data.message || data.error || error.message;
      } catch {
        // If JSON parsing fails, use default message
      }

      throw error;
    }

    try {
      return await response.json();
    } catch {
      return {} as T;
    }
  }

  static async get<T>(url: string, headers?: HeadersInit): Promise<T> {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  static async put<T>(
    url: string,
    data?: unknown,
    headers?: HeadersInit,
  ): Promise<T> {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  static async delete<T>(url: string, headers?: HeadersInit): Promise<T> {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
    return this.handleResponse<T>(response);
  }
}

// Helper to get auth headers with JWT token
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("authToken");
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};
