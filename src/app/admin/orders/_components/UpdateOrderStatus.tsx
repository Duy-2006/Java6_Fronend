"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";;

import { useState, useEffect } from "react";
import { Edit, Save, AlertCircle, Check, X } from "lucide-react";

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
  const [cancelReason, setCancelReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Reset when status updates
  useEffect(() => {
    setStatus(currentStatus);
    setCancelReason("");
    setShowReasonInput(false);
    setMessage(null);
  }, [currentStatus]);

  const availableOptions = STATUS_CONFIG[currentStatus]?.allowedNext || [];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    const isCancelled = newStatus === "CANCELLED";
    setShowReasonInput(isCancelled);
    if (!isCancelled) {
      setCancelReason("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setMessage({ type: 'error', text: "Mã đơn hàng không hợp lệ." });
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
    // Cancel status requires reason
    if (status === "CANCELLED" && !cancelReason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập lý do hủy đơn hàng.' });
      return;
    }

        if (!isLoggedIn()) {
      setMessage({ type: 'error', text: "Bạn chưa đăng nhập." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
      const payload: any = { status };
      if (status === "CANCELLED") {
        payload.cancelReason = cancelReason.trim();
      }

      const res = await authFetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onStatusUpdated?.(status);
        setMessage({ type: 'success', text: 'Cập nhật trạng thái thành công!' });
        setCancelReason("");
        setShowReasonInput(false);
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
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown text-xs font-semibold ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
          <button 
            type="button" 
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
            onClick={() => setMessage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border-2 border-dashed border-[#b70011]/30 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
        <div className="space-y-4">
          <h6 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Edit className="w-4 h-4 text-[#b70011]" />
            <span>Cập nhật trạng thái</span>
          </h6>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Trạng thái đơn hàng:</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm font-bold text-[#b70011] focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none disabled:opacity-50 cursor-pointer"
                value={status}
                onChange={handleStatusChange}
                disabled={availableOptions.length === 0}
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

            {showReasonInput && (
              <div className="space-y-1.5 animate__animated animate__fadeIn">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <span className="text-[#b70011]">*</span> Lý do hủy đơn:
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
                  rows={3}
                  placeholder="Nhập lý do hủy đơn (ví dụ: Khách yêu cầu hủy, hết hàng...)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
                <div className="text-[10px] text-slate-400 font-semibold">
                  Lý do này sẽ hiển thị cho khách hàng.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || availableOptions.length === 0 || status === currentStatus}
              className="w-full py-2.5 bg-[#b70011] text-white rounded-lg font-bold text-sm hover:bg-[#b70011]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-[#b70011]/10"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}