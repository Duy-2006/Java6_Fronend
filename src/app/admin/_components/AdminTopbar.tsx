"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, Shield, Bell, Settings, HelpCircle } from "lucide-react";

export default function AdminTopbar() {
  const [adminName, setAdminName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      window.location.replace("/");
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
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
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.location.replace("/");
      })
      .finally(() => setIsLoading(false));
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
    return "Admin Panel";
  };

  const toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open");
    }
  };

  if (isLoading) {
    return (
      <nav className="navbar px-4 py-2 bg-white shadow-sm border-b border-[#e6bdb8]/20 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#b70011] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-400">Loading system...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar px-6 py-2 bg-white shadow-sm border-b border-[#e6bdb8]/20 flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 d-md-none border border-slate-200/50"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium text-xs">Dashboard</span>
          <span className="text-slate-350 text-[10px]">/</span>
          <span className="text-[#191c1e] font-bold text-xs">{getPageTitle()}</span>
        </div>
      </div>

      {/* Connection Status & Quick Info */}
      <div className="flex items-center gap-3">
        {/* Quick Action Icons */}
        <div className="flex items-center gap-1.5 text-slate-500 mr-1">
          {/* Bell Icon with Red Notification Dot */}
          <button className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-550 rounded-full border border-white" style={{ backgroundColor: "#ef4444" }}></span>
          </button>
          
          {/* Settings Icon */}
          <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <Settings className="w-4.5 h-4.5 text-slate-600" />
          </button>
          
          {/* Help Icon */}
          <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <HelpCircle className="w-4.5 h-4.5 text-slate-600" />
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-[#e6bdb8]/30 mx-1"></div>

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
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName || "Le Minh")}&background=b70011&color=fff`}
          className="w-9 h-9 rounded-lg border border-slate-200/50 object-cover ml-1 shadow-sm"
          alt="Avatar"
          loading="lazy"
          decoding="async"
        />
      </div>
    </nav>
  );
}