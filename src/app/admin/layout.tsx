// app/admin/layout.tsx
import type { Metadata } from "next";
import AdminSidebar from "@/app/admin/_components/AdminSidebar";
import AdminTopbar from "@/app/admin/_components/AdminTopbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/app/globals.css";
import "@/app/admin/globals-admin.css";

export const metadata: Metadata = {
  title: "BookStore Online Management",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="d-flex vh-100">
      <AdminSidebar />
      <div className="flex-grow-1 d-flex flex-column">
        <AdminTopbar />
        <main className="main-content flex-grow-1 p-6 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}