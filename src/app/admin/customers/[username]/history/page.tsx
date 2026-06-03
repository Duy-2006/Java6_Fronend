'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCustomerHistory, CustomerHistory } from "@/services/customersService";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  TrendingUp,
  Clock,
  DollarSign,
  Eye,
  Hourglass,
  Check,
  Truck,
  CheckSquare,
  Ban,
  AlertCircle,
  Calendar,
  ShoppingCart,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-800 border-amber-200",  icon: Hourglass },
  CONFIRMED: { label: "Đã xác nhận",  cls: "bg-blue-50 text-blue-800 border-blue-200",       icon: Check },
  SHIPPING:  { label: "Đang giao",    cls: "bg-indigo-50 text-indigo-800 border-indigo-200", icon: Truck },
  COMPLETED: { label: "Hoàn thành",   cls: "bg-green-50 text-green-800 border-green-200",    icon: CheckSquare },
  CANCELLED: { label: "Đã hủy",       cls: "bg-red-50 text-red-800 border-red-200",         icon: Ban },
};

export default function CustomerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [customer, setCustomer] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    if (!username) return;
    setLoading(true);
    setError("");
    try {
      const data = await getCustomerHistory(username);
      setCustomer(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      const msg = err.message || "Không thể tải lịch sử mua hàng.";
      setError(msg);
      if (msg.includes("Token hết hạn") || msg.includes("401")) {
        localStorage.removeItem("token");
        router.push("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [username]);

  useEffect(() => {
    if (customer) {
      document.title = `Lịch sử mua hàng - ${customer.fullName || username} - Libris Admin`;
    } else {
      document.title = "Lịch sử mua hàng - Libris Admin";
    }
  }, [customer, username]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải lịch sử mua hàng...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 p-6 font-sans">
        <div className="p-4 rounded-xl border bg-red-50 text-red-800 border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error || "Không tìm thấy thông tin khách hàng"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b70011] text-white rounded-lg font-semibold text-xs transition-colors hover:bg-[#b70011]/90"
          >
            Thử lại
          </button>
          <Link 
            href="/admin/customers" 
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>
    );
  }

  const orders = customer.orders ?? [];
  const totalSpendingFormatted = new Intl.NumberFormat("vi-VN").format(customer.totalSpending ?? 0);
  const initial = customer.fullName?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Link href="/admin/dashboard" className="hover:text-[#b70011] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/admin/customers" className="hover:text-[#b70011] transition-colors">Khách hàng</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#b70011]">Lịch sử mua hàng</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#191c1e]">Chi tiết Khách hàng & Lịch sử</h2>
            <p className="text-sm text-[#5c403c]">Xem thông tin cá nhân, tổng quan chi tiêu và toàn bộ lịch sử đơn hàng của tài khoản.</p>
          </div>
          <Link 
            href="/admin/customers" 
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-[#ffdad6] text-[#b70011] border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold font-sans">
                {initial}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">{customer.fullName || "Khách hàng"}</h3>
                <p className="text-xs font-mono text-slate-500">@{customer.username}</p>
              </div>
              
              <div className="flex items-center gap-1.5">
                {customer.active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-green-50 text-green-700 border-green-200">
                    <ShieldCheck className="w-3 h-3" />
                    Đang hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-red-50 text-red-700 border-red-200">
                    <ShieldAlert className="w-3 h-3" />
                    Bị khóa
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200 uppercase">
                  {customer.customerType || "Member"}
                </span>
              </div>
            </div>

            <div className="border-t border-[#e6bdb8]/20 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-[#b70011] uppercase tracking-wider">Thông tin liên hệ</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700 truncate">{customer.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700 font-mono">{customer.phone || "—"}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e6bdb8]/20 pt-6 bg-gradient-to-br from-[#fbf6f6] to-[#ffdad6]/20 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-[#916f6b] uppercase tracking-wider">Tích lũy chi tiêu</p>
                <TrendingUp className="w-4 h-4 text-[#b70011] animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-[#b70011]">
                {totalSpendingFormatted} <span className="text-xs font-normal text-slate-500">đ</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Dựa trên tất cả đơn hàng đã hoàn thành</p>
            </div>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-[#e6bdb8]/20 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#b70011]" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Lịch sử đơn hàng</h3>
              </div>
              <span className="inline-flex items-center justify-center bg-[#ffdad6] text-[#b70011] font-bold text-xs px-3 py-1 rounded-full border border-[#e6bdb8]/20 shadow-sm">
                {orders.length} đơn hàng
              </span>
            </div>

            <div className="flex-1">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold">Khách hàng này chưa có giao dịch nào.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-[#e6bdb8]/20 text-[10px] font-bold text-[#916f6b] uppercase tracking-wider">
                        <th className="px-6 py-4 text-center" style={{ width: 130 }}>Mã đơn</th>
                        <th className="px-6 py-4">Ngày đặt</th>
                        <th className="px-6 py-4 text-right">Tổng tiền</th>
                        <th className="px-6 py-4 text-center">Trạng thái</th>
                        <th className="px-6 py-4 text-right" style={{ width: 100 }}>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6bdb8]/10 text-sm">
                      {orders.map((o: any) => {
                        const status = STATUS_MAP[o.status] ?? {
                          label: o.status,
                          cls: "bg-slate-50 text-slate-800 border-slate-200",
                          icon: Clock
                        };
                        const StatusIcon = status.icon;
                        const orderCode = o.orderCode ?? `ORD${o.id}`;
                        const orderDate = o.orderDate
                          ? new Date(o.orderDate).toLocaleString("vi-VN", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—";
                        const amount = new Intl.NumberFormat("vi-VN").format(o.totalAmount ?? 0);

                        return (
                          <tr key={o.id} className="hover:bg-[#b70011]/5 transition-colors duration-150 group">
                            <td className="px-6 py-4 text-center">
                              <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                {orderCode}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{orderDate}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-[#b70011]">
                              {amount} <span className="text-xs font-normal text-slate-500">đ</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.cls}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end">
                                <Link
                                  href={`/admin/orders/${o.id}`}
                                  className="p-2 bg-slate-50 hover:bg-[#b70011] hover:text-white text-slate-700 rounded-lg border border-slate-200/60 transition-all flex items-center justify-center cursor-pointer"
                                  title="Chi tiết đơn hàng"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}