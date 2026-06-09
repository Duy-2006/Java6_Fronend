"use client";
import { authFetch } from "@/lib/authFetch";

import { useState, useEffect, Suspense } from "react";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Sliders,
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
  TrendingUp,
  Layout,
  X
} from "lucide-react";

interface Banner {
  id?: number;
  image_url: string; // Khớp chuẩn với biến phía Java Backend
  link: string;
  position: number;
  active: boolean;
}

function BannersContent() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [formData, setFormData] = useState<Banner>({ image_url: "", link: "", position: 0, active: true });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  // 1. Lấy danh sách banner từ API
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

  // Tự động ẩn thông báo sau 3 giây
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  // 2. Thêm hoặc Sửa banner
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/api/banners/${formData.id}` : `${API_URL}/api/banners`;

    try {
      const res = await authFetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setAlert({
          msg: isEditing ? "Cập nhật banner thành công!" : "Thêm mới banner thành công!",
          type: "success"
        });
        setFormData({ image_url: "", link: "", position: 0, active: true });
        setIsEditing(false);
        setShowForm(false);
        fetchBanners(true);
      } else {
        setAlert({ msg: "Có lỗi xảy ra khi xử lý biểu mẫu.", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi xử lý Form:", error);
      setAlert({ msg: "Không thể gửi dữ liệu đến máy chủ.", type: "error" });
    }
  };

  // 3. Đưa dữ liệu banner vào ô nhập để Sửa
  const handleEdit = (banner: Banner) => {
    setFormData(banner);
    setIsEditing(true);
    setShowForm(true);
    // Cuộn lên form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Xóa banner
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

  // 5. Xuất file Excel dùng SheetJS
  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const dataToExport = banners.map(b => ({
        'ID': b.id || 'N/A',
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

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  // Lọc banner theo link hoặc tên hình ảnh
  const filteredBanners = banners.filter(b =>
    b.link?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.image_url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBanners = banners.length;
  const activeBanners = banners.filter(b => b.active).length;
  const inactiveBanners = totalBanners - activeBanners;

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      
      {/* Alert Banners */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown transition-all ${
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
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer" 
            onClick={() => setAlert(null)}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#b70011]">Banners</span>
          </nav>
          <h2 className="text-2xl font-bold text-[#191c1e]">Quản lý Banner</h2>
          <p className="text-sm text-[#5c403c]">Thiết lập, cập nhật các banner và biểu ngữ quảng cáo cho trang chủ hệ thống.</p>
        </div>
      </section>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Banners */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#b70011] group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
            <Layout className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Tổng banner</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{loading ? "..." : totalBanners}</h3>
            <p className="font-semibold text-xs text-[#b70011] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              Tổng banner trong hệ thống
            </p>
          </div>
        </div>

        {/* Active Banners */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-700 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
            <Eye className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Đang hiển thị</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{loading ? "..." : activeBanners}</h3>
            <p className="font-semibold text-xs text-green-600 mt-1">
              Banner đang công khai
            </p>
          </div>
        </div>

        {/* Inactive Banners */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-700 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
            <EyeOff className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Đang ẩn</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{loading ? "..." : inactiveBanners}</h3>
            <p className="font-semibold text-xs text-red-500 mt-1">
              Banner bị tạm ẩn
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible/Toggle Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-md animate__animated animate__fadeIn space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2">
              {isEditing ? "🔄 Cập Nhật Banner" : "➕ Thêm Banner Mới"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setFormData({ image_url: "", link: "", position: 0, active: true });
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Đường dẫn hình ảnh (URL / Path) <span className="text-[#b70011]">*</span>
                </label>
                <div className="relative">
                  <ImageIcon className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ví dụ: /uploads/banner1.jpg hoặc https://example.com/banner.png"
                    value={formData.image_url} 
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required 
                    className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Đường dẫn liên kết điều hướng (Link - Tùy chọn)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ví dụ: /books/1 hoặc https://libris.com/summer-sale"
                    value={formData.link} 
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Vị trí sắp xếp (Thứ tự)
                  </label>
                  <div className="relative">
                    <Sliders className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      value={formData.position} 
                      onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={formData.active} 
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4.5 h-4.5 text-[#b70011] border-slate-300 rounded focus:ring-[#b70011]/20 accent-[#b70011]"
                    />
                    <span className="ml-2 text-xs font-bold text-slate-600 uppercase tracking-wide">Hiển thị công khai</span>
                  </label>
                </div>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="border border-dashed border-[#e6bdb8]/50 rounded-xl p-4 bg-[#f2f4f6]/30 flex flex-col justify-between min-h-[220px]">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Xem trước hình ảnh Banner</h4>
                {formData.image_url ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-[16/6] bg-slate-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getImageUrl(formData.image_url)} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 aspect-[16/6] bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs font-medium">Nhập đường dẫn hình ảnh để xem trước tại đây</p>
                  </div>
                )}
              </div>

              {formData.link && (
                <div className="mt-3 p-2 bg-[#ffdad6]/20 border border-[#e6bdb8]/30 rounded-lg flex items-center gap-1.5 text-xs text-[#b70011] font-semibold truncate">
                  <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Liên kết: {formData.link}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setFormData({ image_url: "", link: "", position: 0, active: true });
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className={`px-5 py-2 rounded-lg text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                isEditing 
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' 
                  : 'bg-[#b70011] hover:bg-[#b70011]/90 shadow-[#b70011]/15'
              }`}
            >
              {isEditing ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e6bdb8]/20 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm banner..."
              className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
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

          <button
            onClick={() => fetchBanners(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
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

        {/* Right Actions: Add New Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-[#b70011] text-white px-5 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#b70011]/15 hover:bg-[#b70011]/90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm banner mới</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#b70011]"></div>
          <p className="mt-3 text-slate-500 font-medium text-sm">Đang tải danh sách banner...</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((b) => (
            <div key={b.id} className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="relative aspect-[16/7] bg-slate-100 overflow-hidden border-b">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getImageUrl(b.image_url)} 
                    alt="Banner" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
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
                      Vị trí: {b.position}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#916f6b] uppercase tracking-wider">Đường dẫn ảnh:</p>
                    <p className="text-xs text-slate-500 font-mono truncate" title={b.image_url}>{b.image_url}</p>
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
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{b.link}</span>
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Trống (Không điều hướng)</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">ID: #{b.id}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(b)}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => b.id && handleDelete(b.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-100"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredBanners.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-[#e6bdb8]/50 rounded-xl flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-500 min-h-[200px]">
              <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Không tìm thấy banner nào.</p>
              <p className="text-xs text-slate-400 mt-1">Nhấp vào nút thêm banner mới để tạo mới.</p>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e6bdb8]/20 text-xs font-bold text-[#916f6b] uppercase tracking-wider">
                  <th className="px-6 py-4">Hình ảnh</th>
                  <th className="px-6 py-4">Đường dẫn ảnh</th>
                  <th className="px-6 py-4">Link liên kết</th>
                  <th className="px-6 py-4 text-center">Thứ tự</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10 text-sm">
                {filteredBanners.map((b) => (
                  <tr key={b.id} className="hover:bg-[#b70011]/5 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <div className="w-24 h-11 rounded-lg overflow-hidden border bg-slate-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={getImageUrl(b.image_url)} 
                          alt="Banner" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 max-w-[200px] truncate" title={b.image_url}>
                      {b.image_url}
                    </td>
                    <td className="px-6 py-4 max-w-[250px] truncate">
                      {b.link ? (
                        <a 
                          href={b.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-[#b70011] hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{b.link}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Trống</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                      {b.position}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        b.active 
                          ? 'bg-green-50 text-green-800 border-green-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${b.active ? 'bg-green-600 animate-pulse' : 'bg-red-500'}`} />
                        {b.active ? 'Đang hiện' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => handleEdit(b)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => b.id && handleDelete(b.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-100"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-100">
        <p className="text-[10px] text-[#916f6b] font-bold uppercase tracking-widest">
          © 2026 Libris Management System. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default function BannersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang tải trang...</p>
      </div>
    }>
      <BannersContent />
    </Suspense>
  );
}