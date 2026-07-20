"use client";

import { authFetch } from "@/lib/authFetch";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";

interface Banner {
  id?: number;
  title?: string;
  description?: string;
  image_url: string;
  link: string;
  position: number;
  active: boolean;
  start_date?: string;
  end_date?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BannerDetailClientProps {
  id: number;
}

export default function BannerDetailClient({ id }: BannerDetailClientProps) {
  const router = useRouter();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  useEffect(() => {
    const fetchBannerDetail = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API_URL}/api/banners/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBanner(data);
        } else {
          setAlert({ msg: "Không thể lấy thông tin chi tiết banner.", type: "error" });
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết banner:", error);
        setAlert({ msg: "Lỗi kết nối đến máy chủ.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchBannerDetail();
  }, [id, API_URL]);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa banner này?")) return;

    try {
      const res = await authFetch(`${API_URL}/api/banners/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        window.alert("Xóa banner thành công!");
        router.push("/admin/banners");
      } else {
        setAlert({ msg: "Có lỗi xảy ra khi xóa banner.", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi xóa banner:", error);
      setAlert({ msg: "Lỗi kết nối đến máy chủ.", type: "error" });
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_URL}${url}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Không giới hạn";
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const getScheduleStatus = (b: Banner) => {
    if (!b.active) return { label: "Tạm ẩn", color: "bg-slate-55 text-slate-600 border-slate-200" };
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (b.start_date) {
      const startStr = b.start_date.substring(0, 10);
      if (startStr > todayStr) {
        return { label: "Sắp diễn ra", color: "bg-amber-50 text-amber-700 border-amber-200" };
      }
    }
    if (b.end_date) {
      const endStr = b.end_date.substring(0, 10);
      if (endStr < todayStr) {
        return { label: "Đã kết thúc", color: "bg-rose-50 text-rose-700 border-rose-200" };
      }
    }
    return { label: "Đang hoạt động", color: "bg-green-50 text-green-700 border-green-200" };
  };

  const getThucTeStatus = (b: Banner) => {
    if (!b.active) return "Không hiển thị (Quản trị tắt)";
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (b.start_date) {
      const startStr = b.start_date.substring(0, 10);
      if (startStr > todayStr) return "Không hiển thị do chưa đến thời gian";
    }
    if (b.end_date) {
      const endStr = b.end_date.substring(0, 10);
      if (endStr < todayStr) return "Không hiển thị do đã hết hạn";
    }
    return "Đang hiển thị trên trang chủ";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#b70011]"></div>
        <p className="mt-3 text-slate-500 font-medium text-sm">Đang tải chi tiết banner...</p>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="space-y-6 max-w-7xl w-full mx-auto p-4 font-sans text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Không tìm thấy Banner</h3>
        <p className="text-sm text-slate-500 mb-6">Có thể banner đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link href="/admin/banners" className="px-5 py-2.5 bg-[#b70011] text-white font-semibold text-xs rounded hover:bg-red-800 transition-colors">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const status = getScheduleStatus(banner);

  return (
    <div className="space-y-6 max-w-4xl w-full mx-auto p-4 animate__animated animate__fadeIn font-sans text-[#191c1e]">
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
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer border-0 bg-transparent" 
            onClick={() => setAlert(null)}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white border border-[#e6bdb8] rounded-2xl p-6 sm:p-8 shadow-md space-y-8">
        
        {/* Navigation & Actions Row */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <button 
            onClick={() => router.push("/admin/banners")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-55 transition-all font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
          <div className="flex gap-2">
            <Link 
              href={`/admin/banners/${id}/edit`}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-55 transition-all flex items-center gap-1.5 shadow-sm text-decoration-none cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Chỉnh sửa</span>
            </Link>
            <button 
              onClick={handleDelete} 
              className="px-3 py-1.5 bg-[#dc2626] text-white font-semibold text-xs rounded-lg hover:bg-[#b70011] transition-all flex items-center gap-1.5 shadow-sm border-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-widest text-slate-800 uppercase font-headline-lg">
            CHI TIẾT BANNER
          </h2>
        </div>

        {/* Big Banner Image */}
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 relative aspect-[21/9]">
          {banner.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={getImageUrl(banner.image_url)} 
              alt="Banner" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop&q=60";
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center py-12 text-slate-400">
              <ImageIcon className="w-12 h-12 stroke-[1.5] mb-2" />
              <span>Không tìm thấy ảnh banner</span>
            </div>
          )}
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          
          {/* Left Column: Basic Info & Display Status */}
          <div className="space-y-6">
            
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#b70011] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                Thông tin cơ bản
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Tên banner:</span>
                  <span className="text-slate-900 font-bold text-right break-all">{banner.title || "Chưa đặt tên"}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Ghi chú:</span>
                  <span className="text-slate-700 font-medium text-right break-all">{banner.description || "Không có ghi chú"}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Vị trí:</span>
                  <span className="text-slate-900 font-bold text-right">Trang chủ</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Thứ tự:</span>
                  <span className="text-slate-900 font-bold text-right">{banner.position}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Liên kết:</span>
                  {banner.link ? (
                    <a 
                      href={banner.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#b70011] hover:underline font-bold font-mono text-xs flex items-center gap-1 max-w-[200px] truncate text-right justify-end"
                      title={banner.link}
                    >
                      {banner.link} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Không có liên kết</span>
                  )}
                </div>
              </div>
            </div>

            {/* Trạng thái hiển thị */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-[#b70011] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                Trạng thái hiển thị
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24">Quản trị:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${banner.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-55 text-slate-600 border-slate-200'}`}>
                    {banner.active ? "Đang bật" : "Đang ẩn"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Thực tế:</span>
                  <span className={`text-right font-bold text-xs py-0.5 px-2 rounded-full ${
                    getThucTeStatus(banner) === "Đang hiển thị trên trang chủ"
                      ? "bg-green-50 text-green-700" 
                      : "bg-red-50 text-red-600"
                  }`}>
                    {getThucTeStatus(banner)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Applicable Time & System Metadata */}
          <div className="space-y-6">
            
            {/* Thời gian áp dụng */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#b70011] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                Thời gian áp dụng
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24">Bắt đầu:</span>
                  <span className="text-slate-900 font-bold">{formatDate(banner.start_date)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24">Kết thúc:</span>
                  <span className="text-slate-900 font-bold">{formatDate(banner.end_date)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24">Trạng thái:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin hệ thống */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-[#b70011] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                Thông tin hệ thống
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24">Ngày tạo:</span>
                  <span className="text-slate-900 font-bold">{formatDate(banner.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-semibold w-24">Ngày cập nhật:</span>
                  <span className="text-slate-900 font-bold">{formatDate(banner.updatedAt)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
