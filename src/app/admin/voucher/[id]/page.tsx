"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";
import {
  ArrowLeft, Ticket, Edit, PowerOff, Power, Calendar, Settings2, BarChart2,
  AlertCircle, ShoppingBag, ExternalLink, Hourglass, PackageCheck, Truck, CheckSquare, Ban
} from "lucide-react";

interface Voucher {
  id: number;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
  status: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-50 text-blue-800 border-blue-200" },
  SHIPPING: { label: "Đang giao",   cls: "bg-purple-50 text-purple-800 border-purple-200" },
  DELIVERED: { label: "Giao thành công", cls: "bg-teal-50 text-teal-800 border-teal-200" },
  COMPLETED: { label: "Hoàn thành",   cls: "bg-green-50 text-green-800 border-green-200" },
  CANCELLED: { label: "Đã hủy",       cls: "bg-red-50 text-red-800 border-red-200" },
};

export default function VoucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  // Lịch sử đơn hàng sử dụng voucher
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/vouchers/admin/${params.id}`);
        if (!res.ok) {
          throw new Error("Không thể tải thông tin voucher");
        }
        const data = await res.json();
        setVoucher(data);
      } catch (err: any) {
        setError(err.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/vouchers/admin/${params.id}/orders`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Lỗi tải lịch sử đơn hàng:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchVoucher();
    fetchOrders();
  }, [params.id]);

  const handleToggleStatus = async () => {
    if (!voucher) return;
    setToggling(true);
    try {
      const payload = {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minOrderValue: voucher.minOrderValue,
        maxDiscount: voucher.maxDiscount,
        usageLimit: voucher.usageLimit,
        startDate: voucher.startDate,
        endDate: voucher.endDate,
        active: !voucher.active
      };
      
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/vouchers/admin/${voucher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Không thể thay đổi trạng thái");
      
      const updated = await res.json();
      setVoucher(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setToggling(false);
    }
  };

  const fmt = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b70011]"></div>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Link href="/admin/voucher" className="inline-flex items-center text-sm font-semibold text-[#5c403c] hover:text-[#b70011] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Quay lại danh sách
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 shadow-sm text-sm font-sans flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error || "Không tìm thấy voucher"}
        </div>
      </div>
    );
  }

  const isExpired = new Date(voucher.endDate).getTime() < new Date().getTime();
  const isUsageFull = voucher.usedCount >= voucher.usageLimit;
  
  let computedStatusDisplay = "";
  if (!voucher.active) {
    computedStatusDisplay = "Đã tắt";
  } else if (isExpired) {
    computedStatusDisplay = "Hết hạn";
  } else if (isUsageFull) {
    computedStatusDisplay = "Hết lượt";
  } else if (new Date(voucher.startDate).getTime() > new Date().getTime()) {
    computedStatusDisplay = "Sắp diễn ra";
  } else {
    computedStatusDisplay = "Đang diễn ra";
  }

  return (
    <div className="space-y-6 max-w-4xl w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      <Link href="/admin/voucher" className="inline-flex items-center text-sm font-semibold text-[#5c403c] hover:text-[#b70011] transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Quay lại danh sách
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#e6bdb8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-[#ffdad6]/40 flex items-center justify-center text-[#b70011] flex-shrink-0">
              <Ticket className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#191c1e] uppercase tracking-wide whitespace-nowrap">
                  Voucher {voucher.code}
                </h1>
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                  computedStatusDisplay === "Đang diễn ra" ? "bg-emerald-100 text-emerald-700" :
                  computedStatusDisplay === "Sắp diễn ra" ? "bg-amber-100 text-amber-700" :
                  computedStatusDisplay === "Đã tắt" ? "bg-slate-100 text-slate-700" :
                  "bg-rose-100 text-rose-700"
                }`}>
                  {computedStatusDisplay}
                </span>
              </div>
              <p className="text-[#916f6b] text-sm mt-1">ID Hệ thống: #{voucher.id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/admin/voucher/${voucher.id}/edit`}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#e6bdb8] text-[#5c403c] font-semibold rounded-lg hover:bg-[#ffdad6]/10 hover:text-[#b70011] transition-colors whitespace-nowrap"
            >
              <Edit className="w-4 h-4" />
              Chỉnh sửa
            </Link>
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                voucher.active 
                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {voucher.active ? (
                <><PowerOff className="w-4 h-4 flex-shrink-0" /> Tắt voucher</>
              ) : (
                <><Power className="w-4 h-4 flex-shrink-0" /> Bật voucher</>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Cột Trái */}
            <div className="space-y-6">
              {/* Thông tin chung */}
              <div className="bg-[#f2f4f6]/40 p-5 rounded-lg border border-[#e6bdb8]/20">
                <h3 className="flex items-center gap-2 font-bold text-[#191c1e] mb-4">
                  <Settings2 className="w-5 h-5 text-[#b70011]" />
                  Mức giảm và điều kiện
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b border-[#e6bdb8]/10">
                    <span className="text-[#5c403c]">Mức giảm</span>
                    <span className="font-bold text-base text-[#b70011]">
                      {voucher.discountType === "PERCENT" ? `${voucher.discountValue}%` : fmt(voucher.discountValue)}
                    </span>
                  </div>
                  {voucher.discountType === "PERCENT" && voucher.maxDiscount && (
                    <div className="flex justify-between pb-2 border-b border-[#e6bdb8]/10">
                      <span className="text-[#5c403c]">Giảm tối đa</span>
                      <span className="font-semibold text-[#191c1e]">{fmt(voucher.maxDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#5c403c]">Đơn hàng tối thiểu</span>
                    <span className="font-semibold text-[#191c1e]">{fmt(voucher.minOrderValue)}</span>
                  </div>
                </div>
              </div>

              {/* Giới hạn sử dụng */}
              <div className="bg-[#f2f4f6]/40 p-5 rounded-lg border border-[#e6bdb8]/20">
                <h3 className="flex items-center gap-2 font-bold text-[#191c1e] mb-4">
                  <BarChart2 className="w-5 h-5 text-[#b70011]" />
                  Giới hạn sử dụng
                </h3>
                
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-[#5c403c]">
                    Đã dùng {voucher.usedCount} / {voucher.usageLimit} lượt
                  </span>
                  <span className="text-sm font-bold text-[#b70011]">
                    {Math.round((voucher.usedCount / voucher.usageLimit) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#e0e3e5] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isUsageFull ? 'bg-[#b70011]' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((voucher.usedCount / voucher.usageLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cột Phải */}
            <div className="space-y-6">
              {/* Thời gian áp dụng */}
              <div className="bg-[#f2f4f6]/40 p-5 rounded-lg border border-[#e6bdb8]/20">
                <h3 className="flex items-center gap-2 font-bold text-[#191c1e] mb-4">
                  <Calendar className="w-5 h-5 text-[#b70011]" />
                  Thời gian áp dụng
                </h3>
                
                <div className="relative pl-6 pb-6 border-l-2 border-emerald-400/50">
                  <div className="absolute w-3 h-3 bg-emerald-400 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                  <div className="text-xs font-bold text-[#5c403c] uppercase tracking-wider mb-1">Bắt đầu lúc</div>
                  <div className="font-semibold text-[#191c1e]">{new Date(voucher.startDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                
                <div className="relative pl-6 border-l-2 border-transparent">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 border-2 border-white ${isExpired ? 'bg-rose-400' : 'bg-[#e0e3e5]'}`}></div>
                  <div className="text-xs font-bold text-[#5c403c] uppercase tracking-wider mb-1">Kết thúc lúc</div>
                  <div className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-[#191c1e]'}`}>
                    {new Date(voucher.endDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Lịch sử đơn hàng */}
          <div className="border-t border-[#e6bdb8]/20 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-[#191c1e] text-lg">
                <ShoppingBag className="w-5 h-5 text-[#b70011]" />
                Lịch sử đơn hàng sử dụng mã này
              </h3>
              <span className="text-xs text-[#916f6b] font-medium bg-[#f2f4f6] px-2.5 py-1 rounded-full">
                Tổng cộng: <span className="text-[#191c1e] font-bold">{orders.length}</span> đơn hàng
              </span>
            </div>

            {loadingOrders ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b70011] mb-2"></div>
                <p className="text-slate-400 text-xs">Đang tải lịch sử đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center border border-dashed border-[#e6bdb8]/50 rounded-xl bg-slate-50/50">
                <div className="w-12 h-12 bg-[#ffdad6]/20 rounded-full flex items-center justify-center mb-3">
                  <ShoppingBag className="w-6 h-6 text-[#b70011]/40" />
                </div>
                <h4 className="text-sm font-bold text-[#191c1e] mb-1">Chưa có đơn hàng nào</h4>
                <p className="text-[#5c403c] text-xs max-w-sm">
                  Mã voucher này chưa được sử dụng trong bất kỳ đơn hàng nào.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden border border-[#e6bdb8]/20 rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f2f4f6]/50 border-b border-[#e6bdb8]/20">
                        <th className="px-5 py-3.5 font-bold text-[#916f6b] uppercase tracking-wider">Mã Đơn Hàng</th>
                        <th className="px-5 py-3.5 font-bold text-[#916f6b] uppercase tracking-wider">Khách Hàng</th>
                        <th className="px-5 py-3.5 font-bold text-[#916f6b] uppercase tracking-wider">Ngày Đặt</th>
                        <th className="px-5 py-3.5 font-bold text-[#916f6b] uppercase tracking-wider text-right">Tổng Tiền</th>
                        <th className="px-5 py-3.5 font-bold text-[#916f6b] uppercase tracking-wider text-center">Trạng Thái</th>
                        <th className="px-5 py-3.5 font-bold text-[#916f6b] uppercase tracking-wider text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6bdb8]/10">
                      {orders.map((order) => {
                        const status = STATUS_MAP[order.status] ?? {
                          label: order.status,
                          cls: "bg-slate-50 text-slate-800 border-slate-200",
                        };
                        const orderDate = order.orderDate
                          ? new Date(order.orderDate).toLocaleString("vi-VN", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—";
                        const amount = new Intl.NumberFormat("vi-VN", { style: 'currency', currency: 'VND' }).format((order.totalAmount ?? 0) + (order.shippingFee ?? 0));

                        return (
                          <tr 
                            key={order.id} 
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                            className="hover:bg-[#b70011]/5 transition-colors group cursor-pointer"
                          >
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold group-hover:border-[#b70011]/20">
                                {order.orderCode}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{order.customerName}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-slate-500">{orderDate}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <span className="font-bold text-[#b70011]">{amount}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border ${status.cls}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <span className="text-slate-400 group-hover:text-[#b70011] font-semibold inline-flex items-center gap-1">
                                Chi tiết <ExternalLink className="w-3.5 h-3.5" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
