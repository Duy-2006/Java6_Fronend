// app/admin/voucher/page.tsx
"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";;

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Ticket, Plus, Search, Edit, Trash2, 
  Tag, AlertCircle, CheckCircle2, XCircle, Clock,
  TrendingUp, Download, RefreshCw, ChevronRight, FileSpreadsheet, Eye
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

const formatDateRange = (startStr: string, endStr: string) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const startDay = pad(start.getDate());
  const startMonth = pad(start.getMonth() + 1);
  const startYear = start.getFullYear();

  const endDay = pad(end.getDate());
  const endMonth = pad(end.getMonth() + 1);
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${endYear}`;
  }
  return `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`;
};

export default function VoucherListPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchVouchers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

        if (!isLoggedIn()) {
      router.push("/admin/login");
      return;
    }
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
      const res = await authFetch(`${API_URL}/api/vouchers/admin`, {
        headers: { },
      });
      if (!res.ok) throw new Error("Không thể tải danh sách voucher");
      const data = await res.json();
      setVouchers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa voucher "${code}"?`)) return;
        try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
      const res = await authFetch(`${API_URL}/api/vouchers/admin/${id}`, {
        method: "DELETE",
        headers: { },
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      fetchVouchers(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = filteredVouchers.map((v) => ({
        "Mã Voucher": v.code,
        "Loại giảm giá": v.discountType === "PERCENT" ? "Phần trăm (%)" : "Số tiền cố định",
        "Giá trị giảm": v.discountValue,
        "Đơn tối thiểu (VND)": v.minOrderValue,
        "Giảm tối đa (VND)": v.maxDiscount || "Không giới hạn",
        "Tổng lượt dùng": v.usageLimit,
        "Đã dùng": v.usedCount,
        "Ngày bắt đầu": new Date(v.startDate).toLocaleDateString("vi-VN"),
        "Ngày kết thúc": new Date(v.endDate).toLocaleDateString("vi-VN"),
        "Trạng thái": v.status === "ACTIVE" ? "Hoạt động" : v.status === "EXPIRED" ? "Hết hạn" : v.status === "UPCOMING" ? "Sắp diễn ra" : v.status === "EXHAUSTED" ? "Hết lượt" : "Tạm dừng"
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách Voucher");
      XLSX.writeFile(wb, `Danh_sach_Voucher_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error("Error exporting excel:", err);
      alert("Không thể xuất file Excel: " + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; bg: string; textCol: string; dot: string; icon: any }> = {
      ACTIVE: { text: "Hoạt động", bg: "bg-emerald-50 border-emerald-200", textCol: "text-emerald-700", dot: "bg-emerald-700", icon: CheckCircle2 },
      EXPIRED: { text: "Hết hạn", bg: "bg-slate-50 border-slate-200", textCol: "text-slate-600", dot: "bg-slate-600", icon: AlertCircle },
      UPCOMING: { text: "Sắp diễn ra", bg: "bg-blue-50 border-blue-200", textCol: "text-blue-700", dot: "bg-blue-700", icon: Clock },
      EXHAUSTED: { text: "Hết lượt", bg: "bg-amber-50 border-amber-200", textCol: "text-amber-700", dot: "bg-amber-700", icon: XCircle },
      INACTIVE: { text: "Tạm dừng", bg: "bg-rose-50 border-rose-200", textCol: "text-rose-700", dot: "bg-rose-700", icon: XCircle },
    };
    const s = statusConfig[status] || { text: status, bg: "bg-gray-50 border-gray-200", textCol: "text-gray-700", dot: "bg-gray-700", icon: AlertCircle };
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.textCol}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
        {s.text}
      </div>
    );
  };

  const getStatusPriority = (status: string) => {
    switch (status) {
      case "ACTIVE": return 1;
      case "UPCOMING": return 2;
      case "EXPIRED": return 3;
      case "EXHAUSTED": return 4;
      case "INACTIVE": return 5;
      default: return 6;
    }
  };

  const filteredVouchers = vouchers
    .filter(v => {
      const matchesSearch = v.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const pA = getStatusPriority(a.status);
      const pB = getStatusPriority(b.status);
      if (pA !== pB) return pA - pB;
      
      // Nếu cùng trạng thái, ưu tiên thời gian gần nhất lên trước (mới nhất lên trên)
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

  // Calculate stats dynamically
  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter(v => v.status === "ACTIVE").length;
  const totalUsed = vouchers.reduce((acc, v) => acc + v.usedCount, 0);
  const expiringSoon = vouchers.filter(v => {
    if (v.status !== "ACTIVE") return false;
    const end = new Date(v.endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // less than 3 days
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải danh sách voucher...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Header section with breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1 text-[#5c403c] text-xs mb-1.5">
            <span className="font-semibold cursor-pointer hover:underline">Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold cursor-pointer hover:underline">Khuyến mãi</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#b70011]">Voucher</span>
          </nav>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Quản lý Voucher</h2>
          <p className="text-sm text-[#5c403c] font-sans">Tạo và quản lý các mã giảm giá cho khách hàng mua hàng trên hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">

          <Link
            href="/admin/voucher/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#b70011] text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-[#b70011]/90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm voucher mới
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 shadow-sm text-sm font-sans">
          {error}
        </div>
      )}

      {/* Summary Stats (Bento Grid Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Vouchers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-[#ffdad6] rounded-lg text-[#b70011]">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Tổng Voucher</p>
            <h3 className="text-2xl font-bold text-[#191c1e]">{totalVouchers.toLocaleString()}</h3>
          </div>
        </div>

        {/* Active Vouchers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Đang hoạt động</p>
            <h3 className="text-2xl font-bold text-emerald-700">{activeVouchers.toLocaleString()}</h3>
          </div>
        </div>

        {/* Total Redeemed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-100 rounded-lg text-amber-700">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Đã sử dụng</p>
            <h3 className="text-2xl font-bold text-amber-700">{totalUsed.toLocaleString()}</h3>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-rose-100 rounded-lg text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Sắp hết hạn</p>
            <h3 className="text-2xl font-bold text-rose-700">{expiringSoon.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e6bdb8]/30 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2 bg-[#f2f4f6] px-3 py-1.5 rounded-lg border border-[#e6bdb8]/50">
            <label htmlFor="statusFilter" className="text-xs font-semibold text-[#5c403c]">Trạng thái:</label>
            <select 
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold p-0 pr-6 focus:ring-0 text-[#191c1e] cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="EXPIRED">Đã hết hạn</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="EXHAUSTED">Hết lượt</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#916f6b] pointer-events-none" />
            <input
              type="search"
              style={{ paddingLeft: "2.5rem" }}
              className="block w-full pr-3 py-2 border border-[#e6bdb8]/50 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b70011]/20 focus:border-[#b70011] transition-all bg-[#f2f4f6]/50 hover:bg-white text-[#191c1e]"
              placeholder="Tìm kiếm mã voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#e6bdb8] rounded-lg font-semibold text-xs text-[#5c403c] hover:bg-[#f2f4f6] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Xuất Excel
          </button>
          <div className="text-xs text-[#916f6b] font-medium hidden sm:block">
            Hiển thị <span className="text-[#191c1e] font-bold">{filteredVouchers.length}</span> voucher
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f6]/50 border-b border-[#e6bdb8]/20">
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Mã Voucher</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Mức Giảm</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Điều Kiện</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider text-center">Lượt Dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Thời Gian</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6bdb8]/10">
              {filteredVouchers.map((v) => (
                <tr 
                  key={v.id} 
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.action-btn')) return;
                    router.push(`/admin/voucher/${v.id}`);
                  }}
                  className="hover:bg-[#b70011]/5 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#ffdad6]/40 flex items-center justify-center text-[#b70011] font-bold">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#191c1e] uppercase tracking-wide">{v.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#b70011]">
                      {v.discountType === "PERCENT" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}đ`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#191c1e]">
                      Đơn từ <span className="font-semibold">{v.minOrderValue.toLocaleString()}đ</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#f2f4f6] text-xs font-bold text-[#5c403c]">
                      <span className={v.usedCount >= v.usageLimit ? "text-[#b70011] font-bold" : ""}>
                        {v.usedCount}
                      </span>
                      <span className="mx-1 text-slate-400">/</span>
                      <span>{v.usageLimit}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-20 h-1.5 bg-[#f2f4f6] rounded-full mt-2 mx-auto overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${v.usedCount >= v.usageLimit ? 'bg-[#b70011]' : 'bg-[#dc2626]'}`}
                        ref={node => {
                          if (node) {
                            node.style.width = `${Math.min((v.usedCount / v.usageLimit) * 100, 100)}%`;
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#f2f4f6] text-[#5c403c] text-[11px] font-bold font-mono">
                      {formatDateRange(v.startDate, v.endDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(v.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/voucher/${v.id}/edit`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors action-btn"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(v.id, v.code)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors action-btn"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVouchers.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center border-t border-[#e6bdb8]/20">
            <div className="w-20 h-20 bg-[#ffdad6]/20 rounded-full flex items-center justify-center mb-4">
              <Ticket className="w-10 h-10 text-[#b70011]/40" />
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mb-1">Chưa có voucher nào</h3>
            <p className="text-[#5c403c] text-xs max-w-sm mb-6">
              {searchTerm 
                ? `Không tìm thấy voucher nào phù hợp với từ khóa "${searchTerm}"`
                : "Bạn chưa tạo bất kỳ mã giảm giá nào. Hãy tạo mã đầu tiên để thu hút khách hàng!"}
            </p>
            {!searchTerm && (
              <Link
                href="/admin/voucher/new"
                className="flex items-center gap-2 bg-white border border-[#e6bdb8] text-[#191c1e] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tạo voucher mới
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}