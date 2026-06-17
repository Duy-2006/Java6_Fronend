"use client";
import { authFetch } from "@/lib/authFetch";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  List,
  PenTool,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  Tag,
  Tags,
  Ticket,
  LogOut
} from "lucide-react";

const NAV_GROUPS = [
  {
    heading: "Hệ Thống",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/revenue", icon: BarChart3, label: "Doanh thu" },
    ],
  },
  {
    heading: "Quản Lý",
    items: [
      { href: "/admin/books", icon: BookOpen, label: "Sách" },
      { href: "/admin/categories", icon: List, label: "Thể loại" },
      { href: "/admin/authors", icon: PenTool, label: "Tác giả" },
      { href: "/admin/orders", icon: ShoppingCart, label: "Đơn hàng" },
      { href: "/admin/customers", icon: Users, label: "Khách hàng" },
      { href: "/admin/banners", icon: ImageIcon, label: "Banner" },
    ],
  },
  {
    heading: "Marketing",
    items: [
      { href: "/admin/promotions/new", icon: Tag, label: "Tạo khuyến mãi" },
      { href: "/admin/promotions", icon: Tags, label: "Danh sách khuyến mãi" },
      { href: "/admin/voucher/new", icon: Ticket, label: "Thêm Voucher" },
      { href: "/admin/voucher", icon: Ticket, label: "Quản lý Voucher" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("");
  const [adminAvatar, setAdminAvatar] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  const handleLogout = () => {
    authFetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
    })
      .catch((err) => console.error("Logout error:", err))
      .finally(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();
        window.location.href = "/";
      });
  };

  useEffect(() => {
    const updateAdminInfo = () => {
      authFetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => {
          if (data.role === "ADMIN") {
            setAdminName(data.name);
            setAdminAvatar(data.avatar || "");
          } else {
            handleLogout();
          }
        })
        .catch((err) => {
          console.error("Error fetching admin in sidebar:", err);
          handleLogout();
        });
    };

    updateAdminInfo();

    // Listen to storage/profile updates
    window.addEventListener("storage", updateAdminInfo);
    return () => {
      window.removeEventListener("storage", updateAdminInfo);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <Link href="/admin/dashboard" className="sidebar-brand">
        <div className="sidebar-brand-title">
          <BookOpen className="w-5 h-5 text-[#b70011]" />
          Bibliora
        </div>
        <div className="sidebar-brand-subtitle">Literary Commerce</div>
      </Link>

      {/* Nav List */}
      <div className="sidebar-content flex-grow-1 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.heading && (
              <div className="sidebar-heading">
                {group.heading}
              </div>
            )}
            <ul className="nav flex-column" id="adminMenu">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.href} className="nav-item">
                    <Link
                      href={item.href}
                      className={`nav-link ${isActive(item.href) ? "active" : ""}`}
                    >
                      <IconComponent className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Profile & Logout at Bottom */}
      <div className="p-4 border-t border-[#e6bdb8]/10 bg-[#131517] flex flex-col gap-3">
        <Link href="/admin/profile" className="flex items-center gap-3 cursor-pointer group text-decoration-none">
          <img
            src={adminAvatar ? (adminAvatar.startsWith("http") ? adminAvatar : `${API_URL}${adminAvatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName || "Admin")}&background=b70011&color=fff`}
            className="w-10 h-10 rounded-full border border-[#e6bdb8]/20 group-hover:border-[#b70011] transition-all object-cover"
            alt="Avatar"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate mb-0">{adminName || "..."}</p>
            <p className="text-xs text-[#916f6b] mb-0">Administrator</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-[#b70011] hover:text-white hover:border-[#b70011] transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}