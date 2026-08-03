/* eslint-disable @next/next/no-img-element */
"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface OrderDetail {
  id: number;
  bookId: number;
  bookTitle: string;
  quantity: number;
  price: number;
  bookImageUrl?: string;
  isAudiobook?: boolean;
}

interface OrderFull {
  id: number;
  orderCode: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  details: OrderDetail[];
  orderDetails: OrderDetail[];
  discountAmount?: number;
  cancelReason?: string;
  shippingFee?: number;
  memberDiscount?: number;
  requiresManualRefundContact?: boolean;
  refundContactMessage?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

const getUserIdFromToken = (): number | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null;
};

const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return "/images/book-default.jpg";
  let cleanUrl = imagePath;
  if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
  if (cleanUrl.startsWith("/")) cleanUrl = cleanUrl.substring(1);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
  return `${baseUrl}/uploads/books/${cleanUrl}`;
};

const getStatusDetails = (status: string) => {
  switch (status) {
    case "PENDING":
      return { text: "Chờ xác nhận", icon: "hourglass_empty", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    case "CONFIRMED":
      return { text: "Đã xác nhận", icon: "check_circle", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    case "PROCESSING":
      return { text: "Đang xử lý", icon: "sync", bg: "bg-blue-50 text-blue-700 border-blue-200 animate-spin" };
    case "SHIPPING":
      return { text: "Đang giao hàng", icon: "local_shipping", bg: "bg-purple-50 text-purple-700 border-purple-200" };
    case "DELIVERED":
      return { text: "Đã giao hàng", icon: "task_alt", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "COMPLETED":
      return { text: "Hoàn thành", icon: "task_alt", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "CANCELLED":
      return { text: "Đã hủy", icon: "cancel", bg: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { text: status, icon: "info", bg: "bg-gray-50 text-gray-700 border-gray-200" };
  }
};

const getPaymentDisplay = (order: OrderFull) => {
  if (order.status === "COMPLETED" || order.status === "DELIVERED")
    return { text: "Đã thanh toán", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (order.status === "CANCELLED")
    return { text: "Đã hủy", color: "text-red-700 bg-red-50 border-red-200" };
  switch (order.paymentStatus) {
    case "PAID": return { text: "Đã thanh toán", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    case "FAILED": return { text: "Thanh toán thất bại", color: "text-red-700 bg-red-50 border-red-200" };
    default: return { text: "Chưa thanh toán", color: "text-amber-700 bg-amber-50 border-amber-200" };
  }
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

function OrderDetailContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get("userId");
  const tokenUserId = getUserIdFromToken();
  const userId = urlUserId || tokenUserId;

  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho modal hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // State cho modal xác nhận nhận hàng
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [receivedLoading, setReceivedLoading] = useState(false);

  const [shippingFee, setShippingFee] = useState(0);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    document.title = "Chi tiết Đơn hàng - Crimson Books";
  }, []);

  useEffect(() => {
    if (order) {
      setShippingFee(order.shippingFee || 0);
    }
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isLoggedIn() || !userId) {
        setError("Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }
      try {
        const res = await authFetch(`${BASE_URL}/api/orders/${id}?userId=${userId}`);
        if (res.status === 401) {
          setError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Không thể tải đơn hàng");
        setOrder(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    };
    if (id && userId) fetchOrder();
  }, [id, userId]);

  // Hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy đơn.");
      return;
    }

    if (!isLoggedIn() || !userId) return;

    setCancelLoading(true);
    setCancelError("");
    try {
      const res = await authFetch(
        `${BASE_URL}/api/orders/cancel/${id}?userId=${userId}&cancelReason=${encodeURIComponent(cancelReason)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, status: "CANCELLED", cancelReason } : null);
        setShowCancelModal(false);
        setCancelReason("");
      } else {
        setCancelError(`Hủy đơn thất bại: ${await res.text()}`);
      }
    } catch {
      setCancelError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setCancelLoading(false);
    }
  };

  // Xác nhận đã nhận hàng
  const handleConfirmReceived = async () => {
    if (!isLoggedIn() || !userId) return;

    setReceivedLoading(true);
    try {
      const res = await authFetch(
        `${BASE_URL}/api/orders/${id}/confirm-received?userId=${userId}`,
        {
          method: "POST",
        }
      );
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, status: "COMPLETED" } : null);
        setShowReceivedModal(false);
      } else {
        alert(`Lỗi: ${await res.text()}`);
      }
    } catch {
      alert("Lỗi kết nối đến máy chủ.");
    } finally {
      setReceivedLoading(false);
    }
  };

  if (loading) return (
    <div className="bg-[#f7f9fb] min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#b70011] border-t-transparent" />
      </div>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="bg-[#f7f9fb] min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 text-center w-full my-12">
        <div className="bg-white border border-[#e0e3e5] rounded-xl p-8 shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-3">error</span>
          <p className="text-[#ba1a1a] mb-6 font-medium">{error}</p>
          <Link href="/user/my-orders" className="text-[#b70011] hover:underline font-bold text-[14px]">
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (!order) return null;

  const details = order.details || order.orderDetails || [];
  const itemsSubtotal = details.reduce((sum: number, item: OrderDetail) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);
  const paymentDisplay = getPaymentDisplay(order);
  const statusDetails = getStatusDetails(order.status);

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex-1 w-full">
        {/* Breadcrumbs / Header Actions */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/user/my-orders" className="flex items-center gap-2 text-[14px] text-[#545f73] hover:text-[#b70011] transition-colors font-semibold font-sans">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Danh sách đơn hàng
          </Link>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <div className="md:col-span-8 space-y-6">

            {/* General Order Info Card */}
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-[#191c1e] mb-1">Chi tiết Đơn hàng</h1>
                  <p className="text-[12px] text-[#545f73] font-mono">Mã đơn: #{order.orderCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-[12px] font-semibold rounded-full border flex items-center gap-1.5 ${statusDetails.bg}`}>
                    <span className="material-symbols-outlined text-[16px]">{statusDetails.icon}</span>
                    {statusDetails.text}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#e0e3e5]/50 pt-4 text-[13px]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Ngày đặt</span>
                  <span className="text-[14px] font-semibold text-[#191c1e] mt-1">
                    {new Date(order.orderDate).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Hình thức thanh toán</span>
                  <span className="text-[14px] font-semibold text-[#191c1e] mt-1">
                    {order.paymentMethod === "COD" ? "Thanh toán COD (Tiền mặt)"
                      : order.paymentMethod === "VNPAY" ? "VNPAY Online"
                        : order.paymentMethod === "PAYOS" ? "PayOS Online"
                          : order.paymentMethod}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Trạng thái thanh toán</span>
                  <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full border self-start mt-1 ${paymentDisplay.color}`}>
                    {paymentDisplay.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel Reason Warning */}
            {order.status === "CANCELLED" && (
              <div className="space-y-4">
                {order.cancelReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-4 items-start shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#ba1a1a] uppercase tracking-wide">Đơn hàng đã bị hủy</h3>
                      <p className="text-[14px] text-[#ba1a1a] mt-1 font-medium">Lý do: {order.cancelReason}</p>
                    </div>
                  </div>
                )}
                {order.requiresManualRefundContact && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex gap-4 items-start shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined">info</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-amber-800 uppercase tracking-wide">Thông báo hoàn tiền</h3>
                      <p className="text-[14px] text-amber-900 mt-1 font-medium leading-relaxed">{order.refundContactMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Information Card */}
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#191c1e] mb-4 border-l-4 border-[#b70011] pl-3">Thông tin nhận hàng</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Người nhận</span>
                  <span className="text-[14px] font-bold text-[#191c1e] mt-1">{order.customerName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Số điện thoại</span>
                  <span className="text-[14px] text-[#191c1e] mt-1">{order.customerPhone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Địa chỉ</span>
                  <span className="text-[14px] text-[#191c1e] mt-1 line-clamp-2" title={order.customerAddress}>
                    {order.customerAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Product List Card */}
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#191c1e] mb-4">Sản phẩm đã đặt</h2>
              <div className="space-y-4">
                {details.map((item: OrderDetail, idx: number) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-4 py-2 hover:bg-[#f7f9fb] transition-colors rounded-lg group px-2">
                      <div className="w-16 h-20 bg-[#eceef0] rounded overflow-hidden flex-shrink-0 border border-[#e0e3e5]">
                        <img
                          src={getImageUrl(item.bookImageUrl)}
                          alt={item.bookTitle}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                        />
                      </div>
                      <div className="flex-grow">
                        <Link href={`/user/books/${item.bookId}`} className="text-[14px] font-bold text-[#191c1e] group-hover:text-[#b70011] transition-colors block">
                          {item.bookTitle}
                        </Link>
                        <span className="text-[12px] text-[#545f73]">
                          {item.isAudiobook ? "Audiobook" : "Physical Book"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-[#191c1e]">{fmt(item.price)}đ</p>
                        <p className="text-[10px] text-[#545f73]">x{item.quantity}</p>
                      </div>
                    </div>
                    {idx < details.length - 1 && (
                      <div className="h-px bg-[#e0e3e5]/50 my-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-4 space-y-6">

            {/* Cost Summary & Actions Card */}
            <div className="bg-white border-t-2 border-[#b70011] border-x border-b border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#191c1e] mb-6">Tổng kết hóa đơn</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-[14px] text-[#545f73]">
                  <span>Tiền sách</span>
                  <span>{fmt(itemsSubtotal)}đ</span>
                </div>
                {(order.memberDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-[14px] text-emerald-700 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
                      Ưu đãi Hạng thành viên
                    </span>
                    <span>-{fmt(order.memberDiscount ?? 0)}đ</span>
                  </div>
                )}
                {((order.discountAmount ?? 0) - (order.memberDiscount ?? 0)) > 0 ? (
                  <div className="flex justify-between text-[14px] text-[#545f73]">
                    <span>Giảm giá voucher</span>
                    <span className="text-[#ba1a1a] font-semibold">-{fmt((order.discountAmount ?? 0) - (order.memberDiscount ?? 0))}đ</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-[14px] text-[#545f73]">
                  <span>Phí vận chuyển</span>
                  <span>
                    {calculating && (
                      <span className="inline-block w-3 h-3 border-2 border-[#b70011] border-t-transparent rounded-full animate-spin mr-1.5" />
                    )}
                    {shippingFee === 0 ? "Miễn phí" : `${fmt(shippingFee)}đ`}
                  </span>
                </div>
                <div className="pt-4 border-t border-[#e0e3e5] flex justify-between items-end">
                  <span className="text-[16px] font-bold text-[#191c1e]">Tổng cộng</span>
                  <span className="text-lg font-bold text-[#b70011]">
                    {fmt(itemsSubtotal - (order.discountAmount ?? 0) + (shippingFee ?? 0))}đ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-2">
                {order.status === "PENDING" && (
                  <button
                    onClick={() => { setShowCancelModal(true); setCancelError(""); }}
                    className="w-full py-3 bg-[#b70011] text-white text-center font-bold text-[14px] rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Yêu cầu hủy đơn
                  </button>
                )}
                {order.status === "DELIVERED" && (
                  <button
                    onClick={() => setShowReceivedModal(true)}
                    className="w-full py-3 bg-emerald-700 text-white text-center font-bold text-[14px] rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Hoàn thành đơn hàng
                  </button>
                )}
                <Link
                  href="/user/my-orders"
                  className="w-full py-3 border border-[#545f73] text-[#545f73] text-center font-bold text-[14px] rounded-lg hover:bg-[#f2f4f6] active:scale-[0.98] transition-all block text-center"
                >
                  Quay lại lịch sử mua hàng
                </Link>
              </div>
            </div>




          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-[#e0e3e5] rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-[32px] text-[#ba1a1a]">warning</span>
              <h2 className="text-[18px] font-bold text-[#191c1e]">Yêu cầu hủy đơn hàng</h2>
            </div>
            <p className="text-[13px] text-[#545f73] mb-4">
              Mã đơn: <span className="font-mono font-semibold text-[#191c1e]">#{order.orderCode}</span>
            </p>

            <label className="block text-[12px] font-bold text-[#545f73] uppercase tracking-wider mb-2">
              Lý do hủy đơn <span className="text-[#b70011]">*</span>
            </label>
            <textarea
              rows={4}
              value={cancelReason}
              onChange={(e) => { setCancelReason(e.target.value); setCancelError(""); }}
              placeholder="Vui lòng cho biết lý do bạn muốn hủy đơn hàng này..."
              className="w-full border border-[#e0e3e5] rounded-lg p-3 text-[13px] focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] resize-none"
            />
            {cancelError && (
              <p className="text-[#ba1a1a] text-[12px] mt-1.5 font-medium">{cancelError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); setCancelError(""); }}
                disabled={cancelLoading}
                className="flex-1 py-2.5 border border-[#e0e3e5] rounded-lg text-[13px] font-bold text-[#545f73] hover:bg-[#f2f4f6] transition-colors"
              >
                Không, giữ đơn
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="flex-1 py-2.5 bg-[#b70011] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Received Modal */}
      {showReceivedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-[#e0e3e5] rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-[32px] text-emerald-700">check_circle</span>
              <h2 className="text-[18px] font-bold text-[#191c1e]">Xác nhận hoàn thành đơn hàng</h2>
            </div>
            <p className="text-[13px] text-[#545f73] mb-2">
              Mã đơn: <span className="font-mono font-semibold text-[#191c1e]">#{order.orderCode}</span>
            </p>
            <p className="text-[13px] text-[#545f73] mb-6 leading-relaxed">
              Bạn xác nhận đã nhận được đầy đủ và đúng sản phẩm? Hành động này sẽ chuyển trạng thái đơn sang <strong className="text-[#191c1e]">Hoàn thành</strong> và không thể hoàn tác.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReceivedModal(false)}
                disabled={receivedLoading}
                className="flex-1 py-2.5 border border-[#e0e3e5] rounded-lg text-[13px] font-bold text-[#545f73] hover:bg-[#f2f4f6] transition-colors"
              >
                Chưa nhận
              </button>
              <button
                onClick={handleConfirmReceived}
                disabled={receivedLoading}
                className="flex-1 py-2.5 bg-emerald-700 text-white rounded-lg text-[13px] font-bold hover:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                {receivedLoading ? "Đang xử lý..." : "Hoàn thành đơn hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#f7f9fb] min-h-screen flex flex-col justify-between">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#b70011] border-t-transparent" />
        </div>
        <Footer />
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}