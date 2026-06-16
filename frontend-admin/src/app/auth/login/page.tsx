import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-zinc-50">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0">

            </div>

            {/* Login Form Container */}
            <div className="z-10 w-full max-w-md px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-2">
                        Restaurant <span className="text-blue-600">Management</span>
                    </h1>
                    <p className="text-zinc-600">Trang quản lí dành cho Admin/ Manager</p>
                </div>

                <LoginForm />
            </div>
        </div>
    )
}
