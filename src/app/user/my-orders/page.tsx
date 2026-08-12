"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";;

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
  DELIVERED: { label: "Giao thành công", cls: "bg-teal-50 text-teal-700 border border-teal-200" },
};

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 1,    // Chờ xác nhận (Ưu tiên số 1)
  CONFIRMED: 2,  // Đã xác nhận (Ưu tiên số 2)
  SHIPPING: 3,   // Đang giao (Ưu tiên số 3)
  DELIVERED: 4,  // Giao thành công (Ưu tiên số 4)
  COMPLETED: 5,  // Hoàn thành (Ưu tiên số 5)
  CANCELLED: 6,  // Đã hủy (Xếp cuối cùng)
};

const STATUS_OPTIONS = ["", "PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<string, string> = {
  "": "Tất cả",
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Giao thành công",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// ================================================================
// HELPERS
// ================================================================

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n));

const getUserIdFromToken = (): number | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null;
};



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
  const [activeTab, setActiveTab] = useState<'physical' | 'audio'>('physical');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Profile data for sidebar
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) return;

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserName(u.name || u.username || "");
        setUserRole(u.role || "USER");
      } catch {}
    }

    authFetch(`${BASE_URL}/api/profile`, {
      headers: { },
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
        const userId = getUserIdFromToken();

    if (!isLoggedIn() || !userId) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ userId: userId.toString() });
      if (activeTab === 'physical' && status) {
        params.append("status", status);
      } else if (activeTab === 'audio') {
        params.append("status", "COMPLETED"); // Chỉ hiển thị sách nói đã thanh toán thành công
      }
      params.append("bookType", activeTab);

      const res = await authFetch(`${BASE_URL}/api/orders?${params}`, {
        headers: { },
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
          let detailData = order;
          const hasDetails = (order.details && order.details.length > 0) || (order.orderDetails && order.orderDetails.length > 0);

          if (!hasDetails) {
            try {
              const detailRes = await authFetch(
                `${BASE_URL}/api/orders/${order.id}?userId=${userId}`,
                { headers: { } }
              );
              if (detailRes.ok) {
                detailData = await detailRes.json();
              }
            } catch {
              // fallback to original order
            }
          }
          
          let fetchedDetails = detailData.details || detailData.orderDetails || [];

          return {
            ...order,
            ...detailData,
            details: fetchedDetails,
            orderDetails: fetchedDetails
          };
        })
      );

      // Sắp xếp đơn hàng:
      // 1. Ưu tiên theo trạng thái: PENDING (Chờ xác nhận) -> CONFIRMED (Đã xác nhận) -> SHIPPING (Đang giao) -> DELIVERED (Giao thành công) -> COMPLETED (Hoàn thành) -> CANCELLED (Đã hủy)
      // 2. Trong cùng một trạng thái: Đơn mới nhất (mới đặt) luôn ở trên đầu
      const sortedOrders = [...ordersWithDetails].sort((a: any, b: any) => {
        const priorityA = STATUS_PRIORITY[a.status] ?? 99;
        const priorityB = STATUS_PRIORITY[b.status] ?? 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        const timeA = a.orderDate ? new Date(a.orderDate).getTime() : (a.id || 0);
        const timeB = b.orderDate ? new Date(b.orderDate).getTime() : (b.id || 0);
        return timeB - timeA;
      });

      setOrders(sortedOrders);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [status, activeTab]);

  const openCancelModal = (order: any) => {
    setOrderToCancel(order);
    setCancelReason("");
    setCancelModalVisible(true);
  };

  const confirmCancelOrder = async () => {
    const userId = getUserIdFromToken();
    if (!isLoggedIn() || !userId || !orderToCancel) return;

    if (!cancelReason?.trim()) {
      alert("Bạn chưa nhập lý do hủy. Vui lòng nhập lý do.");
      return;
    }

    try {
      const res = await authFetch(
        `${BASE_URL}/api/orders/cancel/${orderToCancel.id}?userId=${userId}&cancelReason=${encodeURIComponent(cancelReason)}`,
        {
          method: "POST",
          headers: {  "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        setOrders((prev) => {
          const updated = prev.map((o) => (o.id === orderToCancel.id ? { ...o, status: "CANCELLED" } : o));
          return [...updated].sort((a: any, b: any) => {
            const priorityA = STATUS_PRIORITY[a.status] ?? 99;
            const priorityB = STATUS_PRIORITY[b.status] ?? 99;
            if (priorityA !== priorityB) return priorityA - priorityB;
            const timeA = a.orderDate ? new Date(a.orderDate).getTime() : (a.id || 0);
            const timeB = b.orderDate ? new Date(b.orderDate).getTime() : (b.id || 0);
            return timeB - timeA;
          });
        });
        alert("Đã hủy đơn thành công.");
      } else {
        alert(`Hủy đơn thất bại: ${await res.text()}`);
      }
    } catch {
      alert("Lỗi kết nối khi hủy đơn.");
    } finally {
      setCancelModalVisible(false);
      setOrderToCancel(null);
    }
  };

  const confirmReceived = async (id: number) => {
        const userId = getUserIdFromToken();
    if (!isLoggedIn() || !userId) return;
    if (!confirm("Xác nhận bạn đã nhận được hàng?")) return;

    try {
      const res = await authFetch(
        `${BASE_URL}/api/orders/${id}/confirm-received?userId=${userId}`,
        { method: "POST", headers: { } }
      );
      if (res.ok) {
        setOrders((prev) => {
          const updated = prev.map((o) => (o.id === id ? { ...o, status: "COMPLETED" } : o));
          return [...updated].sort((a: any, b: any) => {
            const priorityA = STATUS_PRIORITY[a.status] ?? 99;
            const priorityB = STATUS_PRIORITY[b.status] ?? 99;
            if (priorityA !== priorityB) return priorityA - priorityB;
            const timeA = a.orderDate ? new Date(a.orderDate).getTime() : (a.id || 0);
            const timeB = b.orderDate ? new Date(b.orderDate).getTime() : (b.id || 0);
            return timeB - timeA;
          });
        });
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
                <span className="material-symbols-outlined text-lg [font-variation-settings:'FILL'_1]">history</span>
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

          {/* Tabs and Status Filter */}
          <div className="flex flex-col gap-4">
            {/* Tabs chọn Loại sách */}
            <div className="bg-white rounded-2xl border border-[#e0e3e5] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 shrink-0 text-gray-500">
                <span className="material-symbols-outlined text-base">filter_alt</span>
                <span className="font-bold text-xs uppercase tracking-wider">Lọc theo:</span>
              </div>
              <div className="flex space-x-6 border-b border-gray-200 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('physical')}
                  className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === 'physical'
                      ? 'border-[#b70011] text-[#b70011]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sách Vật Lý
                </button>
                <button
                  onClick={() => setActiveTab('audio')}
                  className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === 'audio'
                      ? 'border-[#b70011] text-[#b70011]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sách Nói
                </button>
              </div>
            </div>

            {/* Status filter bar (Only for Physical Books) */}
            {activeTab === 'physical' && (
              <div className="bg-white rounded-2xl border border-[#e0e3e5] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 shrink-0 text-gray-500">
                <span className="material-symbols-outlined text-base">list_alt</span>
                <span className="font-bold text-xs uppercase tracking-wider">Trạng thái:</span>
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
            )}
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
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
                  {activeTab === 'audio' ? 'headphones' : 'shopping_bag'}
                </span>
                <p className="text-base font-bold text-[#191c1e] mb-1">
                  {activeTab === 'audio' ? 'Tủ sách nói của bạn đang trống' : 'Bạn chưa có đơn hàng nào'}
                </p>
                <p className="text-gray-500 text-xs mb-5">
                  {activeTab === 'audio' 
                    ? 'Bạn chưa sở hữu cuốn sách nói nào. Hãy mua ngay để trải nghiệm nhé!' 
                    : 'Hãy khám phá tủ sách của chúng tôi để chọn ngay cuốn sách yêu thích nhé.'}
                </p>
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
                          <span className="w-28 shrink-0">Tiền sách:</span>
                          <span className="text-[#191c1e] font-bold">{fmt(order.totalAmount ?? 0)} đ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-28 shrink-0">Phí ship:</span>
                          <span className="text-[#191c1e] font-bold">{fmt(shipFee)} đ</span>
                        </div>
                        {(order.memberDiscount ?? 0) > 0 && (
                          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                            <span className="w-28 shrink-0 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">workspace_premium</span>
                              Hạng thành viên:
                            </span>
                            <span>-{fmt(order.memberDiscount ?? 0)} đ</span>
                          </div>
                        )}
                        {((order.discountAmount ?? 0) - (order.memberDiscount ?? 0)) > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="w-28 shrink-0">Voucher:</span>
                            <span className="text-[#b70011] font-semibold">-{fmt((order.discountAmount ?? 0) - (order.memberDiscount ?? 0))} đ</span>
                          </div>
                        )}
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
                            onClick={() => openCancelModal(order)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 border border-[#b70011] text-[#b70011] hover:bg-[#ffdad6]/20 rounded-full text-xs font-bold transition active:scale-95 duration-150"
                          >
                            <span className="material-symbols-outlined text-xs">cancel</span>
                            Hủy đơn
                          </button>
                        )}
                        {order.status === "DELIVERED" && (
                          <button
                            onClick={() => confirmReceived(order.id)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-full text-xs font-bold transition active:scale-95 duration-150 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">check_circle</span>
                            Hoàn thành đơn hàng
                          </button>
                        )}
                        <Link
                          href={`/user/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-[#191c1e] text-white hover:bg-[#2d3133] rounded-full text-xs font-bold transition active:scale-95 duration-150 shadow-sm"
                        >
                          Chi tiết
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                        
                        {activeTab === 'audio' && order.status === 'COMPLETED' && order.details && order.details.length > 0 && (
                          <Link
                            href={`/user/books/${order.details[0].bookId}/audiobook`}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-[#b70011] text-white hover:bg-[#93000b] rounded-full text-xs font-bold transition active:scale-95 duration-150 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">headphones</span>
                            Nghe ngay
                          </Link>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}

          </div>

        </main>

      </div>
      
      {/* Cancellation Modal */}
      {cancelModalVisible && orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-opacity duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[420px] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#b70011] text-[28px]">warning</span>
              <h3 className="text-[20px] font-bold text-[#191c1e]">Yêu cầu hủy đơn hàng</h3>
            </div>
            
            <p className="text-[14px] text-gray-600 mb-5">
              Mã đơn: <span className="font-bold text-[#191c1e]">#{orderToCancel.orderCode}</span>
            </p>
            
            <div className="mb-6">
              <label className="block text-[12px] font-bold text-[#545f73] uppercase tracking-wider mb-2">
                Lý do hủy đơn <span className="text-[#b70011]">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Vui lòng cho biết lý do bạn muốn hủy đơn hàng này..."
                className="w-full min-h-[120px] border border-[#e0e3e5] rounded-xl p-3.5 text-[14px] text-[#191c1e] placeholder-gray-400 focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] transition-all resize-none"
              ></textarea>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalVisible(false)}
                className="flex-1 py-3 rounded-xl border border-[#e0e3e5] text-[#191c1e] font-bold hover:bg-gray-50 transition-all text-[14px]"
              >
                Không, giữ đơn
              </button>
              <button
                onClick={confirmCancelOrder}
                className="flex-1 py-3 rounded-xl bg-[#b70011] text-white font-bold hover:bg-[#93000b] transition-all text-[14px]"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}