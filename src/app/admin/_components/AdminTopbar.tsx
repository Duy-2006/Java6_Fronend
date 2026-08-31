"use client";
import { authFetch } from "@/lib/authFetch";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminTopbar() {
  const [adminName, setAdminName] = useState("");
  const [adminAvatar, setAdminAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  useEffect(() => {
    const fetchAdmin = () => {
      authFetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json"
        },
      })
        .then(async res => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then(data => {
          if (data.role !== "ADMIN") {
            localStorage.removeItem("token");
            window.location.replace("/");
          } else {
            setAdminName(data.name);
            setAdminAvatar(data.avatar || "");
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          window.location.replace("/");
        })
        .finally(() => setIsLoading(false));
    };

    fetchAdmin();
    window.addEventListener("storage", fetchAdmin);
    return () => {
      window.removeEventListener("storage", fetchAdmin);
    };
  }, []);

  const getPageTitle = () => {
    if (pathname.includes("/dashboard")) return "Dashboard";
    if (pathname.includes("/revenue")) return "Doanh thu";
    if (pathname.includes("/books")) return "Sách";
    if (pathname.includes("/categories")) return "Thể loại";
    if (pathname.includes("/authors")) return "Tác giả";
    if (pathname.includes("/orders")) return "Đơn hàng";
    if (pathname.includes("/customers")) return "Khách hàng";
    if (pathname.includes("/banners")) return "Banner";
    if (pathname.includes("/promotions")) return "Khuyến mãi";
    if (pathname.includes("/voucher")) return "Vouchers";
    if (pathname.includes("/profile")) return "Thông tin cá nhân";
    return "Admin Panel";
  };

  if (isLoading) {
    return (
      <nav className="navbar px-4 py-2 bg-white shadow-sm border-b border-[#e6bdb8]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#b70011] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-400">Loading system...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar px-6 py-2 bg-white shadow-sm border-b border-[#e6bdb8]/20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium text-xs">Dashboard</span>
          <span className="text-slate-350 text-[10px]">/</span>
          <span className="text-[#191c1e] font-bold text-xs">{getPageTitle()}</span>
        </div>
      </div>

      {/* Connection Status & Quick Info */}
      <div className="flex items-center gap-3">
        {/* Admin Panel & Connected Status */}
        <div className="text-right flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-800 leading-tight">Admin Panel</span>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[9px] font-bold text-[#916f6b] tracking-wider leading-none uppercase">Connected</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* User Avatar */}
        <Link href="/admin/profile">
          <img
            src={adminAvatar ? (adminAvatar.startsWith("http") ? adminAvatar : `${API_URL}${adminAvatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName || "Le Minh")}&background=b70011&color=fff`}
            className="w-9 h-9 rounded-lg border border-slate-200/50 object-cover ml-1 shadow-sm hover:border-[#b70011] transition-all cursor-pointer"
            alt="Avatar"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </nav>
  );
}