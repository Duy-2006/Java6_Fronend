"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

// ================================================================
// CONSTANTS
// ================================================================

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ xác nhận", cls: "bg-amber-500/8 text-[#b45309] border border-amber-500/20" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-[#0066cc]/8 text-[#0066cc] border border-[#0066cc]/20" },
  SHIPPING: { label: "Đang giao", cls: "bg-purple-500/8 text-purple-700 border border-purple-500/20" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-[#34c759]/8 text-[#008a00] border border-[#34c759]/20" },
  CANCELLED: { label: "Đã hủy", cls: "bg-[#C92127]/8 text-[#C92127] border border-[#C92127]/20" },
};

const STATUS_OPTIONS = ["", "PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<string, string> = {
  "": "Tất cả",
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ================================================================
// HELPERS
// ================================================================

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n));

const getUserIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.id || payload.user_id || null;
  } catch {
    return null;
  }
};

const getToken = () => localStorage.getItem("token");

const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return "/images/book-default.jpg";
  let cleanUrl = imagePath;
  if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
  if (cleanUrl.startsWith("/")) cleanUrl = cleanUrl.substring(1);
  return `${BASE_URL}/uploads/books/${cleanUrl}`;
};

const getOrderCoverImage = (order: any): string => {
  const details = order.details || order.orderDetails || [];
  return getImageUrl(details[0]?.bookImageUrl);
};

const getFallbackShippingFee = (
  customerAddress: string | undefined,
  details: any[]
): number => {
  if (!customerAddress) return 0;
  const parts = customerAddress.split(",").map((s) => s.trim());
  const provName = parts[parts.length - 1] || "";
  if (!provName) return 0;

  const totalWeight = details.reduce((acc, item) => acc + item.quantity * 250, 0) || 500;

  const isHaNoi = provName.includes("Hà Nội");
  const northernProvinces = [
    "Hải Phòng", "Quảng Ninh", "Hải Dương", "Hưng Yên", "Bắc Ninh", "Vĩnh Phúc",
    "Thái Nguyên", "Phú Thọ", "Bắc Giang", "Hòa Bình", "Sơn La", "Điện Biên",
    "Lai Châu", "Lào Cai", "Yên Bái", "Hà Giang", "Tuyên Quang", "Cao Bằng",
    "Bắc Kạn", "Lạng Sơn", "Thái Bình", "Nam Định", "Ninh Bình", "Thanh Hóa",
  ];
  const isNorthern = northernProvinces.some((p) => provName.includes(p));

  let baseFee = 38000;
  if (isHaNoi) baseFee = 22000;
  else if (isNorthern) baseFee = 30000;

  const weightSurcharge =
    totalWeight > 1000 ? Math.floor((totalWeight - 1000) / 500) * 5000 : 0;

  return baseFee + weightSurcharge;
};

const computeDisplayTotal = (order: any): { total: number; shipFee: number } => {
  const detailsList = order.details || order.orderDetails || [];
  const totalAmount = order.totalAmount ?? 0;

  const shipFee =
    order.shippingFee != null
      ? order.shippingFee
      : getFallbackShippingFee(order.customerAddress, detailsList);

  return {
    total: totalAmount + shipFee,
    shipFee,
  };
};

// ================================================================
// COMPONENT
// ================================================================

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!token || !userId) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ userId: userId.toString() });
      if (status) params.append("status", status);

      const res = await fetch(`${BASE_URL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (!res.ok) throw new Error("Không thể tải đơn hàng");

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      const ordersWithDetails = await Promise.all(
        list.map(async (order: any) => {
          const hasDetails =
            (order.details && order.details.length > 0) ||
            (order.orderDetails && order.orderDetails.length > 0);

          if (hasDetails) return order;

          try {
            const detailRes = await fetch(
              `${BASE_URL}/api/orders/${order.id}?userId=${userId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!detailRes.ok) return order;
            const detailData = await detailRes.json();
            return {
              ...order,
              ...detailData,
              details: detailData.details || [],
              orderDetails: detailData.orderDetails || [],
            };
          } catch {
            return order;
          }
        })
      );

      setOrders(ordersWithDetails);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [status]);

  const cancelOrder = async (id: number) => {
    const token = getToken();
    const userId = getUserIdFromToken();
    if (!token || !userId) return;

    const reason = window.prompt("Vui lòng nhập lý do hủy đơn hàng:");
    if (!reason?.trim()) {
      alert("Bạn chưa nhập lý do hủy. Vui lòng nhập lý do.");
      return;
    }
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng này với lý do: "${reason}"?`)) return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/orders/cancel/${id}?userId=${userId}&cancelReason=${encodeURIComponent(reason)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o))
        );
        alert("Đã hủy đơn thành công.");
      } else {
        alert(`Hủy đơn thất bại: ${await res.text()}`);
      }
    } catch {
      alert("Lỗi kết nối khi hủy đơn.");
    }
  };

  const confirmReceived = async (id: number) => {
    const token = getToken();
    const userId = getUserIdFromToken();
    if (!token || !userId) return;
    if (!confirm("Xác nhận bạn đã nhận được hàng?")) return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/orders/${id}/confirm-received?userId=${userId}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "COMPLETED" } : o))
        );
        alert("Cảm ơn bạn đã xác nhận nhận hàng!");
      } else {
        alert(`Lỗi: ${await res.text()}`);
      }
    } catch {
      alert("Lỗi kết nối đến máy chủ.");
    }
  };

  return (
    <div className="bg-[#f5f5f7] min-h-screen pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-[38px] font-bold text-[#0a1317] tracking-tight leading-tight">
              Đơn hàng của tôi
            </h1>
            <p className="text-[#86868b] text-sm mt-2 font-medium tracking-tight">
              Theo dõi và quản lý tình trạng đơn hàng của bạn
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-[#0a1317] border-2 border-[#0a1317] rounded-full font-bold text-sm tracking-tight transition-all duration-200 hover:bg-[#0a1317] hover:text-white active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Tiếp tục mua sắm
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-[24px] border border-[#e5e5e7] p-5 md:p-6 mb-8 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[#86868b] text-lg">filter_alt</span>
            <span className="font-bold text-[#1c1c1e] text-sm tracking-tight">Lọc trạng thái:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => {
              const isActive = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4.5 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 active:scale-95 shadow-sm
                    ${isActive
                      ? "bg-[#0a1317] text-white border border-transparent"
                      : "bg-white text-[#1d1d1f] border border-[#e5e5e7] hover:border-[#86868b]"}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Danh sách đơn hàng */}
        <div className="space-y-6">

          {loading && (
            <div className="bg-white rounded-[32px] border border-[#e5e5e7] p-16 text-center shadow-sm">
              <div className="w-8 h-8 border-4 border-[#C92127] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#86868b] text-sm font-semibold tracking-tight">Đang tải đơn hàng của bạn...</p>
            </div>
          )}

          {error && (
            <div className="bg-[#C92127]/5 border border-[#C92127]/20 rounded-[24px] p-8 text-center text-[#C92127]">
              <span className="material-symbols-outlined text-4xl mb-2">error</span>
              <p className="font-bold text-base tracking-tight">{error}</p>
              <button
                onClick={fetchOrders}
                className="mt-4 px-6 py-2 bg-[#C92127] text-white rounded-full font-bold text-xs tracking-tight hover:bg-[#A8171C] transition active:scale-95"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="bg-white rounded-[32px] border border-[#e5e5e7] p-16 text-center max-w-2xl mx-auto transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <span className="material-symbols-outlined text-6xl text-[#86868b] mb-4">shopping_bag</span>
              <p className="text-xl font-bold text-[#0a1317] tracking-tight mb-2">Bạn chưa có đơn hàng nào</p>
              <p className="text-[#86868b] text-sm font-medium tracking-tight mb-6">Hãy khám phá tủ sách của chúng tôi để chọn ngay cuốn sách yêu thích nhé.</p>
              <Link
                href="/books"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C92127] text-white rounded-full font-bold text-sm tracking-tight hover:bg-[#A8171C] transition active:scale-95 shadow-sm"
              >
                Bắt đầu mua sắm
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          )}

          {orders.map((order) => {
            const st = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-gray-100 text-gray-700" };
            const date = order.orderDate
              ? new Date(order.orderDate).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
              : "—";

            const coverImg = getOrderCoverImage(order);
            const { total: totalWithShip, shipFee } = computeDisplayTotal(order);

            return (
              <div
                key={order.id}
                className="bg-white rounded-[32px] border border-[#e5e5e7] hover:shadow-[0_15px_40px_rgba(0,0,0,0.03)] transition-all duration-300 overflow-hidden"
              >
                <div style={{ display: "flex", flexDirection: "row", gap: "24px", padding: "32px", alignItems: "flex-start" }}>

                  {/* ✅ Thumbnail — khung cố định, không co giãn */}
                  <div style={{ flexShrink: 0, alignSelf: "flex-start", width: "120px", minWidth: "120px" }}>
                    <div
                      className="bg-[#f5f5f7] rounded-[16px] border border-[#e5e5e7] p-2 flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-300 hover:scale-[1.03]"
                      style={{ width: "120px", height: "158px", minWidth: "120px", minHeight: "158px", flexShrink: 0 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImg}
                        alt="Ảnh sách"
                        style={{
                          width: "104px",
                          height: "142px",
                          objectFit: "contain",
                          display: "block",
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/book-default.jpg";
                        }}
                      />
                    </div>
                  </div>

                  {/* Order info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top row: order code + date + status badge */}
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="font-bold text-lg text-[#0a1317] tracking-tight truncate">
                          Mã đơn: <span className="font-mono text-[#C92127]">{order.orderCode}</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-[#86868b] text-xs font-semibold mt-1.5 tracking-tight uppercase">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {date}
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-tight border ${st.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                        {st.label}
                      </span>
                    </div>

                    {/* Bottom row: pricing + action buttons */}
                    <div className="border-t border-[#e5e5e7]/80 pt-4 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                      {/* Pricing block */}
                      <div className="space-y-1">
                        <div className="flex flex-col gap-0.5 text-xs text-[#86868b] font-medium tracking-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="w-20 shrink-0">Tiền sách:</span>
                            <span className="text-[#1c1c1e] font-bold">{fmt(order.totalAmount ?? 0)} đ</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-20 shrink-0">Phí ship:</span>
                            <span className="text-[#1c1c1e] font-bold">{fmt(shipFee)} đ</span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider whitespace-nowrap">Tổng:</span>
                          <span className="text-xl font-extrabold text-[#C92127] tracking-tight whitespace-nowrap">
                            {fmt(totalWithShip)} đ
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2.5 items-center flex-wrap shrink-0">
                        {order.status === "PENDING" && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="inline-flex items-center gap-1 px-4 py-2.5 border border-[#C92127] text-[#C92127] hover:bg-[#C92127]/5 rounded-full text-xs font-bold tracking-tight transition active:scale-95 duration-150"
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            Hủy đơn
                          </button>
                        )}
                        {order.status === "SHIPPING" && (
                          <button
                            onClick={() => confirmReceived(order.id)}
                            className="inline-flex items-center gap-1 px-4 py-2.5 bg-[#34c759] text-white hover:bg-[#008a00] rounded-full text-xs font-bold tracking-tight transition active:scale-95 duration-150 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm">local_shipping</span>
                            Đã nhận hàng
                          </button>
                        )}
                        <Link
                          href={`/user/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-5 py-2.5 bg-[#0a1317] text-white hover:bg-[#232325] rounded-full text-xs font-bold tracking-tight transition active:scale-95 duration-150 shadow-sm"
                        >
                          Xem chi tiết
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}