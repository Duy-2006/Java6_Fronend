"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
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
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang xử lý",
    SHIPPING: "Đang giao hàng",
    DELIVERED: "Đã giao hàng",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
  };
  return statusMap[status] || status;
};

// Hàm xác định hiển thị tình trạng thanh toán dựa trên status và paymentStatus
const getPaymentDisplay = (order: any) => {
  // Nếu đơn hàng đã hoàn thành hoặc đã giao -> coi như đã thanh toán
  if (order.status === "COMPLETED" || order.status === "DELIVERED") {
    return { text: "Đã thanh toán", color: "text-green-600" };
  }
  if (order.status === "CANCELLED") {
    return { text: "Đã hủy", color: "text-red-600" };
  }
  switch (order.paymentStatus) {
    case "PAID": return { text: "Đã thanh toán", color: "text-green-600" };
    case "FAILED": return { text: "Thanh toán thất bại", color: "text-red-600" };
    default: return { text: "Chưa thanh toán", color: "text-yellow-600" };
  }
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get("userId");
  const tokenUserId = getUserIdFromToken();
  const userId = urlUserId || tokenUserId;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        setError("Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = `${baseUrl}/api/orders/${id}?userId=${userId}`;
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          setError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Không thể tải đơn hàng");
        const data = await res.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    };

    if (id && userId) fetchOrder();
  }, [id, userId]);

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
  }

  if (!order) return null;

  const details = order.details || order.orderDetails || [];
  const paymentDisplay = getPaymentDisplay(order);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
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
                  {order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod === "VNPAY" ? "VNPay" : order.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Tình trạng thanh toán</p>
                <p className={`font-semibold ${paymentDisplay.color}`}>{paymentDisplay.text}</p>
              </div>
            </div>

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
              <div className="text-right">
                <p className="text-gray-500 text-sm">Tổng thanh toán</p>
                <p className="text-2xl font-bold text-red-600">{fmt(order.totalAmount)} đ</p>
              </div>
            </div>

            {/* Nút quay lại */}
            <div className="text-center pt-4">
              <Link
                href="/user/my-orders"
                className="inline-block px-6 py-2 bg-black text-white rounded-xl hover:opacity-90 transition"
              >
                ← Quay lại danh sách đơn hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}