"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

// ================================================================
// CONSTANTS
// ================================================================

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  SHIPPING: { label: "Đang giao", cls: "bg-purple-50 text-purple-700 border border-purple-200" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-green-50 text-green-700 border border-green-200" },
  CANCELLED: { label: "Đã hủy", cls: "bg-red-50 text-red-700 border border-red-200" },
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

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

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

  // Profile data for sidebar
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const decoded = parseJwt(token);
    if (decoded) {
      setUserName(decoded.username || "");
      setUserRole(decoded.role || "USER");
    }

    fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.name) {
          setUserName(data.name);
        }
      })
      .catch((err) => console.error("Error fetching profile name:", err));
  }, []);

  const fetchOrders = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!token || !userId) {
      router.push("/auth/login");
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
        router.push("/auth/login");
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

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">

        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-5 shadow-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f4f6]">
              <div className="w-12 h-12 rounded-full bg-[#b70011]/8 text-[#b70011] flex items-center justify-center text-xl font-bold border-2 border-white ring-4 ring-[#b70011]/5 select-none font-mono">
                {userName ? userName.trim().charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#b70011] truncate">{userName || "Người dùng"}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{userRole || "USER"}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1 mt-6">
              <Link
                href="/user/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                <span>Thông tin tài khoản</span>
              </Link>
              <Link
                href="/user/my-orders"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-[#ffdad6]/40 text-[#b70011]"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                <span>Lịch sử mua hàng</span>
              </Link>
              <Link 
                href="/user/my-audiobooks" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">headphones</span>
                <span>Sách nói của tôi</span>
              </Link>
              <Link
                href="/user/cart"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">shopping_cart</span>
                <span>Giỏ hàng của tôi</span>
              </Link>
            </nav>

            <div className="border-t border-[#e0e3e5] mt-5 pt-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-[#b70011] hover:bg-[#ffdad6]/20 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-6">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#191c1e] tracking-tight">Đơn hàng của tôi</h1>
              <p className="text-gray-500 text-xs mt-1">Theo dõi, kiểm tra chi tiết và tình trạng đơn hàng của bạn</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e0e3e5] text-gray-700 hover:text-[#b70011] hover:border-[#b70011] rounded-full text-xs font-bold transition-all duration-200 self-start"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Tiếp tục mua sắm
            </Link>
          </div>

          {/* Status filter bar */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0 text-gray-500">
              <span className="material-symbols-outlined text-base">filter_alt</span>
              <span className="font-bold text-xs uppercase tracking-wider">Lọc:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => {
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm
                      ${isActive
                        ? "bg-[#b70011] text-white border border-transparent"
                        : "bg-white text-gray-700 border border-[#e0e3e5] hover:border-gray-400"}`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders list wrapper */}
          <div className="space-y-4">

            {loading && (
              <div className="bg-white rounded-2xl border border-[#e0e3e5] p-16 text-center shadow-sm">
                <div className="w-8 h-8 border-4 border-[#b70011] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-xs font-semibold">Đang tải danh sách đơn hàng của bạn...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-[#b70011]">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p className="font-bold text-sm tracking-tight">{error}</p>
                <button
                  onClick={fetchOrders}
                  className="mt-4 px-6 py-2 bg-[#b70011] text-white rounded-full font-bold text-xs hover:bg-[#93000b] transition active:scale-95"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && orders.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#e0e3e5] p-16 text-center max-w-xl mx-auto shadow-sm">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">shopping_bag</span>
                <p className="text-base font-bold text-[#191c1e] mb-1">Bạn chưa có đơn hàng nào</p>
                <p className="text-gray-500 text-xs mb-5">Hãy khám phá tủ sách của chúng tôi để chọn ngay cuốn sách yêu thích nhé.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#b70011] text-white rounded-full font-bold text-xs hover:bg-[#93000b] transition active:scale-95 shadow-sm"
                >
                  Bắt đầu mua sắm
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
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
                  className="bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-6 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
                >

                  {/* Book cover thumbnail */}
                  <div className="w-24 h-32 shrink-0 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5] p-1.5 flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-300 hover:scale-[1.02]">
                    <img
                      src={coverImg}
                      alt="Book Cover"
                      className="w-full h-full object-contain block"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/book-default.jpg";
                      }}
                    />
                  </div>

                  {/* Order info & details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                    {/* Top Row */}
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#191c1e]">
                          Mã đơn: <span className="font-mono text-[#b70011]">{order.orderCode}</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold mt-1 tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                          {date}
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${st.cls}`}>
                        <span className="w-1 h-1 rounded-full bg-current shrink-0"></span>
                        {st.label}
                      </span>
                    </div>

                    {/* Bottom Row */}
                    <div className="border-t border-[#e0e3e5]/80 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 w-full">
                      {/* Pricing block */}
                      <div className="space-y-0.5 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="w-20 shrink-0">Tiền sách:</span>
                          <span className="text-[#191c1e] font-bold">{fmt(order.totalAmount ?? 0)} đ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 shrink-0">Phí ship:</span>
                          <span className="text-[#191c1e] font-bold">{fmt(shipFee)} đ</span>
                        </div>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng cộng:</span>
                          <span className="text-lg font-extrabold text-[#b70011] tracking-tight">
                            {fmt(totalWithShip)} đ
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 items-center flex-wrap shrink-0">
                        {order.status === "PENDING" && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 border border-[#b70011] text-[#b70011] hover:bg-[#ffdad6]/20 rounded-full text-xs font-bold transition active:scale-95 duration-150"
                          >
                            <span className="material-symbols-outlined text-xs">cancel</span>
                            Hủy đơn
                          </button>
                        )}
                        {order.status === "SHIPPING" && (
                          <button
                            onClick={() => confirmReceived(order.id)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#34c759] text-white hover:bg-green-600 rounded-full text-xs font-bold transition active:scale-95 duration-150 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">local_shipping</span>
                            Đã nhận hàng
                          </button>
                        )}
                        <Link
                          href={`/user/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-[#191c1e] text-white hover:bg-[#2d3133] rounded-full text-xs font-bold transition active:scale-95 duration-150 shadow-sm"
                        >
                          Chi tiết
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}

          </div>

        </main>

      </div>
    </div>
  );
}