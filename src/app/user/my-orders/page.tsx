"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

// ================================================================
// CONSTANTS
// ================================================================

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-gray-200 text-gray-800" },
  CONFIRMED: { label: "Đã xác nhận",  cls: "bg-blue-100 text-blue-700" },
  SHIPPING:  { label: "Đang giao",    cls: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Hoàn thành",   cls: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy",       cls: "bg-red-100 text-red-700" },
};

const STATUS_OPTIONS = ["", "PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<string, string> = {
  "":        "Tất cả",
  PENDING:   "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING:  "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ================================================================
// HELPERS
// ================================================================

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

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

// Copy y chang hàm getImageUrl từ OrderDetailPage
const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return "/images/book-default.jpg";
  let cleanUrl = imagePath;
  if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
  if (cleanUrl.startsWith("/"))      cleanUrl = cleanUrl.substring(1);
  return `${BASE_URL}/uploads/books/${cleanUrl}`;
};

// Lấy ảnh từ order — dùng đúng field bookImageUrl như OrderDetailPage
const getOrderCoverImage = (order: any): string => {
  // API danh sách trả details hoặc orderDetails giống API chi tiết
  const details = order.details || order.orderDetails || [];
  const firstItem = details[0];
  // field đúng là bookImageUrl — giống OrderDetailPage dùng item.bookImageUrl
  return getImageUrl(firstItem?.bookImageUrl);
};

// Tính phí vận chuyển fallback dựa trên địa chỉ nhận
const getFallbackShippingFee = (customerAddress: string | undefined, details: any[], totalAmount: number): number => {
  if (!customerAddress) return 0;
  const parts = customerAddress.split(",").map(s => s.trim());
  const provName = parts[parts.length - 1] || "";
  if (!provName) return 0;

  const totalWeight = details.reduce((acc, item) => acc + item.quantity * 250, 0) || 500;
  const isHaNoi = provName.includes("Hà Nội");
  const northernProvinces = [
    "Hải Phòng", "Quảng Ninh", "Hải Dương", "Hưng Yên", "Bắc Ninh", "Vĩnh Phúc", 
    "Thái Nguyên", "Phú Thọ", "Bắc Giang", "Hòa Bình", "Sơn La", "Điện Biên", 
    "Lai Châu", "Lào Cai", "Yên Bái", "Hà Giang", "Tuyên Quang", "Cao Bằng", 
    "Bắc Kạn", "Lạng Sơn", "Thái Bình", "Nam Định", "Ninh Bình", "Thanh Hóa"
  ];
  const isNorthern = northernProvinces.some(p => provName.includes(p));

  let baseFee = 38000;
  if (isHaNoi) {
    baseFee = 22000;
  } else if (isNorthern) {
    baseFee = 30000;
  }

  const weightSurcharge = totalWeight > 1000 ? Math.floor((totalWeight - 1000) / 500) * 5000 : 0;
  return baseFee + weightSurcharge;
};

// ================================================================
// COMPONENT
// ================================================================

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders]   = useState<any[]>([]);
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchOrders = async () => {
    const token  = getToken();
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
      const list  = Array.isArray(data) ? data : [];

      // ── Nếu API danh sách không trả details/orderDetails,
      //    gọi thêm API chi tiết cho từng đơn để lấy ảnh ──
      const ordersWithDetails = await Promise.all(
        list.map(async (order: any) => {
          // Nếu đã có details rồi thì dùng luôn, không gọi thêm
          if (
            (order.details      && order.details.length      > 0) ||
            (order.orderDetails && order.orderDetails.length > 0)
          ) {
            return order;
          }

          // Chưa có → gọi API chi tiết để lấy details kèm bookImageUrl
          try {
            const detailRes = await fetch(
              `${BASE_URL}/api/orders/${order.id}?userId=${userId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!detailRes.ok) return order;
            const detailData = await detailRes.json();
            return {
              ...order,
              details:      detailData.details      || [],
              orderDetails: detailData.orderDetails || [],
            };
          } catch {
            return order; // lỗi thì trả order gốc, ảnh sẽ dùng fallback
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

  // Hủy đơn hàng
  const cancelOrder = async (id: number) => {
    const token  = getToken();
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
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "CANCELLED" } : o));
        alert("Đã hủy đơn thành công.");
      } else {
        alert(`Hủy đơn thất bại: ${await res.text()}`);
      }
    } catch {
      alert("Lỗi kết nối khi hủy đơn.");
    }
  };

  // Xác nhận đã nhận hàng
  const confirmReceived = async (id: number) => {
    const token  = getToken();
    const userId = getUserIdFromToken();
    if (!token || !userId) return;
    if (!confirm("Xác nhận bạn đã nhận được hàng?")) return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/orders/${id}/confirm-received?userId=${userId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "COMPLETED" } : o));
        alert("Cảm ơn bạn đã xác nhận nhận hàng!");
      } else {
        alert(`Lỗi: ${await res.text()}`);
      }
    } catch {
      alert("Lỗi kết nối đến máy chủ.");
    }
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
            <p className="text-gray-500 text-sm mt-1">Theo dõi tình trạng đơn hàng của bạn</p>
          </div>
          <Link href="/"
            className="px-5 py-2 bg-black text-white rounded-lg font-semibold hover:opacity-90 transition text-sm">
            ← Tiếp tục mua sắm
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-lg shadow-sm border p-5 mb-6 flex flex-wrap gap-3 items-center">
          <span className="font-semibold text-gray-700 text-sm">Lọc theo trạng thái:</span>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition border
                  ${status === s
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách đơn hàng */}
        <div className="space-y-4">

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

          {/* Lỗi */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600">
              <p className="font-semibold">{error}</p>
              <button onClick={fetchOrders} className="mt-2 text-sm underline">Thử lại</button>
            </div>
          )}

          {/* Không có đơn */}
          {!loading && !error && orders.length === 0 && (
            <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
              <p className="text-xl font-semibold mb-2">Bạn chưa có đơn hàng nào</p>
              <Link href="/books" className="text-blue-600 font-bold hover:underline">
                Bắt đầu mua sắm →
              </Link>
            </div>
          )}

          {/* Danh sách */}
          {orders.map(order => {
            const st  = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-gray-100 text-gray-700" };
            const date = order.orderDate
              ? new Date(order.orderDate).toLocaleString("vi-VN", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "—";

            // Dùng đúng field bookImageUrl như OrderDetailPage
            const coverImg = getOrderCoverImage(order);

            const detailsList = order.details || order.orderDetails || [];
            const shipFee = getFallbackShippingFee(order.customerAddress, detailsList, order.totalAmount ?? 0);
            const totalWithShip = (order.totalAmount ?? 0) + shipFee;

            return (
              <div key={order.id} className="bg-white rounded-lg border hover:shadow-md transition overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">

                  {/* Ảnh sách */}
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImg}
                        alt="Ảnh sách"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/book-default.jpg";
                        }}
                      />
                    </div>
                  </div>

                  {/* Thông tin đơn hàng */}
                  <div className="md:col-span-3">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          Mã đơn: <span className="text-black">{order.orderCode}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{date}</p>
                        <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Tổng tiền (gồm ship)</p>
                        <p className="text-2xl font-bold text-red-600">{fmt(totalWithShip)} đ</p>
                      </div>

                      <div className="flex gap-3 items-center flex-wrap">
                        {order.status === "PENDING" && (
                          <button onClick={() => cancelOrder(order.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition">
                            Hủy đơn
                          </button>
                        )}
                        {order.status === "SHIPPING" && (
                          <button onClick={() => confirmReceived(order.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition">
                            Đã nhận hàng
                          </button>
                        )}
                        <Link href={`/user/orders/${order.id}`}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
                          Xem chi tiết →
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