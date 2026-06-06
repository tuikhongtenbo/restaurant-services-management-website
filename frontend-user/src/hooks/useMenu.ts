import { useState, useEffect } from "react";
import type { MenuItem } from "../types/menu";
import { fetchMenuItems } from "../services/menuService";

export const useMenu = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchMenuItems()
      .then((data) => {
        if (isMounted) {
          setMenu(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("useMenu error:", err);
          setError(err?.message ?? "Không thể tải thực đơn");
          setLoading(false);
          // menu sẽ là [] nếu lỗi — menuService đã có fallback mock bên trong
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { menu, loading, error };
};
