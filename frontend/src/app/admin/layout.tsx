import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Restaurant Management",
  description: "Restaurant Management System Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
