"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // TODO: Gọi API đăng nhập thực tế
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/admin/dashboard");
    } catch {
      setError("Email hoặc mật khẩu không chính xác.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      {/* Card */}
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl p-10"
        style={{ boxShadow: "0 4px 32px rgba(37,99,235,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
      >
        {/* Logo & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h11" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-[#1E3A5F] tracking-tight">
              Restaurant Manager
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1.5">
            Chào mừng trở lại
          </h1>
          <p className="text-sm text-[#64748B]">
            Đăng nhập để tiếp tục quản lý hệ thống
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@restaurant.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl outline-none transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:ring-3 focus:ring-[#2563EB]/10"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[#374151]">
                Mật khẩu
              </label>
              <a
                href="/forgot-password"
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 text-sm text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl outline-none transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:ring-3 focus:ring-[#2563EB]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-[#2563EB]/30"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 pt-6 border-t border-[#F1F5F9] text-center">
          <p className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} Restaurant Manager · Hệ thống quản lý nhà hàng
          </p>
        </div>
      </div>
    </div>
  );
}
