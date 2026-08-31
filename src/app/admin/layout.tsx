/*
 * layout.tsx (Admin Layout)
 * Layout chinh cho phan quan tri (Admin panel).
 * Cau truc gom: thanh dieu huong ben trai (AdminSidebar) + thanh tren cung (AdminTopbar) + vung noi dung chinh.
 * CSS su dung ket hop Bootstrap (cho layout Admin cu) va globals-admin.css (tuy chinh rieng cho Admin).
 */

import type { Metadata } from "next";
import AdminSidebar from "@/app/admin/_components/AdminSidebar";
import AdminTopbar from "@/app/admin/_components/AdminTopbar";
import GlobalAudioTracker from "@/app/admin/_components/GlobalAudioTracker";
import "@/app/admin/globals-admin.css";

// Metadata SEO cho cac trang Admin
export const metadata: Metadata = {
  title: "BookStore Online Management",
};

// Component layout Admin: chia man hinh thanh 2 cot (sidebar + noi dung)
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-container d-flex vh-100">
      <GlobalAudioTracker />
      {/* Thanh dieu huong ben trai - hien thi menu quan ly */}
      <AdminSidebar />
      <div className="flex-grow-1 d-flex flex-column admin-main-wrapper">
        {/* Thanh tren cung - hien thi thong tin nguoi dung, thong bao */}
        <AdminTopbar />
        {/* Vung noi dung chinh - render trang con tuong ung voi URL */}
        <main className="main-content flex-grow-1 p-6 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}