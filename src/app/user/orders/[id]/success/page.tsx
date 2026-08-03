/* eslint-disable @next/next/no-img-element */
'use client';
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
  shippingFee?: number;
  memberDiscount?: number;
}

interface BookRecommendation {
  id: number;
  title: string;
  imageUrl?: string;
  price?: number;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    document.title = "Xác nhận đặt hàng thành công |  Bookstore";
  }, []);

  useEffect(() => {
    if (order) {
      setShippingFee(order.shippingFee || 0);
    }
  }, [order]);

  // Lấy gợi ý sách
  useEffect(() => {
    const fetchRecommendations = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
      try {
        const res = await fetch(`${API_URL}/api/books?size=12`);
        if (res.ok) {
          const data = await res.json();
          const allBooks = Array.isArray(data) ? data : (data.content || []);
          const orderBookIds = new Set((order?.orderDetails || order?.details || []).map(d => d.bookId));
          const filtered = allBooks.filter((b: BookRecommendation) => !orderBookIds.has(b.id));
          setRecommendations(filtered.slice(0, 4));
        }
      } catch (e) {
        console.warn("Failed to fetch recommendations on success page:", e);
      }
    };
    if (order) {
      fetchRecommendations();
    }
  }, [order]);

  // Lấy userId từ token
  const getUserIdFromToken = (): number | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("userId") ? Number(localStorage.getItem("userId")) : null;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);

      if (!isLoggedIn()) {
        setError('Vui lòng đăng nhập để xem thông tin đơn hàng');
        setLoading(false);
        return;
      }

      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng');
        setLoading(false);
        return;
      }

      const orderIdInt = parseInt(orderId as string, 10);
      if (isNaN(orderIdInt)) {
        setError('Mã đơn hàng không hợp lệ');
        setLoading(false);
        return;
      }

      const userId = getUserIdFromToken();
      if (!userId) {
        setError('Không thể xác thực người dùng');
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
      const url = `${API_URL}/api/orders/${orderIdInt}?userId=${userId}`;

      try {
        const response = await authFetch(url, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const orderData: OrderFull = await response.json();
          setOrder(orderData);
        } else if (response.status === 404) {
          setError('Không tìm thấy đơn hàng');
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return "/images/book-default.jpg";
    let cleanUrl = imagePath;
    if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
    if (cleanUrl.startsWith("/")) cleanUrl = cleanUrl.substring(1);
    const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
    return `${API_URL}/uploads/books/${cleanUrl}`;
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'COD') return 'COD (Thanh toán khi nhận hàng)';
    if (method === 'VNPAY') return 'VNPAY';
    if (method === 'PAYOS') return 'PayOS Online';
    return method;
  };

  const labels = ["Mới nhất", "Xu hướng", "Phổ biến", "Gợi ý"];

  const handleCancelOrder = async () => {
    if (!cancelReason?.trim()) {
      alert("Bạn chưa nhập lý do hủy. Vui lòng nhập lý do.");
      return;
    }
    
    const userId = getUserIdFromToken();
    if (!userId || !order) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
      const res = await authFetch(
        `${API_URL}/api/orders/cancel/${order.id}?userId=${userId}&cancelReason=${encodeURIComponent(cancelReason)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );
      if (res.ok) {
        setOrder({ ...order, status: "CANCELLED" });
        setCancelModalVisible(false);
        setCancelReason("");
        alert("Đã hủy đơn thành công.");
      } else {
        alert(`Hủy đơn thất bại: ${await res.text()}`);
      }
    } catch (e) {
      alert("Lỗi khi hủy đơn hàng.");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
          <div className="text-center font-mono text-[13px]">
            <div className="animate-spin w-8 h-8 border-[2px] border-[#b70011] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#545f73]">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb] px-4">
          <div className="text-center bg-white p-8 border border-[#e0e3e5] rounded-[4px] max-w-sm w-full font-sans">
            <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-3">error</span>
            <h2 className="text-lg font-bold mb-2">Có lỗi xảy ra</h2>
            <p className="text-[14px] text-[#ba1a1a] mb-6 font-medium">{error}</p>
            <div className="space-y-2">
              <Link href="/" className="block w-full bg-[#b70011] hover:bg-[#b70011]/90 text-white text-[13px] font-bold py-2.5 rounded-[2px] transition duration-200 uppercase tracking-wider text-center">
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return null;
  }

  const rawOrderItems = order.orderDetails || order.details || [];
  
  // Group items by bookId to combine promo and normal priced items of the same book
  const groupedOrderItems = Array.from(
    rawOrderItems.reduce((map, item) => {
      if (!map.has(item.bookId)) {
        map.set(item.bookId, {
          id: item.id, // Just use the first id for key
          bookId: item.bookId,
          bookTitle: item.bookTitle,
          bookImageUrl: item.bookImageUrl,
          isAudiobook: item.isAudiobook,
          quantity: 0,
          totalSubtotal: 0,
        });
      }
      const grouped = map.get(item.bookId)!;
      grouped.quantity += item.quantity;
      grouped.totalSubtotal += item.price * item.quantity;
      return map;
    }, new Map<number, any>()).values()
  );

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex-1 w-full">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className={`w-20 h-20 ${order.status === "CANCELLED" ? "bg-gray-200 text-gray-500" : "bg-[#ffdad6] text-[#93000b] animate-bounce"} rounded-full flex items-center justify-center mb-6`}>
            <span className="material-symbols-outlined text-[48px] icon-semibold">
              {order.status === "CANCELLED" ? "cancel" : "check_circle"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#b70011] mb-2">
            {order.status === "CANCELLED" ? "Đơn hàng đã hủy" : "Đặt hàng thành công!"}
          </h1>
          <p className="text-[16px] text-[#545f73] max-w-lg">
            {order.status === "CANCELLED" ? "Đơn hàng của bạn đã được hủy thành công." : "Cảm ơn bạn đã tin tưởng lựa chọn Bibliora. Đơn hàng của bạn đang được xử lý."}
          </p>
        </div>

        {/* Bento Layout for Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Details Card */}
          <div className="md:col-span-8 space-y-6">
            {/* Order Info */}
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#191c1e] mb-6 border-l-4 border-[#b70011] pl-4">Thông tin đơn hàng</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Mã đơn hàng</span>
                  <span className="text-[14px] font-bold text-[#191c1e] font-mono">#{order.orderCode}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Ngày đặt</span>
                  <span className="text-[14px] text-[#191c1e]">{new Date(order.orderDate).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Thanh toán</span>
                  <span className="text-[14px] text-[#191c1e]">{getPaymentMethodLabel(order.paymentMethod)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#191c1e] mb-6 border-l-4 border-[#b70011] pl-4">Thông tin giao hàng</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Người nhận</span>
                  <span className="text-[14px] font-bold text-[#191c1e]">{order.customerName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Số điện thoại</span>
                  <span className="text-[14px] text-[#191c1e]">{order.customerPhone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Địa chỉ giao hàng</span>
                  <span className="text-[14px] text-[#191c1e] line-clamp-2" title={order.customerAddress}>{order.customerAddress}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#191c1e] mb-6">Sản phẩm đã mua</h2>
              <div className="space-y-4">
                {groupedOrderItems.map((item: any, index: number) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-4 py-2 hover:bg-[#f7f9fb] transition-colors rounded-lg group px-2">
                      <div className="w-16 h-20 bg-[#eceef0] rounded overflow-hidden flex-shrink-0 border border-[#e0e3e5]">
                        <img
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          src={getImageUrl(item.bookImageUrl)}
                          alt={item.bookTitle}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-[14px] font-bold text-[#191c1e] group-hover:text-[#b70011] transition-colors">
                          {item.bookTitle}
                        </h3>
                        <span className="text-[12px] text-[#545f73]">
                          {item.isAudiobook ? "Audiobook" : "Physical Book"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-[#191c1e]">{item.totalSubtotal.toLocaleString('vi-VN')}đ</p>
                        <p className="text-[10px] text-[#545f73]">x{item.quantity}</p>
                      </div>
                    </div>
                    {index < groupedOrderItems.length - 1 && (
                      <div className="h-px bg-[#e0e3e5]/50 my-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white border-t-2 border-[#b70011] border-x border-b border-[#e0e3e5] rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#191c1e] mb-6">Tổng kết</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-[14px] text-[#545f73]">
                  <span>Tiền sách</span>
                  <span>{((order.totalAmount || 0) + (order.discountAmount || 0)).toLocaleString('vi-VN')}đ</span>
                </div>
                {(order.memberDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-[14px] text-emerald-700 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
                      Ưu đãi Hạng thành viên
                    </span>
                    <span>-{((order.memberDiscount ?? 0)).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {((order.discountAmount ?? 0) - (order.memberDiscount ?? 0)) > 0 ? (
                  <div className="flex justify-between text-[14px] text-[#545f73]">
                    <span>Giảm giá voucher</span>
                    <span className="text-[#ba1a1a] font-semibold">-{((order.discountAmount ?? 0) - (order.memberDiscount ?? 0)).toLocaleString('vi-VN')}đ</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-[14px] text-[#545f73]">
                  <span>Phí vận chuyển</span>
                  <span>
                    {calculating && (
                      <span className="inline-block w-3 h-3 border-2 border-[#b70011] border-t-transparent rounded-full animate-spin mr-1.5" />
                    )}
                    {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <div className="pt-4 border-t border-[#e0e3e5] flex justify-between items-end">
                  <span className="text-[16px] font-bold text-[#191c1e]">Tổng cộng</span>
                  <span className="text-lg font-bold text-[#b70011]">
                    {((order.totalAmount || 0) + shippingFee).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-2">
                <Link
                  href="/user/my-orders"
                  className="w-full py-3 bg-[#b70011] text-white text-center font-bold text-[14px] rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Xem đơn hàng của tôi
                </Link>
                <Link
                  href="/"
                  className="w-full py-3 border border-[#545f73] text-[#545f73] text-center font-bold text-[14px] rounded-lg hover:bg-[#f2f4f6] active:scale-[0.98] transition-all"
                >
                  Tiếp tục mua sắm
                </Link>
                {(order.status === "PENDING" || order.status === "CONFIRMED") && order.paymentStatus !== "PAID" && (
                  <button
                    onClick={() => {
                      setCancelReason("");
                      setCancelModalVisible(true);
                    }}
                    className="w-full py-3 bg-white border border-[#ba1a1a] text-[#ba1a1a] text-center font-bold text-[14px] rounded-lg hover:bg-[#ffdad6] active:scale-[0.98] transition-all"
                  >
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Estimate Card */}
            <div className="bg-[#f2f4f6] border border-[#e0e3e5] rounded-xl p-6 flex gap-4 items-start shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#d5e0f8] flex items-center justify-center flex-shrink-0 text-[#586377]">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">Thời gian giao hàng dự kiến</p>
                <p className="text-[14px] font-bold text-[#191c1e]">2-3 ngày làm việc</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-16 text-center">
            <h2 className="text-lg font-semibold text-[#545f73] mb-8">Có thể bạn sẽ thích</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map((book, idx) => (
                <div key={book.id} className="bg-white border border-[#e0e3e5] rounded-xl overflow-hidden group hover:border-[#b70011] transition-all duration-300 p-2 shadow-sm flex flex-col justify-between">
                  <Link href={`/user/books/${book.id}`} className="block h-full flex flex-col justify-between">
                    <div>
                      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-4">
                        <img
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={getImageUrl(book.imageUrl)}
                          alt={book.title}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                        />
                      </div>
                      <p className="text-[12px] font-semibold text-[#b70011] mb-1 text-left">{labels[idx % 4]}</p>
                      <p className="text-[14px] font-bold text-[#191c1e] text-left line-clamp-2 group-hover:text-[#b70011] transition-colors" title={book.title}>
                        {book.title}
                      </p>
                    </div>
                    <div className="mt-4 text-left">
                      <span className="text-[14px] font-bold text-[#b70011]">
                        {book.price?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cancellation Modal */}
      {cancelModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-opacity duration-200">
          <div className="bg-white rounded-[20px] w-full max-w-[420px] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#b70011] text-[28px]">warning</span>
              <h3 className="text-[20px] font-bold text-[#191c1e]">Yêu cầu hủy đơn hàng</h3>
            </div>
            
            <p className="text-[14px] text-gray-600 mb-5">
              Mã đơn: <span className="font-bold text-[#191c1e]">#{order.orderCode}</span>
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
                className="flex-1 py-3 rounded-[12px] border border-[#e0e3e5] text-[#191c1e] font-bold hover:bg-gray-50 transition-all text-[14px]"
              >
                Không, giữ đơn
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 py-3 rounded-[12px] bg-[#b70011] text-white font-bold hover:bg-[#93000b] transition-all text-[14px]"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}