"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "PENDING",   label: "Chờ xác nhận"  },
  { value: "CONFIRMED", label: "Đã xác nhận"   },
  { value: "SHIPPING",  label: "Đang giao hàng"},
  { value: "COMPLETED", label: "Hoàn thành"    },
  { value: "CANCELLED", label: "Hủy đơn"       },
];

interface Props {
  orderId: number;
  currentStatus: string;
}

export default function UpdateOrderStatus({ orderId, currentStatus }: Props) {
  const router  = useRouter();
  const [status,  setStatus]  = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        router.push(
          `/admin/orders/${orderId}?success=` +
            encodeURIComponent("Cập nhật trạng thái đơn hàng thành công.")
        );
        router.refresh();
      } else {
        alert("Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch {
      alert("Lỗi kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100 fw-bold"
            style={{ backgroundColor: "var(--primary-blue)" }}
          >
            <i className="fa-solid fa-floppy-disk me-1" />
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
}