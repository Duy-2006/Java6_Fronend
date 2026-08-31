// app/admin/customers/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ToggleStatusButton from "@/app/admin/customers/_components/ToggleStatusButton";
import { getAllCustomers, CustomerSummary } from "@/services/customersService";
import {
  Grid,
  List,
  Search,
  Download,
  RefreshCw,
  Users,
  UserCheck,
  Crown,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Clock,
  User,
  Loader2,
  TrendingUp
} from "lucide-react";

function getCustomerClassification(totalSpending: number) {
  if (totalSpending >= 2000000) {
    return {
      rank: "VIP Diamond",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: "",
      isVip: true
    };
  }
  if (totalSpending >= 1000000) {
    return {
      rank: "VIP Gold",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "",
      isVip: true
    };
  }
  if (totalSpending >= 500000) {
    return {
      rank: "Silver Member",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "",
      isVip: false
    };
  }
  if (totalSpending > 0) {
    return {
      rank: "Bronze Member",
      color: "bg-slate-50 text-slate-700 border-slate-200",
      icon: "",
      isVip: false
    };
  }
  return {
    rank: "New Member",
    color: "bg-gray-50 text-gray-500 border-gray-200",
    icon: "",
    isVip: false
  };
}

function CustomerTypeBadge({ totalSpending }: { totalSpending: number }) {
  const classification = getCustomerClassification(totalSpending);
  return (
    <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-[11px] font-bold ${classification.color}`}>
      <span className="text-xs">{classification.icon}</span>
      <span>{classification.rank}</span>
    </span>
  );
}

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Hiển thị thông báo từ URL (nếu có)
  useEffect(() => {
    if (success) {
      setToast({ msg: success, type: 'success' });
      // Xóa param khỏi URL
      window.history.replaceState(null, '', '/admin/customers');
    }
  }, [success, router]);

  // Tự động ẩn toast sau 3 giây
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadCustomers = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAllCustomers();
      // Đảo ngược danh sách để khách hàng mới đăng ký (nằm cuối) sẽ hiện lên đầu
      setCustomers(data.reverse());
      setFetchError("");
    } catch (err: any) {
      setFetchError(err.message || "Không thể tải danh sách khách hàng.");
      setToast({ msg: err.message || "Không thể tải danh sách khách hàng.", type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const refreshCustomers = () => {
    loadCustomers(true);
  };

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filtered = searchQuery
    ? customers.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
    )
    : customers;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Statistics calculation
  const totalCount = customers.length;
  const activeCount = customers.filter(u => u.active).length;
  const vipCount = customers.filter(u => u.totalSpending >= 1000000).length;

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');

      const dataToExport = customers.map(item => {
        const classification = getCustomerClassification(item.totalSpending);
        return {
          'Username': item.username,
          'Họ và Tên': item.fullName || '(Chưa cập nhật)',
          'Email': item.email || '(Chưa cập nhật)',
          'Số điện thoại': item.phone || '(Chưa cập nhật)',
          'Hạng thành viên': classification.rank,
          'Tổng chi tiêu': item.totalSpending ?? 0,
          'Trạng thái': item.active ? 'Hoạt động' : 'Bị khóa'
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Khách hàng');

      XLSX.writeFile(wb, `Danh_sach_khach_hang_Libris_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Error exporting customers:', err);
      setToast({ msg: 'Không thể xuất file báo cáo: ' + err.message, type: 'error' });
    }
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarBgColor = (username: string) => {
    const hash = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "bg-red-50 text-[#b70011] border-red-100",
      "bg-blue-50 text-blue-700 border-blue-100",
      "bg-emerald-50 text-emerald-700 border-emerald-100",
      "bg-amber-50 text-amber-700 border-amber-100",
      "bg-purple-50 text-purple-700 border-purple-100",
      "bg-indigo-50 text-indigo-700 border-indigo-100",
    ];
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải danh sách khách hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown transition-all ${toast.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
          }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <p className="text-sm font-semibold">{toast.msg}</p>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer"
            onClick={() => setToast(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Error alert if any */}
      {fetchError && (
        <div className="p-4 rounded-xl border bg-red-50 text-red-800 border-red-200 shadow-sm">
          <p className="text-sm font-semibold">{fetchError}</p>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Quản lý Khách hàng</h2>

        </div>
      </section>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#b70011] group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Tổng khách hàng</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{totalCount}</h3>
            <p className="font-semibold text-xs text-[#b70011] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              Tổng số tài khoản đăng ký
            </p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Khách hàng Hoạt động</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{activeCount}</h3>
            <p className="font-semibold text-xs text-emerald-600 mt-1">
              Tài khoản đang hoạt động bình thường
            </p>
          </div>
        </div>

        {/* VIP Members */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300 sm:col-span-2 lg:col-span-1">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Thành viên VIP</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{vipCount}</h3>
            <p className="font-semibold text-xs text-amber-600 mt-1">
              Thành viên VIP Gold & VIP Diamond
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e6bdb8]/20 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div style={{ position: "relative" }} className="w-full sm:w-64">
            <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} className="w-4 h-4 text-slate-400" />
            <input
              type="search"
              style={{ paddingLeft: "2.5rem" }}
              placeholder="Tìm kiếm khách hàng..."
              className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất File</span>
          </button>




          {/* View Toggles */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50">
            <button
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setViewMode('table')}
              title="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedCustomers.map((item) => (
            <div
              key={item.username}
              className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between p-5 space-y-4 cursor-pointer hover:border-[#b70011]/30"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.action-button')) return;
                router.push(`/admin/customers/${item.username}/history`);
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm overflow-hidden ${getAvatarBgColor(item.username)}`}>
                  {item.avatar ? (
                    <img
                      src={item.avatar.startsWith("http") ? item.avatar : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${item.avatar}`}
                      alt={item.fullName}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.classList.add("hidden");
                        const parent = target.parentElement;
                        if (parent) {
                          const initialsSpan = parent.querySelector(".avatar-initials") as HTMLElement;
                          if (initialsSpan) {
                            initialsSpan.classList.remove("hidden");
                            initialsSpan.classList.add("block");
                          }
                        }
                      }}
                    />
                  ) : null}
                  <span className={`avatar-initials ${item.avatar ? "hidden" : "block"}`}>
                    {getAvatarInitials(item.fullName)}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-[#b70011] transition-colors" title={item.fullName}>{item.fullName}</h3>
                  <p className="text-[11px] font-mono text-[#916f6b]">@{item.username}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-500">
                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <span className="text-slate-400 font-medium">Tổng chi tiêu:</span>
                  <span className="font-bold text-[#b70011]">{new Intl.NumberFormat("vi-VN").format(item.totalSpending)} đ</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.active
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  {item.active ? "Hoạt động" : "Đã khóa"}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 action-button">
                <Link
                  href={`/admin/customers/${item.username}/history`}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#b70011] transition-colors border border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold"
                  title="Xem lịch sử mua hàng"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lịch sử</span>
                </Link>
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleStatusButton
                    username={item.username}
                    isActive={item.active}
                    onToggleSuccess={refreshCustomers}
                    onShowToast={(msg, type) => setToast({ msg, type })}
                  />
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-12 text-sm bg-white border border-[#e6bdb8]/30 rounded-xl">
              Không tìm thấy khách hàng nào phù hợp.
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e6bdb8]/20 text-xs font-bold text-[#916f6b] uppercase tracking-wider">
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Tổng chi tiêu</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Trạng thái</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10 text-sm">
                {paginatedCustomers.map((item) => (
                  <tr
                    key={item.username}
                    className="hover:bg-[#b70011]/5 transition-colors duration-150 group cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.action-button')) return;
                      router.push(`/admin/customers/${item.username}/history`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm overflow-hidden ${getAvatarBgColor(item.username)}`}>
                          {item.avatar ? (
                            <img
                              src={item.avatar.startsWith("http") ? item.avatar : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${item.avatar}`}
                              alt={item.fullName}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.classList.add("hidden");
                                const parent = target.parentElement;
                                if (parent) {
                                  const initialsSpan = parent.querySelector(".avatar-initials") as HTMLElement;
                                  if (initialsSpan) {
                                    initialsSpan.classList.remove("hidden");
                                    initialsSpan.classList.add("block");
                                  }
                                }
                              }}
                            />
                          ) : null}
                          <span className={`avatar-initials ${item.avatar ? "hidden" : "block"}`}>
                            {getAvatarInitials(item.fullName)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-[#b70011] transition-colors">{item.fullName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      @{item.username}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#b70011]" style={{ textAlign: "center" }}>
                      {new Intl.NumberFormat("vi-VN").format(item.totalSpending)} đ
                    </td>
                    <td className="px-6 py-4" style={{ textAlign: "center" }}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.active
                          ? 'bg-green-50 text-green-800 border-green-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-green-600 animate-pulse' : 'bg-red-500'}`} />
                        {item.active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ textAlign: "center" }}>
                      <div className="flex justify-center items-center gap-2 action-button">
                        <Link
                          href={`/admin/customers/${item.username}/history`}
                          className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#b70011] transition-colors border border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold"
                          title="Xem lịch sử mua hàng"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Lịch sử</span>
                        </Link>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ToggleStatusButton
                            username={item.username}
                            isActive={item.active}
                            onToggleSuccess={refreshCustomers}
                            onShowToast={(msg, type) => setToast({ msg, type })}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">
                      Không tìm thấy khách hàng nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border border-[#e6bdb8]/30 rounded-xl bg-white shadow-sm gap-4 mt-6">
          <p className="text-xs font-semibold text-[#916f6b]">
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)} của {filtered.length} khách hàng
          </p>
          <div className="flex items-center gap-1.5">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {(() => {
              let startPage = Math.max(1, currentPage - 2);
              let endPage = Math.min(totalPages, currentPage + 2);
              if (currentPage <= 3) endPage = Math.min(totalPages, 5);
              if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);
              return Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i).map(page => (
                <button
                  key={page}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition-all ${currentPage === page
                      ? 'bg-[#b70011] text-white shadow-md shadow-[#b70011]/15'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ));
            })()}

            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky Footer */}
      <footer className="py-6 text-center border-t border-slate-100">
        <p className="text-[10px] text-[#916f6b] font-bold uppercase tracking-widest">
          © 2026 Libris Management System. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải trang...</p>
      </div>
    }>
      <CustomersContent />
    </Suspense>
  );
}