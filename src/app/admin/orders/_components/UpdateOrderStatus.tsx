"use client";

import { useState, useEffect } from "react";

const STATUS_CONFIG: Record<string, { label: string; allowedNext: string[] }> = {
  PENDING:   { label: "Chờ xác nhận", allowedNext: ["CONFIRMED", "CANCELLED"] },
  CONFIRMED: { label: "Đã xác nhận", allowedNext: ["SHIPPING", "CANCELLED"] },
  SHIPPING:  { label: "Đang giao hàng", allowedNext: ["COMPLETED"] },
  COMPLETED: { label: "Hoàn thành", allowedNext: [] },
  CANCELLED: { label: "Hủy đơn", allowedNext: [] },
};

interface Props {
  orderId: number;
  currentStatus: string;
  onStatusUpdated?: (newStatus: string) => void;
}

export default function UpdateOrderStatus({ orderId, currentStatus, onStatusUpdated }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Reset status khi currentStatus thay đổi (khi chọn đơn hàng khác)
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const availableOptions = STATUS_CONFIG[currentStatus]?.allowedNext || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      alert("Mã đơn hàng không hợp lệ.");
      return;
    }
    if (!availableOptions.includes(status)) {
      setMessage({ type: 'error', text: 'Trạng thái không hợp lệ cho đơn hàng này.' });
      return;
    }
    if (status === currentStatus) {
      setMessage({ type: 'error', text: 'Vui lòng chọn trạng thái khác trước khi lưu.' });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn chưa đăng nhập.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        onStatusUpdated?.(status);
        setMessage({ type: 'success', text: 'Cập nhật trạng thái thành công!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorText = await res.text();
        console.error("Update failed:", res.status, errorText);
        setMessage({ type: 'error', text: errorText || 'Cập nhật thất bại. Vui lòng thử lại.' });
      }
    } catch (error) {
      console.error("Network error:", error);
      setMessage({ type: 'error', text: 'Lỗi kết nối tới server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Thông báo nằm phía trên, không trong card */}
      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show mb-3`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="card h-100 shadow-sm" style={{ border: "2px dashed var(--primary-blue)" }}>
        <div className="card-body">
          <h6 className="fw-bold text-dark text-uppercase mb-3">
            <i className="fa-solid fa-pen-to-square me-1" /> Cập nhật trạng thái
          </h6>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small text-muted">Trạng thái đơn hàng:</label>
              <select
                className="form-select form-select-lg fw-bold text-primary"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {availableOptions.length === 0 ? (
                  <option value={currentStatus} disabled>Không thể thay đổi</option>
                ) : (
                  <>
                    <option value={currentStatus} disabled>-- Chọn trạng thái mới --</option>
                    {availableOptions.map(opt => (
                      <option key={opt} value={opt}>{STATUS_CONFIG[opt]?.label || opt}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || availableOptions.length === 0 || status === currentStatus}
              className="btn btn-primary w-100 fw-bold"
            >
              <i className="fa-solid fa-floppy-disk me-1" />
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}