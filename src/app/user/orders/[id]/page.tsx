"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

const getUserIdFromToken = (): number | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.id || payload.user_id || null;
  } catch {
    return null;
  }
};

const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return "/images/book-default.jpg";
  let cleanUrl = imagePath;
  if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
  if (cleanUrl.startsWith("/")) cleanUrl = cleanUrl.substring(1);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return `${baseUrl}/uploads/books/${cleanUrl}`;
};

const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING:   "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING:"Đang xử lý",
    SHIPPING:  "Đang giao hàng",
    DELIVERED: "Đã giao hàng",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
  };
  return statusMap[status] || status;
};

const getPaymentDisplay = (order: any) => {
  if (order.status === "COMPLETED" || order.status === "DELIVERED")
    return { text: "Đã thanh toán", color: "text-green-600" };
  if (order.status === "CANCELLED")
    return { text: "Đã hủy", color: "text-red-600" };
  switch (order.paymentStatus) {
    case "PAID":   return { text: "Đã thanh toán",       color: "text-green-600" };
    case "FAILED": return { text: "Thanh toán thất bại", color: "text-red-600"   };
    default:       return { text: "Chưa thanh toán",     color: "text-yellow-600"};
  }
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

import { Suspense } from "react";

function OrderDetailContent() {
  const { id }         = useParams();
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const urlUserId      = searchParams.get("userId");
  const tokenUserId    = getUserIdFromToken();
  const userId         = urlUserId || tokenUserId;

  const [order, setOrder]               = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // State cho modal hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]       = useState("");
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [cancelError, setCancelError]         = useState("");

  // State cho modal xác nhận nhận hàng
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [receivedLoading, setReceivedLoading]     = useState(false);

  const [shippingFee, setShippingFee] = useState(0);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!order || !order.customerAddress) {
      setShippingFee(0);
      return;
    }

    const calculateFee = async () => {
      setCalculating(true);
      const parts = order.customerAddress.split(",").map((s: string) => s.trim());
      const provName = parts[parts.length - 1] || "";
      const distName = parts[parts.length - 2] || "";

      if (!provName) {
        setCalculating(false);
        return;
      }

      // Tính tổng khối lượng sách (giả định mỗi cuốn sách nặng 250g)
      const details = order.details || order.orderDetails || [];
      const totalWeight = details.reduce((acc: number, item: any) => acc + item.quantity * 250, 0) || 500;
      const subtotal = order.totalAmount || 0;

      try {
        const params = new URLSearchParams({
          pick_province: "Hà Nội",
          pick_district: "Quận Cầu Giấy",
          province: provName,
          district: distName,
          weight: totalWeight.toString(),
          value: subtotal.toString(),
          deliver_option: "none"
        });

        const res = await fetch(`/api/shipment/fee?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.fee) {
            setShippingFee(data.fee.fee);
            setCalculating(false);
            return;
          }
        }
      } catch (e) {
        console.warn("GHTK API error in order details page:", e);
      }

      // FALLBACK
      const isHaNoi = provName.includes("Hà Nội");
      const northernProvinces = [
        "Hải Phòng", "Quảng Ninh", "Hải Dương", "Hưng Yên", "Bắc Ninh", "Vĩnh Phúc", 
        "Thái Nguyên", "Phú Thọ", "Bắc Giang", "Hòa Bình", "Sơn La", "Điện Biên", 
        "Lai Châu", "Lào Cai", "Yên Bái", "Hà Giang", "Tuyên Quang", "Cao Bằng", 
        "Bắc Kạn", "Lạng Sơn", "Thái Bình", "Nam Định", "Ninh Bình", "Thanh Hóa"
      ];
      const isNorthern = northernProvinces.some((p: string) => provName.includes(p));

      let baseFee = 38000;
      if (isHaNoi) {
        baseFee = 22000;
      } else if (isNorthern) {
        baseFee = 30000;
      }

      const weightSurcharge = totalWeight > 1000 ? Math.floor((totalWeight - 1000) / 500) * 5000 : 0;
      setShippingFee(baseFee + weightSurcharge);
      setCalculating(false);
    };

    calculateFee();
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        setError("Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/orders/${id}?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          setError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Không thể tải đơn hàng");
        setOrder(await res.json());
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi");
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
    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    setCancelLoading(true);
    setCancelError("");
    try {
      const res = await fetch(
        `${BASE_URL}/api/orders/cancel/${id}?userId=${userId}&cancelReason=${encodeURIComponent(cancelReason)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        setOrder((prev: any) => ({ ...prev, status: "CANCELLED", cancelReason }));
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
    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    setReceivedLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/orders/${id}/confirm-received?userId=${userId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setOrder((prev: any) => ({ ...prev, status: "COMPLETED" }));
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
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/user/my-orders" className="text-blue-600 hover:underline">
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );

  if (!order) return null;

  const details        = order.details || order.orderDetails || [];
  const paymentDisplay = getPaymentDisplay(order);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
            <h1 className="text-2xl font-bold mb-2">Chi tiết đơn hàng</h1>
            <p className="text-gray-500">
              Mã đơn: <span className="font-mono font-semibold">{order.orderCode}</span>
            </p>
          </div>

          <div className="p-6 space-y-6">

            {/* Thông tin chung */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ngày đặt</p>
                <p className="font-semibold">{new Date(order.orderDate).toLocaleString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-gray-500">Trạng thái</p>
                <p className="font-semibold text-green-600">{getOrderStatusText(order.status)}</p>
              </div>
              <div>
                <p className="text-gray-500">Phương thức thanh toán</p>
                <p className="font-semibold">
                  {order.paymentMethod === "COD"   ? "Thanh toán khi nhận hàng (COD)"
                  : order.paymentMethod === "VNPAY" ? "VNPay"
                  : order.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Tình trạng thanh toán</p>
                <p className={`font-semibold ${paymentDisplay.color}`}>{paymentDisplay.text}</p>
              </div>
            </div>

            {/* Lý do hủy */}
            {order.status === "CANCELLED" && order.cancelReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-800">Lý do hủy đơn hàng</p>
                    <p className="text-red-700 mt-1">{order.cancelReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin giao hàng */}
            <div className="border-t pt-4">
              <h2 className="font-bold mb-2">Thông tin giao hàng</h2>
              <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-1">
                <p><span className="text-gray-500">Người nhận:</span> {order.customerName}</p>
                <p><span className="text-gray-500">Số điện thoại:</span> {order.customerPhone}</p>
                <p><span className="text-gray-500">Địa chỉ:</span> {order.customerAddress}</p>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="border-t pt-4">
              <h2 className="font-bold mb-4">Sản phẩm đã mua</h2>
              <div className="space-y-4">
                {details.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center border-b pb-4">
                    <div className="w-20 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(item.bookImageUrl)}
                        alt={item.bookTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target as HTMLImageElement).src = "/images/book-default.jpg"}
                      />
                    </div>
                    <div className="flex-1">
                      <Link href={`/books/${item.bookId}`} className="font-bold text-gray-800 hover:text-blue-600">
                        {item.bookTitle}
                      </Link>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">Số lượng: {item.quantity}</span>
                        <span className="font-semibold text-red-600">{fmt(item.price)} đ</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="border-t pt-4 flex justify-end">
              <div className="text-right w-full max-w-[280px] space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-gray-800">{fmt(order.totalAmount)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-gray-800">
                    {calculating && (
                      <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1.5" />
                    )}
                    {shippingFee === 0 ? "Miễn phí" : `${fmt(shippingFee)} đ`}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                  <span>Tổng thanh toán:</span>
                  <span className="text-xl text-red-600">{fmt(order.totalAmount + shippingFee)} đ</span>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="border-t pt-4 flex flex-wrap justify-between items-center gap-3">
              <Link href="/user/my-orders"
                className="px-5 py-2 bg-black text-white rounded-xl hover:opacity-90 transition text-sm font-semibold">
                ← Quay lại
              </Link>
              <div className="flex gap-3 flex-wrap">
                {/* Nút hủy đơn — chỉ hiện khi PENDING */}
                {order.status === "PENDING" && (
                  <button
                    onClick={() => { setShowCancelModal(true); setCancelError(""); }}
                    className="px-5 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition text-sm font-semibold">
                    Hủy đơn hàng
                  </button>
                )}
                {/* Nút đã nhận hàng — chỉ hiện khi SHIPPING */}
                {order.status === "SHIPPING" && (
                  <button
                    onClick={() => setShowReceivedModal(true)}
                    className="px-5 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition text-sm font-semibold">
                    Đã nhận hàng
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal hủy đơn ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Hủy đơn hàng</h2>
            <p className="text-sm text-gray-500 mb-4">
              Mã đơn: <span className="font-mono font-semibold">{order.orderCode}</span>
            </p>

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Lý do hủy <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={cancelReason}
              onChange={(e) => { setCancelReason(e.target.value); setCancelError(""); }}
              placeholder="Nhập lý do hủy đơn hàng..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            {cancelError && (
              <p className="text-red-500 text-xs mt-1">{cancelError}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); setCancelError(""); }}
                disabled={cancelLoading}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Không, giữ đơn
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                {cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal xác nhận đã nhận hàng ── */}
      {showReceivedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Xác nhận đã nhận hàng</h2>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Mã đơn: <span className="font-mono font-semibold">{order.orderCode}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Bạn xác nhận đã nhận được hàng? Hành động này không thể hoàn tác.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReceivedModal(false)}
                disabled={receivedLoading}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Chưa nhận
              </button>
              <button
                onClick={handleConfirmReceived}
                disabled={receivedLoading}
                className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition disabled:opacity-60">
                {receivedLoading ? "Đang xử lý..." : "Đã nhận hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-100 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
        </div>
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}