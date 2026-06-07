"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/services/auth.service"

// 1. Định nghĩa rule kiểm tra dữ liệu bằng Zod
const loginSchema = z.object({
  email: z.string().min(1, "Email không được để trống").email("Định dạng email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống").min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // 2. Khởi tạo form với react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // 3. Hàm xử lý khi người dùng bấm Đăng Nhập
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setErrorMsg("")

    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      })

      if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken)
        // Chuyển hướng sang trang Dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Tài khoản hoặc mật khẩu không chính xác")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center tracking-tight">
          Chào mừng trở lại
        </CardTitle>
        <CardDescription className="text-center text-zinc-500">
          Đăng nhập vào hệ thống quản lý nhà hàng
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Thông báo lỗi tổng (ví dụ: Sai mật khẩu) */}
          {errorMsg && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@restaurant.com"
              {...register("email")}
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
              {/* Nút quên mật khẩu - Sẽ làm sau */}
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              {...register("password")}
              className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đăng Nhập"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
