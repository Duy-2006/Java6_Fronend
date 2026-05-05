"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalBooks: number;
  totalOrders: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalOrders: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`Lỗi ${res.status}: Không thể tải dữ liệu`);
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setAlert({ msg: err.message || "Không thể tải dữ liệu dashboard", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [API_BASE]);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 1000);
    return () => clearTimeout(timer);
  }, [alert]);

  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  if (loading) {
    return <div className="text-center py-5">Đang tải dữ liệu...</div>;
  }

  return (
    <section className="container-fluid p-0 animate__animated animate__fadeIn">
      {alert && (
        <div className={`alert alert-${alert.type === "success" ? "success" : "danger"} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          <i className={`fa-solid ${alert.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"} me-2`} />
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close" />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-primary m-0 text-uppercase">
            <i className="fa-solid fa-chart-line me-2" />Tổng quan hệ thống
          </h4>
          <small className="text-muted">Chào mừng trở lại, quản trị viên!</small>
        </div>
        <div className="text-end text-muted small">
          <i className="fa-regular fa-calendar me-1" /> {today}
        </div>
      </div>

      <div className="row g-4 mb-4">
        {[
          {
            label: "Tổng số sách", value: stats.totalBooks,
            border: "border-primary", iconBg: "bg-primary",
            icon: "fa-book", textColor: "text-primary",
            sub: <small className="text-success"><i className="fa-solid fa-arrow-trend-up me-1" />Đang kinh doanh</small>,
          },
          {
            label: "Đơn hàng mới", value: stats.totalOrders,
            border: "border-success", iconBg: "bg-success",
            icon: "fa-cart-shopping", textColor: "text-success",
            sub: <small className="text-muted">Chờ xử lý ngay</small>,
          },
          {
            label: "Khách hàng", value: stats.totalUsers,
            border: "border-warning", iconBg: "bg-warning",
            icon: "fa-users", textColor: "text-warning",
            sub: <small className="text-info"><i className="fa-solid fa-user-plus me-1" />Đã đăng ký</small>,
          },
        ].map((card) => (
          <div key={card.label} className="col-md-4">
            <div className={`card border-0 shadow-sm h-100 border-start border-4 ${card.border}`}>
              <div className="card-body d-flex align-items-center justify-content-between p-4">
                <div>
                  <span className="text-uppercase text-muted small fw-bold">{card.label}</span>
                  <h2 className="fw-bold text-dark mt-2 mb-0">{card.value.toLocaleString("vi-VN")}</h2>
                  {card.sub}
                </div>
                <div
                  className={`rounded-circle ${card.iconBg} bg-opacity-10 d-flex align-items-center justify-content-center`}
                  style={{ width: 60, height: 60 }}
                >
                  <i className={`fa-solid ${card.icon} fa-xl ${card.textColor}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-3">
          <h6 className="m-0 fw-bold text-secondary">
            <i className="fa-solid fa-rocket me-2" />Thao tác nhanh
          </h6>
        </div>
        <div className="card-body">
          <div className="d-flex gap-3 flex-wrap">
            <Link href="/admin/books/new" className="btn btn-outline-primary">
              <i className="fa-solid fa-plus me-1" /> Thêm sách mới
            </Link>
            <Link href="/admin/inventory" className="btn btn-outline-success">
              <i className="fa-solid fa-boxes-stacked me-1" /> Nhập kho
            </Link>
            <Link href="/admin/orders" className="btn btn-outline-dark">
              <i className="fa-solid fa-list-check me-1" /> Duyệt đơn hàng
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}