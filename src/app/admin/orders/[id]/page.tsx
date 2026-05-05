'use client';

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrderById } from "@/services/ordersService";
import UpdateOrderStatus from "@/app/admin/orders/_components/UpdateOrderStatus";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Chờ xác nhận",  cls: "bg-warning text-dark border border-warning" },
  CONFIRMED: { label: "Đã xác nhận",   cls: "bg-info text-dark border border-info"        },
  SHIPPING:  { label: "Đang giao hàng",cls: "bg-light text-primary fw-bold"               },
  COMPLETED: { label: "Hoàn thành",    cls: "bg-success border border-success"            },
  CANCELLED: { label: "Đã hủy",        cls: "bg-danger border border-danger"              },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Callback để cập nhật state khi trạng thái thay đổi
  const handleStatusUpdate = (newStatus: string) => {
    setOrder((prev: any) => ({ ...prev, status: newStatus }));
  };

  useEffect(() => {
    console.log("[OrderDetail] Component mounted, id from params:", id);

    const token = localStorage.getItem("token");
    console.log("[OrderDetail] Token exists:", !!token);
    if (!token) {
      console.log("[OrderDetail] Redirecting to /auth/login because no token");
      router.push("/auth/login");
      return;
    }

    if (!id) {
      console.warn("[OrderDetail] No id provided");
      setLoading(false);
      setError("Không có mã đơn hàng");
      return;
    }

    console.log("[OrderDetail] Calling getOrderById with id:", id);
    getOrderById(id as string)
      .then((data) => {
        console.log("[OrderDetail] Order data received:", data);
        setOrder(data);
        document.title = `Đơn hàng ${data.orderCode || data.id}`;
      })
      .catch((err) => {
        console.error("[OrderDetail] Error:", err);
        if (err.message?.includes("hết hạn") || err.message?.includes("401")) {
          localStorage.removeItem("token");
          router.push("/auth/login");
        } else {
          setError(err.message || "Không thể tải thông tin đơn hàng");
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="container-fluid p-0 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-fluid p-0">
        <div className="alert alert-danger shadow-sm">
          {error || "Không tìm thấy đơn hàng"}
        </div>
        <Link href="/admin/orders" className="btn btn-secondary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-secondary" };
  const orderDate = order.orderDate
    ? new Date(order.orderDate).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const details: any[] = order.orderDetails ?? [];

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {searchParams.get("success") && (
        <div className="alert alert-success alert-dismissible fade show no-print shadow-sm" role="alert">
          <i className="fa-solid fa-circle-check me-2" />
          {searchParams.get("success")}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <Link href="/admin/orders" className="btn btn-light border fw-bold text-secondary">
          <i className="fa-solid fa-arrow-left me-1" /> Quay lại danh sách
        </Link>
        <button onClick={() => window.print()} className="btn btn-dark fw-bold shadow-sm">
          <i className="fa-solid fa-print me-2" /> In Hóa Đơn
        </button>
      </div>

      <div className="card border-0 shadow-lg mb-5">
        <div
          className="card-header text-white py-4"
          style={{
            background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="m-0 fw-bold text-uppercase">Hóa Đơn Bán Hàng</h4>
              <div className="opacity-75 small mt-1">
                Mã đơn:{" "}
                <span className="font-monospace fw-bold">{order.orderCode}</span>
                <span className="mx-2">|</span>
                Ngày tạo: {orderDate}
              </div>
            </div>
            <span className={`badge fs-6 px-3 py-2 ${status.cls}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="card-body p-4 bg-white">
          <div className="row mb-4 g-4">
            <div className="col-md-7">
              <div className="p-3 bg-light rounded border h-100">
                <h6 className="fw-bold text-primary text-uppercase mb-3 border-bottom pb-2">
                  <i className="fa-solid fa-user-tag me-1" /> Thông tin nhận hàng
                </h6>
                <div className="mb-2">
                  <span className="text-muted me-2">
                    <i className="fa-solid fa-user me-2 small" />Người nhận:
                  </span>
                  <strong className="fs-5">{order.customerName || "—"}</strong>
                </div>
                <div className="mb-2">
                  <span className="text-muted me-2">
                    <i className="fa-solid fa-phone me-2 small" />Điện thoại:
                  </span>
                  <span className="font-monospace">{order.customerPhone || "—"}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted me-2">
                    <i className="fa-solid fa-location-dot me-2 small" />Địa chỉ:
                  </span>
                  <span>{order.customerAddress || "Chưa cập nhật"}</span>
                </div>
                <div>
                  <span className="text-muted me-2">
                    <i className="fa-regular fa-credit-card me-2 small" />Thanh toán:
                  </span>
                  <span className="badge bg-secondary">{order.paymentMethod || "COD"}</span>
                  {order.paymentStatus === "PAID" && (
                    <span className="badge bg-success ms-1">Đã thanh toán</span>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-5 no-print">
              <UpdateOrderStatus
                orderId={order.id}
                currentStatus={order.status}
                onStatusUpdated={handleStatusUpdate} // 👈 truyền callback
              />
            </div>
          </div>

          {/* Phần bảng sản phẩm giữ nguyên */}
          <h6 className="fw-bold text-secondary mb-3 mt-4">DANH SÁCH SẢN PHẨM</h6>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead>
                <tr className="text-center text-uppercase small fw-bold text-secondary" style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ width: 50 }}>#</th>
                  <th className="text-start">Tên sách</th>
                  <th style={{ width: 120 }}>Số lượng</th>
                  <th style={{ width: 150 }} className="text-end">Đơn giá</th>
                  <th style={{ width: 150 }} className="text-end">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, idx) => {
                  const price    = new Intl.NumberFormat("vi-VN").format(detail.price ?? 0);
                  const subtotal = new Intl.NumberFormat("vi-VN").format((detail.price ?? 0) * (detail.quantity ?? 0));
                  return (
                    <tr key={idx}>
                      <td className="text-center text-muted">{idx + 1}</td>
                      <td>
                        <strong className="text-dark">{detail.bookTitle || "Không có tên"}</strong>
                        <br />
                        <small className="text-muted">Mã sách: {detail.bookId ?? "N/A"}</small>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark border px-3">{detail.quantity}</span>
                      </td>
                      <td className="text-end">{price} đ</td>
                      <td className="text-end fw-bold">{subtotal} đ</td>
                    </tr>
                  );
                })}
                {details.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      Không có sản phẩm nào trong đơn hàng.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-light">
                <tr>
                  <td colSpan={4} className="text-end text-uppercase text-muted small pt-3">Tổng tiền hàng:</td>
                  <td className="text-end fw-bold pt-3">
                    {new Intl.NumberFormat("vi-VN").format(order.totalAmount ?? 0)} đ
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-end text-uppercase text-muted small border-0">Phí vận chuyển:</td>
                  <td className="text-end fw-bold border-0">0 đ</td>
                </tr>
                <tr className="border-top border-2 border-primary">
                  <td colSpan={4} className="text-end text-uppercase fw-bold text-primary fs-5 pt-3">Tổng thanh toán:</td>
                  <td className="text-end fw-bold text-danger fs-4 pt-3">
                    {new Intl.NumberFormat("vi-VN").format(order.totalAmount ?? 0)} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="text-center mt-5 pt-4 border-top">
            <p className="mb-1 fw-bold text-primary text-uppercase">BookStore Online</p>
            <p className="text-muted small mb-0">Cảm ơn quý khách đã mua hàng!</p>
            <p className="text-muted small">Hotline: 1900 1000 - Website: www.bookstore.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}