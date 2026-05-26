"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  danger?: boolean;
}

const NAV_GROUPS: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/admin/dashboard", icon: "fa-gauge", label: "Dashboard" },
    ],
  },
  {
    heading: "Danh mục sản phẩm",
    items: [
      { href: "/admin/categories", icon: "fa-list", label: "Thể loại" },
      { href: "/admin/authors", icon: "fa-pen-nib", label: "Tác giả" },
      { href: "/admin/books", icon: "fa-book", label: "Sách" },
    ],
  },
  {
    heading: "Kinh doanh",
    items: [
      { href: "/admin/orders", icon: "fa-cart-shopping", label: "Đơn hàng" },
      { href: "/admin/customers", icon: "fa-users", label: "Khách hàng" },
    ],
  },
  {
    heading: "Quản lý Thanh toán",
    items: [
      { href: "/admin/revenue", icon: "fa-cart-shopping", label: "Thống Kê doanh thu" },
    ],
  },
  {
    heading: "Marketing & Khuyến mại",
    items: [
      { href: "/admin/promotions/new", icon: "fa-tag", label: "Tạo khuyến mãi" },
      { href: "/admin/promotions", icon: "fa-tags", label: "Danh sách khuyến mãi" },
      { href: "/admin/voucher/new", icon: "fa-tag", label: "Thêm Voucher" },
      { href: "/admin/voucher", icon: "fa-tags", label: "Quản lý Voucher" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <Link href="/admin/dashboard" className="sidebar-brand">
        <i className="fa-solid fa-book-open me-2" />
        BOOKSTORE
      </Link>

      <div className="sidebar-content">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.heading && (
              <div
                className={`sidebar-heading ${group.heading === "Hệ thống" ? "text-danger" : ""}`}
              >
                {group.heading}
              </div>
            )}
            <ul className="nav flex-column" id="adminMenu">
              {group.items.map((item) => (
                <li key={item.href} className="nav-item">
                  <Link
                    href={item.href}
                    className={`nav-link ${isActive(item.href) ? "active" : ""} ${item.danger ? "text-danger" : ""}`}
                  >
                    <i className={`fa-solid ${item.icon}`} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}