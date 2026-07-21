"use client";

import { authFetch } from "@/lib/authFetch";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Edit,
  Download,
  RefreshCw,
  Plus,
  Grid,
  List,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Layout,
  X
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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  const fetchBanners = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await authFetch(`${API_URL}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      } else {
        setAlert({ msg: "Không thể lấy danh sách banner từ máy chủ.", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi kết nối API lấy danh sách banner:", error);
      setAlert({ msg: "Lỗi kết nối đến máy chủ API.", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      try {
        const res = await authFetch(`${API_URL}/api/banners/${id}`, { method: "DELETE" });
        if (res.ok) {
          setAlert({ msg: "Xóa banner thành công!", type: "success" });
          fetchBanners(true);
        } else {
          setAlert({ msg: "Không thể xóa banner này.", type: "error" });
        }
      } catch (error) {
        console.error("Lỗi xóa banner:", error);
        setAlert({ msg: "Lỗi kết nối máy chủ khi xóa banner.", type: "error" });
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const dataToExport = banners.map(b => ({
        'ID': b.id || 'N/A',
        'Tên hiển thị / Ghi chú': b.title || 'Không có',
        'Đường dẫn hình ảnh': b.image_url,
        'Link liên kết': b.link || 'Trống',
        'Vị trí hiển thị': b.position,
        'Trạng thái': b.active ? 'Đang hiển thị' : 'Đang ẩn'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Banners');
      XLSX.writeFile(wb, `Danh_sach_banner_Libris_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Lỗi khi xuất Excel:', err);
      setAlert({ msg: 'Không thể xuất file Excel báo cáo: ' + err.message, type: 'error' });
    }
  };

  const handleToggleActive = async (b: Banner) => {
    const updatedActive = !b.active;
    const url = `${API_URL}/api/banners/${b.id}`;

    setBanners(prev => prev.map(item => item.id === b.id ? { ...item, active: updatedActive } : item));

    try {
      const data = new FormData();
      data.append("title", b.title || "");
      data.append("image_url", b.image_url);
      data.append("link", b.link || "");
      data.append("position", String(b.position));
      data.append("active", String(updatedActive));
      if (b.start_date) data.append("start_date", b.start_date);
      if (b.end_date) data.append("end_date", b.end_date);

      const res = await authFetch(url, {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        setBanners(prev => prev.map(item => item.id === b.id ? { ...item, active: b.active } : item));
        setAlert({ msg: "Không thể cập nhật trạng thái banner.", type: "error" });
      } else {
        setAlert({ msg: `Đã ${updatedActive ? "bật" : "tắt"} hiển thị banner thành công!`, type: "success" });
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      setBanners(prev => prev.map(item => item.id === b.id ? { ...item, active: b.active } : item));
      setAlert({ msg: "Lỗi kết nối máy chủ.", type: "error" });
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

  const getPositionLabel = (pos: number) => {
    return `Thứ tự #${pos} (Trang chủ)`;
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

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return "Không giới hạn";
    const startStr = start ? formatDateString(start) : "...";
    const endStr = end ? formatDateString(end) : "...";
    return `${startStr} - ${endStr}`;
  };

  const getScheduleStatusLabel = (b: Banner) => {
    if (!b.active) return "Tạm ẩn";
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (b.start_date) {
      const startStr = b.start_date.substring(0, 10);
      if (startStr > todayStr) return "Sắp diễn ra";
    }
    if (b.end_date) {
      const endStr = b.end_date.substring(0, 10);
      if (endStr < todayStr) return "Đã kết thúc";
    }
    return "Đang diễn ra";
  };

  const filteredBanners = banners
    .filter(b =>
      b.link?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.image_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getBannerName(b).toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // 1. Phân loại theo trọng số trạng thái: Đang diễn ra -> Sắp diễn ra -> Đã kết thúc -> Tạm ẩn
      const getStatusWeight = (banner: Banner) => {
        const status = getScheduleStatusLabel(banner);
        if (status === "Đang diễn ra") return 0;
        if (status === "Sắp diễn ra") return 1;
        if (status === "Đã kết thúc") return 2;
        return 3; // "Tạm ẩn"
      };

      const wA = getStatusWeight(a);
      const wB = getStatusWeight(b);
      if (wA !== wB) return wA - wB;

      // 2. Sắp xếp theo thời gian bắt đầu gần nhất (giảm dần)
      const getSortTime = (banner: Banner) => {
        if (banner.start_date) return new Date(banner.start_date).getTime();
        if (banner.createdAt) return new Date(banner.createdAt).getTime();
        return 0;
      };

      const tA = getSortTime(a);
      const tB = getSortTime(b);
      if (tA !== tB) return tB - tA;

      // 3. Sắp xếp phụ theo thời gian tạo gần nhất (giảm dần)
      const cA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cB - cA;
    });

  const totalBanners = banners.length;
  const activeBanners = banners.filter(b => b.active).length;
  const inactiveBanners = totalBanners - activeBanners;

  return (
    <div className="space-y-6 max-w-7xl w-full mx-auto p-4 animate__animated animate__fadeIn font-sans bg-[#f7f9fb] text-[#191c1e]">
      
      {/* Alert Banners */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown transition-all z-50 ${
          alert.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className="text-sm font-semibold">{alert.msg}</p>
          </div>
          <button 
            type="button" 
            aria-label="Đóng thông báo"
            title="Đóng thông báo"
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer border-0 bg-transparent" 
            onClick={() => setAlert(null)}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-[#545f73] mb-2 font-medium">
          <Link className="hover:text-[#b70011] transition-colors text-decoration-none" href="/admin/dashboard">Marketing</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#545f73]" />
          <span className="text-[#191c1e] font-semibold">Quản lý Banner</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#191c1e] font-headline-lg">Quản lý Banner</h2>
            <p className="text-sm text-[#545f73] mt-1">Cài đặt, cập nhật các banner và lập lịch chương trình quảng cáo.</p>
          </div>
          
          <Link 
            href="/admin/banners/new" 
            className="px-6 py-2.5 bg-[#dc2626] text-white font-semibold text-xs rounded hover:bg-[#b70011] transition-all active:scale-95 flex items-center gap-2 shadow-sm text-decoration-none border-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Banner Mới</span>
          </Link>
        </div>
      </div>

      {/* Bento Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#b70011] group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
            <Layout className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Tổng banner</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{loading ? "..." : totalBanners}</h3>
            <p className="font-semibold text-xs text-[#b70011] mt-1">Danh sách banner trong hệ thống</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-700 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
            <Eye className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Đang hiển thị</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{loading ? "..." : activeBanners}</h3>
            <p className="font-semibold text-xs text-green-600 mt-1">Banners đang công khai</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-700 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
            <EyeOff className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Đang ẩn</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{loading ? "..." : inactiveBanners}</h3>
            <p className="font-semibold text-xs text-red-500 mt-1">Banners bị tạm ẩn</p>
          </div>
        </div>
      </div>

      {/* Banner List Section Card */}
      <div className="bg-white border border-[#e6bdb8] rounded-xl overflow-hidden shadow-sm">
        
        {/* List Header */}
        <div className="px-6 py-5 border-b border-[#e6bdb8]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#b70011]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
            <span>Danh sách Banner</span>
          </h3>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="search" 
                placeholder="Tìm kiếm banner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f2f4f6]/80 border-none rounded-full py-2 pl-9 pr-4 text-xs focus:bg-white focus:ring-1 focus:ring-[#b70011] transition-all outline-none"
              />
            </div>

            {/* Export */}
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-[#545f73] rounded-lg font-semibold text-xs hover:bg-[#b70011]/5 transition-colors border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchBanners(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-[#545f73] rounded-lg font-semibold text-xs hover:bg-[#b70011]/5 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>

            {/* View Toggles */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50">
              <button 
                className={`p-1.5 rounded transition-colors cursor-pointer border-0 bg-transparent ${viewMode === 'table' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setViewMode('table')}
                title="Dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                className={`p-1.5 rounded transition-colors cursor-pointer border-0 bg-transparent ${viewMode === 'grid' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setViewMode('grid')}
                title="Dạng lưới"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#b70011]"></div>
            <p className="mt-3 text-slate-500 font-medium text-sm">Đang tải danh sách banner...</p>
          </div>
        ) : viewMode === 'table' ? (
          
          /* TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e6bdb8]/20 text-xs font-bold text-[#916f6b] uppercase tracking-wider">
                  <th className="px-6 py-4">Hình ảnh</th>
                  <th className="px-6 py-4">Tên banner</th>
                  <th className="px-6 py-4">Vị trí / Thứ tự</th>
                  <th className="px-6 py-4">Thời gian áp dụng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10 text-sm">
                {filteredBanners.map((b) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-[#b70011]/5 transition-colors duration-150 group cursor-pointer"
                    onClick={() => router.push(`/admin/banners/${b.id}`)}
                  >
                    <td className="px-6 py-4">
                      {b.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={getImageUrl(b.image_url)} 
                          alt="Banner" 
                          className="w-24 h-10 object-cover rounded-md shadow-sm border border-[#e6bdb8]/30 group-hover:scale-105 transition-transform duration-150"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
                          }}
                        />
                      ) : (
                        <div className="w-24 h-10 bg-slate-105 flex items-center justify-center rounded-md border border-slate-200">
                          <ImageIcon className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#191c1e] group-hover:text-[#b70011] group-hover:underline transition-colors block text-sm">
                        {getBannerName(b)}
                      </span>
                      {b.link && (
                        <p className="text-xs text-[#545f73] font-mono truncate max-w-[280px] mt-0.5" title={b.link}>
                          {b.link}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      Trang chủ · #{b.position}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold text-slate-700">
                        {formatDateString(b.start_date)} {"->"}
                        <br />
                        {formatDateString(b.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${
                        getScheduleStatusLabel(b) === 'Đang diễn ra'
                          ? 'text-green-600' 
                          : getScheduleStatusLabel(b) === 'Sắp diễn ra'
                            ? 'text-amber-600' 
                            : getScheduleStatusLabel(b) === 'Đã kết thúc'
                              ? 'text-red-500'
                              : 'text-slate-500'
                      }`}>
                        {getScheduleStatusLabel(b)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Link 
                          href={`/admin/banners/${b.id}/edit`}
                          className="text-[#545f73] hover:text-[#b70011] hover:underline font-semibold transition-colors"
                          title="Chỉnh sửa"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Sửa
                        </Link>
                        <span className="text-slate-300 font-normal">·</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            b.id && handleDelete(b.id);
                          }}
                          className="text-[#545f73] hover:text-red-600 hover:underline font-semibold transition-colors border-0 bg-transparent p-0 cursor-pointer"
                          title="Xóa"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredBanners.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-[#545f73]/60 py-12 text-sm italic">
                      Không tìm thấy banner nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          
          /* GRID VIEW */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanners.map((b) => (
              <div key={b.id} className="bg-white border border-[#e6bdb8]/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-[16/7] bg-slate-100 overflow-hidden border-b border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getImageUrl(b.image_url)} 
                      alt="Banner" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
                      }}
                    />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm ${
                        b.active 
                          ? "bg-green-500 text-white" 
                          : "bg-slate-500 text-white"
                      }`}>
                        {b.active ? "Đang hiện" : "Đang ẩn"}
                      </span>
                      <span className="bg-slate-900/80 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        Thứ tự: {b.position}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#916f6b] uppercase tracking-wider">Tên banner:</p>
                      <p className="text-xs font-semibold text-[#191c1e] truncate" title={getBannerName(b)}>{getBannerName(b)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#916f6b] uppercase tracking-wider">Liên kết điều hướng:</p>
                      {b.link ? (
                        <a 
                          href={b.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-[#b70011] hover:underline font-medium inline-flex items-center gap-1 truncate w-full"
                        >
                          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{b.link}</span>
                        </a>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Trống (Không điều hướng)</p>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold text-[#916f6b] uppercase tracking-wider">Thời gian áp dụng:</p>
                      <p className="text-xs text-[#191c1e] font-semibold">{formatDateRange(b.start_date, b.end_date)}</p>
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        getScheduleStatusLabel(b) === 'Đang diễn ra'
                          ? 'bg-green-50 text-green-600 border border-green-200' 
                          : getScheduleStatusLabel(b) === 'Sắp diễn ra'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                            : getScheduleStatusLabel(b) === 'Đã kết thúc'
                              ? 'bg-red-50 text-red-500 border border-red-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {getScheduleStatusLabel(b)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">ID: #{b.id}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggleActive(b)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        b.active 
                          ? 'border-green-200 bg-green-50/50 text-green-700' 
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                      title={b.active ? "Tắt hiển thị" : "Bật hiển thị"}
                    >
                      {b.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <Link 
                      href={`/admin/banners/${b.id}/edit`}
                      className="p-1.5 rounded-lg text-[#545f73] hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200 flex items-center justify-center text-decoration-none"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => b.id && handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-100 bg-transparent"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredBanners.length === 0 && (
              <div className="col-span-full border-2 border-dashed border-[#e6bdb8] rounded-xl flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-500 min-h-[200px]">
                <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold">Không tìm thấy banner nào.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination Info */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#e6bdb8]/20 flex justify-between items-center text-xs text-[#545f73] font-semibold">
          <span>Hiển thị 1 - {filteredBanners.length} trong tổng số {filteredBanners.length} banner</span>
          <div className="flex gap-1">
            <button className="px-2.5 py-1.5 rounded border border-slate-200 bg-white opacity-50 cursor-not-allowed">Trước</button>
            <button className="px-3 py-1.5 rounded border border-[#b70011] bg-[#b70011] text-white">1</button>
            <button className="px-2.5 py-1.5 rounded border border-slate-200 bg-white opacity-50 cursor-not-allowed">Sau</button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-200">
        <p className="text-[10px] text-[#916f6b] font-bold uppercase tracking-widest">
          © 2026 Libris Management System. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
