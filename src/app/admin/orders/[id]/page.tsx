'use client';
import { isLoggedIn } from "@/lib/authFetch";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getOrderById } from "@/services/ordersService";
import UpdateOrderStatus from "@/app/admin/orders/_components/UpdateOrderStatus";
import {
  Hourglass,
  Check,
  Truck,
  CheckSquare,
  Ban,
  ClipboardList,
  User,
  Phone,
  MapPin,
  CreditCard,
  Printer,
  ArrowLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-800 border-amber-200",  icon: Hourglass },
  CONFIRMED: { label: "Đã xác nhận",  cls: "bg-blue-50 text-blue-800 border-blue-200",       icon: Check },
  SHIPPING:  { label: "Đang giao",    cls: "bg-indigo-50 text-indigo-800 border-indigo-200", icon: Truck },
  COMPLETED: { label: "Hoàn thành",   cls: "bg-green-50 text-green-800 border-green-200",    icon: CheckSquare },
  CANCELLED: { label: "Đã hủy",       cls: "bg-red-50 text-red-800 border-red-200",         icon: Ban },
};

function OrderDetailContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleStatusUpdate = (newStatus: string) => {
    setOrder((prev: any) => ({ ...prev, status: newStatus }));
  };

  useEffect(() => {
        if (!isLoggedIn()) {
      router.push("/auth/login");
      return;
    }

    if (!id) {
      setLoading(false);
      setError("Không có mã đơn hàng");
      return;
    }

    getOrderById(id as string)
      .then((data) => {
        setOrder(data);
        document.title = `Đơn hàng ${data.orderCode || data.id} - Libris Admin`;
      })
      .catch((err) => {
        console.error("Error fetching order detail:", err);
        if (err.message?.includes("hết hạn") || err.message?.includes("401")) {
          localStorage.removeItem("token");
          router.push("/auth/login");
        } else {
          setError(err.message || "Không thể tải thông tin đơn hàng");
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4 p-6 font-sans">
        <div className="p-4 rounded-xl border bg-red-50 text-red-800 border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error || "Không tìm thấy đơn hàng"}</p>
        </div>
        <Link 
          href="/admin/orders" 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] ?? {
    label: order.status,
    cls: "bg-slate-50 text-slate-800 border-slate-200",
    icon: ClipboardList
  };
  const StatusIcon = status.icon;

  const orderDate = order.orderDate
    ? new Date(order.orderDate).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const details: any[] = order.orderDetails ?? [];
  const itemsSubtotal = details.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Search Success Alert */}
      {searchParams.get("success") && (
        <div className="p-4 rounded-xl border bg-green-50 text-green-800 border-green-200 shadow-sm flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-sm font-semibold">{searchParams.get("success")}</p>
          </div>
        </div>
      )}

      {/* Breadcrumbs and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Đơn hàng</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#b70011]">{order.orderCode || `#${order.id}`}</span>
          </nav>
          <h2 className="text-2xl font-bold text-[#191c1e]">Chi tiết Đơn hàng</h2>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/admin/orders" 
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </Link>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-1.5 px-3 py-2 bg-[#191c1e] text-white rounded-lg font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Hóa Đơn</span>
          </button>
        </div>
      </div>

      {/* Main Order card */}
      <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
        {/* Card Header banner */}
        <div className="p-6 bg-gradient-to-r from-[#b70011] to-[#e63946] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wide">Hóa Đơn Bán Hàng</h3>
            <div className="opacity-90 text-xs mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Mã đơn: <strong className="font-mono">{order.orderCode}</strong></span>
              <span className="hidden md:inline">|</span>
              <span>Ngày tạo: {orderDate}</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border bg-white text-slate-800 border-white/20 shadow-sm self-start md:self-auto`}>
            <StatusIcon className="w-3.5 h-3.5 text-[#b70011]" />
            {status.label}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Delivery Info */}
            <div className="md:col-span-7 bg-[#fbf6f6]/60 p-5 rounded-xl border border-[#e6bdb8]/20 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-[#b70011] uppercase tracking-wider pb-2 border-b border-[#e6bdb8]/20 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#b70011]" />
                  <span>Thông tin nhận hàng</span>
                </h4>
                
                <div className="space-y-3.5 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 font-medium w-24 flex-shrink-0 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Người nhận:
                    </span>
                    <strong className="text-slate-800 font-bold">{order.customerName || "—"}</strong>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 font-medium w-24 flex-shrink-0 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Điện thoại:
                    </span>
                    <span className="text-slate-700 font-mono">{order.customerPhone || "—"}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 font-medium w-24 flex-shrink-0 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Địa chỉ:
                    </span>
                    <span className="text-slate-700">{order.customerAddress || "Chưa cập nhật"}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 font-medium w-24 flex-shrink-0 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> Thanh toán:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                        {order.paymentMethod || "COD"}
                      </span>
                      {order.paymentStatus === "PAID" ? (
                        <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded text-xs font-semibold">
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-xs font-semibold">
                          Chưa thanh toán
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Show Cancel Reason if cancelled */}
              {order.status === "CANCELLED" && order.cancelReason && (
                <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="font-bold">Lý do hủy đơn:</strong> {order.cancelReason}
                  </div>
                </div>
              )}
            </div>

            {/* Status Update Column */}
            <div className="md:col-span-5 no-print">
              <UpdateOrderStatus
                orderId={order.id}
                currentStatus={order.status}
                onStatusUpdated={handleStatusUpdate}
              />
            </div>
          </div>

          {/* Product list */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest">Danh sách sản phẩm</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4 text-center w-[60px]">#</th>
                      <th className="px-6 py-4">Tên sách</th>
                      <th className="px-6 py-4 text-center w-[120px]">Số lượng</th>
                      <th className="px-6 py-4 text-right w-[150px]">Đơn giá</th>
                      <th className="px-6 py-4 text-right w-[150px]">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {details.map((detail, idx) => {
                      const subtotal = new Intl.NumberFormat("vi-VN").format((detail.price ?? 0) * (detail.quantity ?? 0));
                      return (
                        <tr key={idx} className="hover:bg-[#b70011]/5 transition-colors duration-150">
                          <td className="px-6 py-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{detail.bookTitle || "Không có tên"}</span>
                              <span className="text-xs text-slate-400 mt-0.5">Mã sách: {detail.bookId ?? "N/A"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded text-xs font-bold">
                              {detail.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {new Intl.NumberFormat("vi-VN").format(detail.price ?? 0)} <span className="text-xs">đ</span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">
                            {subtotal} <span className="text-xs font-normal text-slate-500">đ</span>
                          </td>
                        </tr>
                      );
                    })}
                    {details.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-400 py-8">
                          Không có sản phẩm nào trong đơn hàng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 divide-y divide-slate-200/60 border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase">Tổng tiền hàng:</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-700">
                        {new Intl.NumberFormat("vi-VN").format(itemsSubtotal)} <span className="text-xs font-normal text-slate-500">đ</span>
                      </td>
                    </tr>
                    {order.discountAmount && order.discountAmount > 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase">Giảm giá voucher:</td>
                        <td className="px-6 py-3 text-right font-bold text-green-600">
                          -{new Intl.NumberFormat("vi-VN").format(order.discountAmount)} <span className="text-xs font-normal text-green-500">đ</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td colSpan={4} className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase">Phí vận chuyển:</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-700">
                        {new Intl.NumberFormat("vi-VN").format(order.shippingFee ?? 0)} <span className="text-xs font-normal text-slate-500">đ</span>
                      </td>
                    </tr>
                    <tr className="bg-slate-100/50">
                      <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-[#b70011] uppercase">Tổng thanh toán:</td>
                      <td className="px-6 py-4 text-right text-lg font-bold text-[#b70011]">
                        {new Intl.NumberFormat("vi-VN").format(itemsSubtotal - (order.discountAmount ?? 0) + (order.shippingFee ?? 0))} <span className="text-xs font-normal text-[#b70011]">đ</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Invoice footer info */}
          <div className="text-center pt-8 border-t border-slate-100 space-y-1">
            <p className="font-bold text-sm text-[#b70011] uppercase tracking-wider">BookStore Online</p>
            <p className="text-xs text-slate-400 font-semibold">Cảm ơn quý khách đã mua hàng!</p>
            <p className="text-[10px] text-slate-400">Hotline: 1900 1000 - Website: www.bookstore.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải đơn hàng...</p>
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}