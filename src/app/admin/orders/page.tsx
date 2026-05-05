'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllOrders } from "@/services/ordersService"; // ✅ import service

const STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-warning text-dark border-warning",  icon: "fa-hourglass-half" },
  CONFIRMED: { label: "Đã xác nhận",  cls: "bg-info text-dark bg-opacity-75",       icon: "fa-check"          },
  SHIPPING:  { label: "Đang giao",    cls: "bg-primary",                            icon: "fa-truck-fast"     },
  COMPLETED: { label: "Hoàn thành",   cls: "bg-success",                            icon: "fa-check-double"   },
  CANCELLED: { label: "Đã hủy",       cls: "bg-danger",                             icon: "fa-ban"            },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAllOrders(); // ✅ dùng service đã gắn token
        setOrders(data || []);
        if (!data || data.length === 0) setError("Không có đơn hàng nào.");
      } catch (err: any) {
        console.error("Fetch orders error:", err);
        const msg = err.message || "Không thể tải danh sách đơn hàng.";
        setError(msg);

        // Nếu lỗi do token hết hạn (401) -> xóa token và chuyển về login
        if (msg.includes("Token hết hạn") || msg.includes("401")) {
          localStorage.removeItem("access_token");
          setTimeout(() => {
            router.push("/admin/login"); // 👈 thay đường dẫn đăng nhập thực tế
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  useEffect(() => {
    document.title = "Danh sách Đơn Hàng";
  }, []);

  if (loading) {
    return (
      <div className="container-fluid p-0 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3 text-muted">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-0">
        <div className="alert alert-danger shadow-sm mb-3">
          {error}
          {error.includes("Token hết hạn") && (
            <div className="mt-2">
              <Link href="/admin/login" className="btn btn-sm btn-danger">
                Đăng nhập lại
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      <div className="card border-0 shadow-sm">
        <div
          className="card-header text-white py-3 d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-file-invoice-dollar fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Danh sách Đơn Hàng</h5>
          </div>
          <button className="btn btn-light text-primary btn-sm fw-bold shadow-sm opacity-75">
            <i className="fa-solid fa-download me-1" /> Xuất Excel
          </button>
        </div>

        <div className="card-body p-0">
          {orders.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-clipboard-list fa-3x mb-3 opacity-25 d-block" />
              <p className="m-0 fw-bold">Chưa có đơn hàng nào.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle mb-0">
                <thead>
                  <tr className="text-center text-uppercase small fw-bold text-secondary" style={{ backgroundColor: "#f8f9fa" }}>
                    <th style={{ width: 120 }}>Mã Đơn</th>
                    <th className="text-start">Khách hàng</th>
                    <th>Ngày đặt</th>
                    <th className="text-end">Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th style={{ width: 120 }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const status = STATUS_MAP[order.status] ?? {
                      label: order.status, cls: "bg-secondary", icon: "fa-circle",
                    };
                    const orderDate = order.orderDate
                      ? new Date(order.orderDate).toLocaleString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—";
                    const amount = new Intl.NumberFormat("vi-VN").format(order.totalAmount ?? 0);
                    return (
                      <tr key={order.id}>
                        <td className="text-center">
                          <span className="badge bg-light text-secondary border font-monospace">
                            {order.orderCode || order.id}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <strong className="text-primary mb-1">
                              <i className="fa-regular fa-user me-1 text-muted small" />
                              {order.customerName || "Khách lẻ"}
                            </strong>
                            <small className="text-muted">
                              <i className="fa-solid fa-phone me-1 small" />
                              {order.customerPhone || "—"}
                            </small>
                          </div>
                        </td>
                        <td className="text-center text-muted">
                          <i className="fa-regular fa-clock me-1 small" />
                          {orderDate}
                        </td>
                        <td className="text-end fw-bold text-danger fs-6">
                          {amount} <span className="text-muted small text-decoration-underline">đ</span>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill shadow-sm ${status.cls}`}>
                            <i className={`fa-solid ${status.icon} me-1`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="btn btn-outline-primary btn-sm fw-bold"
                            title="Xem chi tiết đơn hàng"
                          >
                            <i className="fa-solid fa-eye me-1" /> Chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {orders.length > 0 && (
          <div className="card-footer bg-white border-0 py-3">
            <div className="small text-muted text-center">
              Tổng số <strong className="text-dark">{orders.length}</strong> đơn hàng trong hệ thống.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}