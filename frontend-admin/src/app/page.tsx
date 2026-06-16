"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra xem đã có token đăng nhập trong localStorage chưa
    const token = localStorage.getItem("accessToken");
    
    if (token) {
      // Nếu có token (tức là đã/đang đăng nhập), chuyển thẳng vào trang admin
      router.push("/admin/dashboard");
    } else {
      // Nếu chưa có token, bắt buộc quay về trang đăng nhập
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="text-gray-500 font-medium">Đang chuyển hướng...</div>
    </div>
  );
}
