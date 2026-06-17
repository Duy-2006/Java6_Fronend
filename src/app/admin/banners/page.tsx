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
  Layout,
  X
} from "lucide-react";

interface Banner {
  id?: number;
  image_url: string;
  link: string;
  position: number;
  active: boolean;
  start_date?: string;
  end_date?: string;
}

function BannersContent() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [formData, setFormData] = useState<Banner>({ image_url: "", link: "", position: 0, active: true, start_date: "", end_date: "" });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  // 1. Fetch banners from API
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

  // Auto hide alert after 3s
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  // 2. Submit form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/api/banners/${formData.id}` : `${API_URL}/api/banners`;

    try {
      const data = new FormData();
      data.append("image_url", formData.image_url);
      data.append("link", formData.link || "");
      data.append("position", String(formData.position));
      data.append("active", String(formData.active));
      if (formData.start_date) {
        data.append("start_date", formData.start_date);
      }
      if (formData.end_date) {
        data.append("end_date", formData.end_date);
      }
      if (imageFile) {
        data.append("imageFile", imageFile);
      }

      const res = await authFetch(url, {
        method: method,
        body: data,
      });

      if (res.ok) {
        setAlert({
          msg: isEditing ? "Cập nhật banner thành công!" : "Thêm mới banner thành công!",
          type: "success"
        });
        setFormData({ image_url: "", link: "", position: 0, active: true, start_date: "", end_date: "" });
        setImageFile(null);
        setIsEditing(false);
        fetchBanners(true);
      } else {
        setAlert({ msg: "Có lỗi xảy ra khi xử lý biểu mẫu.", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi xử lý Form:", error);
      setAlert({ msg: "Không thể gửi dữ liệu đến máy chủ.", type: "error" });
    }
  };

  // 3. Edit handler
  const handleEdit = (banner: Banner) => {
    setFormData(banner);
    setImageFile(null);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Delete handler
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

  // 5. Excel Export
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

  // 6. Toggle Active Status directly in Table/Grid
  const handleToggleActive = async (b: Banner) => {
    const updatedActive = !b.active;
    const url = `${API_URL}/api/banners/${b.id}`;

    // Optimistic update
    setBanners(prev => prev.map(item => item.id === b.id ? { ...item, active: updatedActive } : item));

    try {
      const data = new FormData();
      data.append("image_url", b.image_url);
      data.append("link", b.link || "");
      data.append("position", String(b.position));
      data.append("active", String(updatedActive));
      if (b.start_date) data.append("start_date", b.start_date);
      if (b.end_date) data.append("end_date", b.end_date);

      const res = await authFetch(url, {
        method: "PUT",
        body: data,
      });

      if (!res.ok) {
        // Revert on error
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
    if (!b.image_url) return `Banner #${b.id || ""}`;
    const parts = b.image_url.split('/');
    const filename = parts[parts.length - 1];
    const cleanName = decodeURIComponent(filename).replace(/^[0-9a-fA-F-]{36}_/, '');
    return cleanName || `Banner #${b.id || ""}`;
  };

  const getPositionLabel = (pos: number) => {
    return `Thứ tự #${pos} (Trang chủ)`;
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return "Không giới hạn";
    const startStr = start ? new Date(start).toLocaleDateString("vi-VN") : "...";
    const endStr = end ? new Date(end).toLocaleDateString("vi-VN") : "...";
    return `${startStr} - ${endStr}`;
  };

  const getScheduleStatusLabel = (b: Banner) => {
    if (!b.start_date && !b.end_date) return "Đang hoạt động";
    const now = new Date();
    if (b.start_date && new Date(b.start_date) > now) {
      return "Sắp diễn ra";
    }
    if (b.end_date && new Date(b.end_date) < now) {
      return "Đã kết thúc";
    }
    return "Đang diễn ra";
  };

  // Filter banners
  const filteredBanners = banners.filter(b =>
    b.link?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.image_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getBannerName(b).toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer" 
            onClick={() => setAlert(null)}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Breadcrumbs & Header inside form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#545f73] mb-2 font-medium">
            <a className="hover:text-[#b70011] transition-colors" href="#">Marketing</a>
            <ChevronRight className="w-3.5 h-3.5 text-[#545f73]" />
            <span className="text-[#191c1e] font-semibold">Quản lý Banner</span>
          </nav>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#191c1e] font-headline-lg">Quản lý Banner</h2>
              <p className="text-sm text-[#545f73] mt-1">Cài đặt, cập nhật các banner và lập lịch chương trình quảng cáo.</p>
            </div>
            
            <div className="flex gap-3">
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ image_url: "", link: "", position: 0, active: true, start_date: "", end_date: "" });
                    setImageFile(null);
                  }}
                  className="px-5 py-2.5 border border-[#e6bdb8] text-[#545f73] font-semibold text-xs rounded hover:bg-[#f2f4f6] transition-all flex items-center gap-2"
                >
                  Hủy sửa
                </button>
              )}
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-[#dc2626] text-white font-semibold text-xs rounded hover:bg-[#b70011] transition-all active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <Sliders className="w-4 h-4" />
                {isEditing ? "Lưu Banner (Cập nhật)" : "Lưu Banner (Thêm mới)"}
              </button>
            </div>
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

        {/* Management Form Layout */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Input Fields */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            {/* Thông tin cơ bản Card */}
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#b70011]" />
                <span>Thông tin cơ bản</span>
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Tên hiển thị / Ghi chú</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Banner chương trình Sale Hè 2026..." 
                    className="w-full bg-white border border-[#e6bdb8] rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none"
                    value={formData.image_url ? getBannerName(formData) : ""}
                    disabled
                  />
                  <p className="text-[11px] text-[#545f73] mt-1.5 italic">derived tự động từ tên tệp hình ảnh được chọn</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Đường dẫn liên kết điều hướng (Link)</label>
                  <div className="relative">
                    <LinkIcon className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ví dụ: /books/1 hoặc https://libris.com/summer-sale"
                      value={formData.link} 
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full bg-white border border-[#e6bdb8] rounded py-3 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Thứ tự hiển thị (Ngoài Trang chủ)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.position} 
                      onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#e6bdb8] rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none"
                      placeholder="Ví dụ: 0, 1, 2..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Trạng thái</label>
                    <div className="flex items-center h-[48px]">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={formData.active} 
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#e6e8ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b70011]"></div>
                        <span className="ms-3 text-sm font-semibold text-[#191c1e]">{formData.active ? "Hiển thị công khai" : "Tạm ẩn"}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thời gian áp dụng Card */}
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#b70011]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Thời gian áp dụng</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start_date" className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Từ ngày</label>
                  <input 
                    id="start_date"
                    type="datetime-local" 
                    title="Thời gian bắt đầu áp dụng"
                    aria-label="Thời gian bắt đầu áp dụng"
                    value={formData.start_date ? formData.start_date.substring(0, 16) : ""} 
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-white border border-[#e6bdb8] rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none text-[#191c1e]"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Đến ngày</label>
                  <input 
                    id="end_date"
                    type="datetime-local" 
                    title="Thời gian kết thúc áp dụng"
                    aria-label="Thời gian kết thúc áp dụng"
                    value={formData.end_date ? formData.end_date.substring(0, 16) : ""} 
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-white border border-[#e6bdb8] rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none text-[#191c1e]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Upload & Preview */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            
            {/* Tải lên hình ảnh Card */}
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#b70011]" />
                <span>Tải lên hình ảnh</span>
              </h3>

              {/* Drag & Drop zone */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    setImageFile(file);
                    const previewUrl = URL.createObjectURL(file);
                    setFormData({ ...formData, image_url: previewUrl });
                  }
                }}
                onClick={() => document.getElementById("banner-image-file-input")?.click()}
                className="border-2 border-dashed border-[#e6bdb8] hover:border-[#b70011] rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-[#f2f4f6]/50 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-[#b70011]/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#b70011]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <p className="font-bold text-sm text-[#191c1e] mb-1">
                  {imageFile ? `Đã chọn: ${imageFile.name}` : "Kéo thả hoặc nhấn để tải lên"}
                </p>
                <p className="text-xs text-[#545f73]">
                  {imageFile ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB` : "Tối ưu 1920x1080px (Max 5MB)"}
                </p>
                <input 
                  id="banner-image-file-input"
                  type="file" 
                  accept="image/*" 
                  title="Tải lên tệp hình ảnh banner"
                  aria-label="Tải lên tệp hình ảnh banner"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      const previewUrl = URL.createObjectURL(file);
                      setFormData({ ...formData, image_url: previewUrl });
                    }
                  }}
                />
              </div>

              {imageFile && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setFormData({ ...formData, image_url: "" });
                    }}
                    className="text-xs font-bold text-red-600 border border-red-200 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded transition-all"
                  >
                    Xóa tệp tải lên
                  </button>
                </div>
              )}

              {/* URL input fallback */}
              <div className="mt-4 pt-4 border-t border-[#e6bdb8]/30">
                <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Hoặc nhập URL hình ảnh trực tiếp</label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="https://example.com/image.png"
                    value={imageFile ? `[Tải lên từ thiết bị: ${imageFile.name}]` : formData.image_url} 
                    onChange={(e) => {
                      if (imageFile) setImageFile(null);
                      setFormData({ ...formData, image_url: e.target.value });
                    }}
                    disabled={!!imageFile}
                    className="w-full bg-white border border-[#e6bdb8] rounded py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none disabled:opacity-60 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Xem trước Card */}
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#b70011]" />
                  <span>Xem trước</span>
                </h3>
                
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded">
                  <button 
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded transition-colors ${previewDevice === 'desktop' ? 'bg-white text-[#b70011] shadow-sm' : 'text-[#545f73] hover:text-[#b70011]'}`}
                    title="Desktop View"
                  >
                    <Layout className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded transition-colors ${previewDevice === 'mobile' ? 'bg-white text-[#b70011] shadow-sm' : 'text-[#545f73] hover:text-[#b70011]'}`}
                    title="Mobile View"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-[#e6bdb8] bg-white transition-all duration-300">
                <div className="h-4 bg-[#e6e8ea] border-b border-[#e6bdb8] flex items-center px-2 gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                </div>

                <div className={`preview-frame relative flex items-center justify-center p-2 bg-slate-50 transition-all duration-300 ${
                  previewDevice === 'desktop' 
                    ? 'w-full aspect-[16/7]' 
                    : 'w-44 aspect-[9/16] mx-auto py-4 border-x border-[#e6bdb8]/40'
                }`}>
                  {formData.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={getImageUrl(formData.image_url)} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover rounded shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
                      }}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Chưa có hình ảnh</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Banner List Section Card */}
      <div className="bg-white border border-[#e6bdb8] rounded-xl overflow-hidden shadow-sm mt-8">
        
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
                type="text" 
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
                className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setViewMode('table')}
                title="Dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
                  <th className="px-6 py-4">Tên Banner / Ghi chú</th>
                  <th className="px-6 py-4">Thứ tự hiển thị</th>
                  <th className="px-6 py-4">Thời gian áp dụng</th>
                  <th className="px-6 py-4 text-center">Trạng thái hiển thị</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10 text-sm">
                {filteredBanners.map((b) => (
                  <tr key={b.id} className="hover:bg-[#b70011]/5 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <div className="w-20 h-12 rounded border border-[#e6bdb8] overflow-hidden bg-slate-100 flex-shrink-0">
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
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#191c1e] text-sm mb-0.5">{getBannerName(b)}</p>
                      <p className="text-xs text-[#545f73] font-mono truncate max-w-[280px]" title={b.link}>
                        {b.link || "Không điều hướng (Trống)"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#e6e8ea] rounded text-xs text-[#5c403c] font-medium">
                        {getPositionLabel(b.position)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[#191c1e] font-semibold mb-0.5">{formatDateRange(b.start_date, b.end_date)}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        getScheduleStatusLabel(b) === 'Đang hoạt động' || getScheduleStatusLabel(b) === 'Đang diễn ra'
                          ? 'text-green-600' 
                          : getScheduleStatusLabel(b) === 'Sắp diễn ra'
                            ? 'text-amber-600' 
                            : 'text-red-500'
                      }`}>
                        {getScheduleStatusLabel(b)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={b.active} 
                          onChange={() => handleToggleActive(b)}
                          title="Kích hoạt banner"
                          aria-label="Kích hoạt banner"
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#e6e8ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#b70011]"></div>
                        <span className="sr-only">Kích hoạt banner</span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(b)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-[#545f73] hover:text-[#b70011]"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => b.id && handleDelete(b.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-[#545f73] hover:text-red-600"
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
                      <p className="text-[10px] font-bold text-[#916f6b] uppercase tracking-wider">Tên Banner / Tệp:</p>
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
                        getScheduleStatusLabel(b) === 'Đang hoạt động' || getScheduleStatusLabel(b) === 'Đang diễn ra'
                          ? 'bg-green-50 text-green-600 border border-green-200' 
                          : getScheduleStatusLabel(b) === 'Sắp diễn ra'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                            : 'bg-red-50 text-red-500 border border-red-200'
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
                    <button 
                      onClick={() => handleEdit(b)}
                      className="p-1.5 rounded-lg text-[#545f73] hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200"
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

export default function BannersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 font-sans bg-[#f7f9fb]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang tải trang...</p>
      </div>
    }>
      <BannersContent />
    </Suspense>
  );
}