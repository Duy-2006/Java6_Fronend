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

  const orderItems = order.orderDetails || order.details || [];

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex-1 w-full">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 bg-[#ffdad6] text-[#93000b] rounded-full flex items-center justify-center mb-6 animate-bounce">
            <span className="material-symbols-outlined text-[48px] icon-semibold">check_circle</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#b70011] mb-2">Đặt hàng thành công!</h1>
          <p className="text-[16px] text-[#545f73] max-w-lg">Cảm ơn bạn đã tin tưởng lựa chọn Bibliora. Đơn hàng của bạn đang được xử lý.</p>
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
                {orderItems.map((item, index) => (
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
                        <p className="text-[14px] font-bold text-[#191c1e]">{item.price.toLocaleString('vi-VN')}đ</p>
                        <p className="text-[10px] text-[#545f73]">x{item.quantity}</p>
                      </div>
                    </div>
                    {index < orderItems.length - 1 && (
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
                {order.discountAmount && order.discountAmount > 0 ? (
                  <div className="flex justify-between text-[14px] text-[#545f73]">
                    <span>Giảm giá voucher</span>
                    <span className="text-[#ba1a1a] font-semibold">-{order.discountAmount.toLocaleString('vi-VN')}đ</span>
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
                    {(order.totalAmount + shippingFee).toLocaleString('vi-VN')}đ
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

      <Footer />
    </div>
  );
}