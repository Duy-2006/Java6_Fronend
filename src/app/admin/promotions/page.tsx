"use client";
import { isLoggedIn } from "@/lib/authFetch";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllPromotions, PromotionDTO } from "@/services/promotionServices";
import DeletePromoButton from "@/app/admin/promotions/_components/DeletePromoButton";
import {
  Plus, Search, Edit, Tag, AlertCircle, CheckCircle2, Clock, Calendar,
  TrendingUp, RefreshCw, ChevronRight, FileSpreadsheet, Globe, BookOpen, Layers, Eye
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [applyFilter, setApplyFilter] = useState("ALL");
  const { toast } = useToast();

  const fetchPromotions = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");


    if (!isLoggedIn()) {
      router.push("/admin/login");
      return;
    }

    try {
      const data = await getAllPromotions();
      setPromotions(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách khuyến mãi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = filteredPromotions.map((p) => ({
        "Mã Chương Trình": p.id,
        "Tên Khuyến Mãi": p.name,
        "Mức Giảm (%)": p.discountValue,
        "Loại áp dụng": p.applyType === "ALL" ? "Toàn sàn" : p.applyType === "BOOK" ? "Theo sách" : "Theo thể loại",
        "Danh sách sách": p.bookTitles?.join(", ") || "",
        "Danh sách thể loại": p.categoryNames?.join(", ") || "",
        "Ngày bắt đầu": p.startDate || "Chưa thiết lập",
        "Ngày kết thúc": p.endDate || "Chưa thiết lập",
        "Trạng thái": p.computedStatus === "ACTIVE" ? "Đang diễn ra" : p.computedStatus === "UPCOMING" ? "Sắp diễn ra" : p.computedStatus === "EXPIRED" ? "Đã kết thúc" : p.computedStatus === "PAUSED" ? "Tạm dừng" : "Chưa đặt ngày"
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách Khuyến mãi");
      XLSX.writeFile(wb, `Danh_sach_Khuyen_mai_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error("Error exporting excel:", err);
      toast({
        title: "Lỗi xuất file",
        description: "Không thể xuất file Excel: " + err.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; bg: string; textCol: string; dot: string }> = {
      ACTIVE: { text: "Đang diễn ra", bg: "bg-emerald-50 border-emerald-200", textCol: "text-emerald-700", dot: "bg-emerald-700" },
      UPCOMING: { text: "Sắp diễn ra", bg: "bg-blue-50 border-blue-200", textCol: "text-blue-700", dot: "bg-blue-700" },
      EXPIRED: { text: "Đã kết thúc", bg: "bg-slate-50 border-slate-200", textCol: "text-slate-600", dot: "bg-slate-600" },
      UNKNOWN: { text: "Chưa đặt ngày", bg: "bg-amber-50 border-amber-200", textCol: "text-amber-700", dot: "bg-amber-700" },
      PAUSED: { text: "Tạm dừng", bg: "bg-orange-50 border-orange-200", textCol: "text-orange-700", dot: "bg-orange-700" },
    };
    const s = statusConfig[status] || { text: status, bg: "bg-gray-50 border-gray-200", textCol: "text-gray-700", dot: "bg-gray-700" };

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.textCol}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
        {s.text}
      </div>
    );
  };

  const getApplyBadge = (type: "ALL" | "BOOK" | "CATEGORY") => {
    const config = {
      ALL: { text: "Toàn sàn", bg: "bg-rose-50 border-rose-100 text-[#b70011]", icon: Globe },
      BOOK: { text: "Theo sách", bg: "bg-indigo-50 border-indigo-100 text-indigo-700", icon: BookOpen },
      CATEGORY: { text: "Thể loại", bg: "bg-purple-50 border-purple-100 text-purple-700", icon: Layers }
    };
    const current = config[type] || { text: type, bg: "bg-slate-50 border-slate-100 text-slate-700", icon: Tag };
    const Icon = current.icon;
    return (
      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${current.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {current.text}
      </div>
    );
  };

  const getApplyIcon = (type: "ALL" | "BOOK" | "CATEGORY") => {
    if (type === "ALL") {
      return (
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-[#b70011] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#b70011]/20">
          <Globe className="w-6 h-6" />
        </div>
      );
    }
    if (type === "BOOK") {
      return (
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-600/20">
          <BookOpen className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-fuchsia-600/20">
        <Layers className="w-6 h-6" />
      </div>
    );
  };

  const filteredPromotions = promotions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.computedStatus === statusFilter;
    const matchesApply = applyFilter === "ALL" || p.applyType === applyFilter;
    return matchesSearch && matchesStatus && matchesApply;
  }).sort((a, b) => {
    const statusPriority: any = { ACTIVE: 1, UPCOMING: 2, PAUSED: 3, EXPIRED: 4, UNKNOWN: 5 };
    const pA = statusPriority[a.computedStatus || "UNKNOWN"] || 6;
    const pB = statusPriority[b.computedStatus || "UNKNOWN"] || 6;
    if (pA !== pB) return pA - pB;
    const timeA = new Date(a.startDate || 0).getTime();
    const timeB = new Date(b.startDate || 0).getTime();
    return timeB - timeA;
  });

  // Calculate stats dynamically
  const totalCampaigns = promotions.length;
  const avgDiscount = totalCampaigns > 0
    ? Math.round(promotions.reduce((acc, p) => acc + p.discountValue, 0) / totalCampaigns)
    : 0;
  const currentLive = promotions.filter(p => p.computedStatus === "ACTIVE").length;
  const endingSoon = promotions.filter(p => {
    if (p.computedStatus !== "ACTIVE" || !p.endDate) return false;
    const end = new Date(p.endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // less than 3 days
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải danh sách khuyến mãi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Danh sách Khuyến mãi</h2>

        </div>
        <div className="flex items-center gap-3">

          <Link
            href="/admin/promotions/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#b70011] text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-[#b70011]/90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo khuyến mãi mới
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 shadow-sm text-sm font-sans">
          {error}
        </div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Campaigns */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-[#ffdad6] rounded-lg text-[#b70011]">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Tổng Chiến Dịch</p>
            <h3 className="text-2xl font-bold text-[#191c1e]">{totalCampaigns.toLocaleString()}</h3>
          </div>
        </div>

        {/* Avg Discount */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Mức Giảm Trung Bình</p>
            <h3 className="text-2xl font-bold text-blue-700">{avgDiscount}%</h3>
          </div>
        </div>

        {/* Current Live */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Đang hoạt động</p>
            <h3 className="text-2xl font-bold text-emerald-700">{currentLive.toLocaleString()}</h3>
          </div>
        </div>

        {/* Ending Soon */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-rose-100 rounded-lg text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Sắp kết thúc</p>
            <h3 className="text-2xl font-bold text-rose-700">{endingSoon.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e6bdb8]/30 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2 bg-[#f2f4f6] px-3 py-1.5 rounded-lg border border-[#e6bdb8]/50">
            <label htmlFor="status-filter" className="text-xs font-semibold text-[#5c403c]">Trạng thái:</label>
            <select
              id="status-filter"
              title="Lọc theo trạng thái"
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold p-0 pr-6 focus:ring-0 text-[#191c1e] cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang diễn ra</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="PAUSED">Tạm dừng</option>
              <option value="EXPIRED">Đã kết thúc</option>
              <option value="UNKNOWN">Chưa đặt ngày</option>
            </select>
          </div>

          {/* Apply Type Dropdown */}
          <div className="flex items-center gap-2 bg-[#f2f4f6] px-3 py-1.5 rounded-lg border border-[#e6bdb8]/50">
            <label htmlFor="apply-filter" className="text-xs font-semibold text-[#5c403c]">Phân loại:</label>
            <select
              id="apply-filter"
              title="Lọc theo phân loại"
              aria-label="Lọc theo phân loại"
              value={applyFilter}
              onChange={(e) => setApplyFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold p-0 pr-6 focus:ring-0 text-[#191c1e] cursor-pointer"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="ALL_STORE">Tất cả sách</option>
              <option value="BOOK">Theo sách</option>
              <option value="CATEGORY">Theo thể loại</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#916f6b] pointer-events-none" />
            <input
              type="search"
              style={{ paddingLeft: "2.5rem" }}
              className="block w-full pr-3 py-2 border border-[#e6bdb8]/50 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b70011]/20 focus:border-[#b70011] transition-all bg-[#f2f4f6]/50 hover:bg-white text-[#191c1e]"
              placeholder="Tìm kiếm theo tên chương trình..."
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
            Hiển thị <span className="text-[#191c1e] font-bold">{filteredPromotions.length}</span> chương trình
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f6]/50 border-b border-[#e6bdb8]/20">
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Tên chương trình</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Mức giảm giá</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Loại áp dụng</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Lượt dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Thời gian áp dụng</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6bdb8]/10">
              {filteredPromotions.map((p) => {
                const isAll = p.applyType === "ALL";
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-[#b70011]/5 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/admin/promotions/${p.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getApplyIcon(p.applyType)}
                        <div>
                          <div className="font-bold text-[#191c1e] tracking-wide">{p.name}</div>
                          <div className="text-[11px] text-[#916f6b] font-mono">ID: {p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-sm text-[#b70011]">{p.discountValue}% OFF</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getApplyBadge(p.applyType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-[#5c403c] font-semibold">
                        {p.usageLimit ? (
                          <span className={`${p.usedCount! >= p.usageLimit ? 'text-red-600' : ''}`}>
                            {p.usedCount || 0} / {p.usageLimit}
                          </span>
                        ) : (
                          <span>Vô hạn</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-[#5c403c]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {p.startDate && p.endDate ? (
                            `${new Date(p.startDate).toLocaleDateString('vi-VN')} - ${new Date(p.endDate).toLocaleDateString('vi-VN')}`
                          ) : (
                            "Permanent"
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(p.computedStatus || "UNKNOWN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/promotions/${p.id}/edit`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeletePromoButton
                          promoId={p.id!}
                          onDeleted={() => fetchPromotions(true)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPromotions.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center border-t border-[#e6bdb8]/20">
            <div className="w-20 h-20 bg-[#ffdad6]/20 rounded-full flex items-center justify-center mb-4">
              <Tag className="w-10 h-10 text-[#b70011]/40" />
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mb-1">Chưa có khuyến mãi nào</h3>
            <p className="text-[#5c403c] text-xs max-w-sm mb-6">
              {searchTerm
                ? `Không tìm thấy chương trình nào phù hợp với từ khóa "${searchTerm}"`
                : "Bạn chưa tạo bất kỳ chương trình khuyến mãi nào. Hãy tạo chương trình đầu tiên!"}
            </p>
            {!searchTerm && (
              <Link
                href="/admin/promotions/new"
                className="flex items-center gap-2 bg-white border border-[#e6bdb8] text-[#191c1e] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tạo khuyến mãi mới
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}