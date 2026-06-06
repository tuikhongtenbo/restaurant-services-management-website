import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import type { User } from "../types/auth";

// userType từ backend: CUSTOMER | STAFF | ADMIN | MANAGER | ...
export type UserType = "CUSTOMER" | "STAFF" | "ADMIN" | "MANAGER" | "KITCHEN_STAFF" | "CASHIER" | "WAITER";

interface AuthContextType {
  user: User | null;
  token: string | null;
  userType: UserType | null;
  isLoading: boolean;
  login: (loginId: string, password: string) => Promise<UserType | null | void>;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
  isAuthenticated: boolean;
  isStaff: boolean; // STAFF, ADMIN, MANAGER, WAITER, etc.
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Đọc userType từ JWT token payload
function decodeUserTypeFromToken(token: string): UserType | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userType || null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = authService.getToken();
    const storedUser = authService.getUser();   
    // Mặc định không redirect ở đây, việc redirect do ProtectedRoute xử lý ở App.tsx hoặc component
    // Trong trường hợp cần dùng ProtectedRoute component, ta sẽ bọc ở Route.
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setUserType(decodeUserTypeFromToken(storedToken));
    }
    setIsLoading(false);
  }, []);

  const login = async (loginId: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ loginId, password });
      if (response?.accessToken) {
        setToken(response.accessToken);
        setUser(response.user);
        const type = decodeUserTypeFromToken(response.accessToken);
        setUserType(type);
        return type;
      }
      return null;
    } catch (error) {
      // Re-throw để LoginPage có thể hiển thị thông báo lỗi
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    setUserType(null);
  };

  const setAuth = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setUserType(decodeUserTypeFromToken(newToken));
  };

  const isStaff = userType !== null && userType !== "CUSTOMER";
  const isCustomer = userType === "CUSTOMER";

  const value: AuthContextType = {
    user,
    token,
    userType,
    isLoading,
    login,
    logout,
    setAuth,
    isAuthenticated: !!token,
    isStaff,
    isCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
