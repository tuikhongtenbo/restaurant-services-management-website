"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { Form, Input, Button, Card, Typography, message } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"

const { Title, Text } = Typography

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)

    try {
      const response = await authService.login({
        email: values.email,
        password: values.password
      })

      // Nếu đăng nhập thành công, lưu token, hiện Toast và redirect
      if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken)
        message.success("Đăng nhập thành công!")
        router.push("/admin/dashboard")
      }
    } catch (error: any) {
      message.error(error.message || "Tài khoản hoặc mật khẩu không chính xác")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg border-0" styles={{ body: { padding: '2rem' } }}>
      <div className="text-center mb-8">
        <Title level={3} className="!mb-1">Đăng nhập</Title>
        <Text type="secondary">
          Đăng nhập để truy cập hệ thống quản lý
        </Text>
      </div>

      <Form
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="admin@restaurant.com"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="******"
          />
        </Form.Item>

        <Form.Item className="mb-0 mt-6">
          <Button
            type="primary"
            htmlType="submit"
            className="w-full !text-white"
            loading={loading}
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
