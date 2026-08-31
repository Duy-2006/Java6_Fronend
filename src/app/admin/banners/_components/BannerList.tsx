"use client";

import { authFetch } from "@/lib/authFetch";
import { useState, useEffect } from "react";
import ConfirmModal from "@/app/admin/_components/ConfirmModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Trash2,
  Edit,
  Download,
  Plus,
  Grid,
  List,
  Search,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Layout,
  TrendingUp,
} from "lucide-react";

interface Banner {
  id?: number;
  title?: string;
  image_url: string;
  link: string;
  position: number;
  active: boolean;
  start_date?: string;
  end_date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function BannerList() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  const fetchBanners = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const res = await authFetch(`${API_URL}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      } else {
        setToast({ msg: "Không thể lấy danh sách banner từ máy chủ.", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi kết nối API lấy danh sách banner:", error);
      setToast({ msg: "Lỗi kết nối đến máy chủ API.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      try {
        const res = await authFetch(`${API_URL}/api/banners/${deletingId}`, { method: "DELETE" });
        if (res.ok) {
          setToast({ msg: "Xóa banner thành công!", type: "success" });
          fetchBanners(true);
        } else {
          setToast({ msg: "Không thể xóa banner này.", type: "error" });
        }
      } catch (error) {
        console.error("Lỗi xóa banner:", error);
        setToast({ msg: "Lỗi kết nối máy chủ khi xóa banner.", type: "error" });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const dataToExport = banners.map(b => ({
        'ID': b.id || 'N/A',
        'Tên banner': b.title || 'Không có',
        'Đường dẫn hình ảnh': b.image_url,
        'Link liên kết': b.link || 'Trống',
        'Vị trí': b.position,
        'Thời gian bắt đầu': b.start_date ? formatDateString(b.start_date) : 'Không giới hạn',
        'Thời gian kết thúc': b.end_date ? formatDateString(b.end_date) : 'Không giới hạn',
        'Trạng thái': getBannerStatus(b).text
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Banners');
      XLSX.writeFile(wb, `Danh_sach_banner_Libris_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Lỗi khi xuất Excel:', err);
      setToast({ msg: 'Không thể xuất file Excel báo cáo: ' + err.message, type: 'error' });
    }
  };


  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_URL}${url}`;
  };

  const getBannerName = (b: Banner) => {
    if (b.title) return b.title;
    if (!b.image_url) return `Banner #${b.id || ""}`;
    const parts = b.image_url.split('/');
    const filename = parts[parts.length - 1];
    const cleanName = decodeURIComponent(filename).replace(/^[0-9a-fA-F-]{36}_/, '');
    return cleanName || `Banner #${b.id || ""}`;
  };

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "...";
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const getBannerStatus = (b: Banner) => {
    if (!b.active) {
      return {
        type: "INACTIVE",
        text: "Tạm ẩn",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        dotClass: "bg-slate-400"
      };
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const startStr = b.start_date ? b.start_date.substring(0, 10) : null;
    const endStr = b.end_date ? b.end_date.substring(0, 10) : null;

    if (endStr && endStr < todayStr) {
      return {
        type: "EXPIRED",
        text: "Đã hết hạn",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500"
      };
    }

    if (startStr && startStr > todayStr) {
      return {
        type: "UPCOMING",
        text: "Sắp diễn ra",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        dotClass: "bg-blue-500"
      };
    }

    return {
      type: "ACTIVE",
      text: "Hoạt động",
      badgeClass: "bg-green-50 text-green-800 border-green-200",
      dotClass: "bg-green-600 animate-pulse"
    };
  };

  const getStatusPriority = (type: string) => {
    switch (type) {
      case "ACTIVE": return 1;
      case "UPCOMING": return 2;
      case "EXPIRED": return 3;
      case "INACTIVE": return 4;
      default: return 5;
    }
  };

  const filteredBanners = banners
    .filter(b =>
      b.link?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.image_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getBannerName(b).toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const statusA = getBannerStatus(a).type;
      const statusB = getBannerStatus(b).type;
      // 1. Phân loại theo thứ tự ưu tiên trạng thái
      const pA = getStatusPriority(statusA);
      const pB = getStatusPriority(statusB);
      if (pA !== pB) {
        return pA - pB;
      }
      // 2. Sắp xếp theo vị trí hiển thị position tăng dần
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      // 3. Banner mới hơn lên trước
      return (b.id || 0) - (a.id || 0);
    });

  const totalCount = banners.length;
  const activeCount = banners.filter(b => getBannerStatus(b).type === "ACTIVE").length;
  const inactiveCount = totalCount - activeCount;

  const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBanners = filteredBanners.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải danh sách banner...</p>
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

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Quản lý Banner</h2>

        </div>
        <Link
          href="/admin/banners/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#b70011] text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-[#b70011]/90 transition-all cursor-pointer border-0 text-decoration-none"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Banner Mới</span>
        </Link>
      </section>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Banners */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#b70011] group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
            <Layout className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Tổng banner</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{totalCount}</h3>
            <p className="font-semibold text-xs text-[#b70011] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              Tổng số banner trong hệ thống
            </p>
          </div>
        </div>

        {/* Active Banners */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <Eye className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Banner Hoạt động</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{activeCount}</h3>
            <p className="font-semibold text-xs text-emerald-600 mt-1">
              Banner đang hiển thị trên trang chủ
            </p>
          </div>
        </div>

        {/* Inactive Banners */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300 sm:col-span-2 lg:col-span-1">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
            <EyeOff className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Hết hạn / Tạm ẩn</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{inactiveCount}</h3>
            <p className="font-semibold text-xs text-amber-600 mt-1">
              Banner đã hết hạn hoặc đang tắt
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
              placeholder="Tìm kiếm banner..."
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
          {paginatedBanners.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between p-5 space-y-4 cursor-pointer hover:border-[#b70011]/30"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.action-button')) return;
                router.push(`/admin/banners/${item.id}`);
              }}
            >
              <div className="relative aspect-[16/8] rounded-lg overflow-hidden border border-slate-200/60 bg-slate-100">
                {item.image_url ? (
                  <img
                    src={getImageUrl(item.image_url)}
                    alt={item.title || "Banner"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    Thứ tự: {item.position}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-[#b70011] transition-colors" title={getBannerName(item)}>
                  {getBannerName(item)}
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-500">
                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <span className="text-slate-400 font-medium">Thời gian:</span>
                  <span className="font-bold text-slate-700">{formatDateString(item.start_date)} - {formatDateString(item.end_date)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {(() => {
                  const st = getBannerStatus(item);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border ${st.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dotClass}`} />
                      <span className="whitespace-nowrap">{st.text}</span>
                    </span>
                  );
                })()}
              </div>

              <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-100 action-button" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/admin/banners/${item.id}/edit`}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60 flex items-center justify-center text-decoration-none"
                  title="Chỉnh sửa banner"
                >
                  <Edit className="w-4.5 h-4.5" />
                </Link>
                <button
                  onClick={() => item.id && setDeletingId(item.id)}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-red-200/50 flex items-center justify-center cursor-pointer bg-white"
                  title="Xóa banner"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredBanners.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-12 text-sm bg-white border border-[#e6bdb8]/30 rounded-xl">
              Không tìm thấy banner nào phù hợp.
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
                  <th className="px-6 py-4">Hình ảnh</th>
                  <th className="px-6 py-4">Tên banner</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Vị trí</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Thời gian áp dụng</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Trạng thái</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10 text-sm">
                {paginatedBanners.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#b70011]/5 transition-colors duration-150 group cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.action-button')) return;
                      router.push(`/admin/banners/${item.id}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="w-24 h-11 rounded-lg border border-[#e6bdb8]/30 overflow-hidden shadow-sm bg-slate-50 group-hover:scale-105 transition-transform duration-200">
                        {item.image_url ? (
                          <img
                            src={getImageUrl(item.image_url)}
                            alt={item.title || "Banner"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-[#b70011] transition-colors">{getBannerName(item)}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 text-xs whitespace-nowrap" style={{ textAlign: "center" }}>
                      {item.position}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600" style={{ textAlign: "center" }}>
                      <div className="whitespace-nowrap">{formatDateString(item.start_date)} - {formatDateString(item.end_date)}</div>
                    </td>
                    <td className="px-6 py-4" style={{ textAlign: "center" }}>
                      {(() => {
                        const st = getBannerStatus(item);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${st.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dotClass}`} />
                            <span className="whitespace-nowrap">{st.text}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4" style={{ textAlign: "center" }}>
                      <div className="flex justify-center items-center gap-1.5 action-button" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/banners/${item.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60 flex items-center justify-center text-decoration-none"
                          title="Chỉnh sửa banner"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </Link>
                        <button
                          onClick={() => item.id && setDeletingId(item.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-red-200/50 flex items-center justify-center cursor-pointer bg-white"
                          title="Xóa banner"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBanners.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                      Không tìm thấy banner nào phù hợp.
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
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredBanners.length)} của {filteredBanners.length} banner
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

      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa Banner"
        message="Bạn có chắc chắn muốn xóa banner này không? Hành động này không thể hoàn tác."
      />
    </div>
  );
}
