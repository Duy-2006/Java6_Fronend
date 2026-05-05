"use client";

import { useEffect, useState } from "react";

interface TopBook {
  bookId: number;
  title: string;
  sold: number;
}

interface DashboardData {
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
  deliveredOrders: number;
  topBooks: TopBook[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}

export default function RevenueDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    todayRevenue: 0,
    todayOrders: 0,
    deliveredOrders: 0,
    topBooks: [],
  });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/admin/revenue/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`Lỗi ${res.status}: Không thể tải dashboard`);
        const json = await res.json();
        setData({
          totalRevenue: json.totalRevenue ?? 0,
          todayRevenue: json.todayRevenue ?? 0,
          todayOrders: json.todayOrders ?? 0,
          deliveredOrders: json.deliveredOrders ?? 0,
          topBooks: Array.isArray(json.topBooks) ? json.topBooks : [],
        });
      } catch (err: any) {
        setAlert({ msg: err.message || "Không thể tải dữ liệu dashboard", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 1000);
    return () => clearTimeout(timer);
  }, [alert]);

  const statCards = [
    { label: "Tổng doanh thu", value: formatVND(data.totalRevenue), color: "green" },
    { label: "Doanh thu hôm nay", value: formatVND(data.todayRevenue), color: "blue" },
    { label: "Đơn hôm nay", value: data.todayOrders.toLocaleString("vi-VN"), color: "" },
    { label: "Đơn đã giao", value: data.deliveredOrders.toLocaleString("vi-VN"), color: "green" },
  ];

  if (loading) {
    return <div className="text-center py-5">Đang tải dữ liệu...</div>;
  }

  return (
    <>
      <style>{`
        .card-box { background:#fff; border-radius:16px; padding:22px; box-shadow:0 15px 30px rgba(0,0,0,0.06); }
        .card-title { font-size:14px; color:#6b7280; }
        .card-value { font-size:26px; font-weight:700; margin-top:6px; }
        .green { color:#16a34a; }
        .red   { color:#dc2626; }
        .blue  { color:#2563eb; }
      `}</style>

      <div className="container-fluid">
        {alert && (
          <div className={`alert alert-${alert.type === "success" ? "success" : "danger"} alert-dismissible fade show shadow-sm mb-4`} role="alert">
            <i className={`fa-solid ${alert.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"} me-2`} />
            {alert.msg}
            <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close" />
          </div>
        )}

        <h3 className="mb-4 fw-bold">Dashboard doanh thu</h3>

        <div className="row g-4 mb-4">
          {statCards.map((card) => (
            <div key={card.label} className="col-md-3">
              <div className="card-box">
                <div className="card-title">{card.label}</div>
                <div className={`card-value ${card.color}`}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card-box">
          <h5 className="mb-3 fw-semibold">Top sách bán chạy</h5>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID sách</th>
                <th>Tên sách</th>
                <th>Đã bán</th>
              </tr>
            </thead>
            <tbody>
              {data.topBooks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                data.topBooks.map((b) => (
                  <tr key={b.bookId}>
                    <td>{b.bookId}</td>
                    <td>{b.title}</td>
                    <td className="fw-bold text-success">{b.sold.toLocaleString("vi-VN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}