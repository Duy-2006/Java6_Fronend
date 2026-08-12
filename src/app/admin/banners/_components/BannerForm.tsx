"use client";

import { authFetch } from "@/lib/authFetch";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Image as ImageIcon,
  Sliders,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Layout,
  X
} from "lucide-react";
import { validateBanner, BannerFields, FieldErrors } from "@/services/validation";

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

interface BannerFormProps {
  id?: number;
}

export default function BannerForm({ id }: BannerFormProps) {
  const router = useRouter();
  const isEditing = id !== undefined;
  const [formData, setFormData] = useState<Banner>({
    title: "",
    description: "",
    image_url: "",
    link: "",
    position: 0,
    active: true,
    start_date: "",
    end_date: ""
  });
  const [errors, setErrors] = useState<FieldErrors<BannerFields>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bannerAlert, setBannerAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [initialStartDate, setInitialStartDate] = useState<string>("");
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  // Fetch banner detail if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchBannerDetail = async () => {
        try {
          setLoading(true);
          const res = await authFetch(`${API_URL}/api/banners/${id}`);
          if (res.ok) {
            const data = await res.json();
            const startVal = data.start_date ? data.start_date.substring(0, 10) : "";
            setInitialStartDate(startVal);
            setFormData({
              ...data,
              title: data.title || "",
              description: data.description || "",
              start_date: startVal,
              end_date: data.end_date ? data.end_date.substring(0, 10) : ""
            });
          } else {
            setBannerAlert({ msg: "Không thể lấy thông tin chi tiết banner.", type: "error" });
          }
        } catch (error) {
          console.error("Lỗi lấy chi tiết banner:", error);
          setBannerAlert({ msg: "Lỗi kết nối đến máy chủ.", type: "error" });
        } finally {
          setLoading(false);
        }
      };
      fetchBannerDetail();
    }
  }, [id, isEditing, API_URL]);

  useEffect(() => {
    if (!bannerAlert) return;
    const timer = setTimeout(() => setBannerAlert(null), 4000);
    return () => clearTimeout(timer);
  }, [bannerAlert]);

  const handleFileSelection = (file: File) => {
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

    if (!file.type.startsWith("image/") && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image_url: "Định dạng tệp không hợp lệ. Vui lòng chọn ảnh JPG, PNG, WEBP, GIF, SVG." }));
      setBannerAlert({ msg: "Định dạng tệp không hợp lệ. Vui lòng chọn file hình ảnh.", type: "error" });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrors((prev) => ({
        ...prev,
        image_url: `Dung lượng ảnh vượt quá giới hạn cho phép.`
      }));
      setBannerAlert({
        msg: `Dung lượng tệp vượt quá giới hạn cho phép.`,
        type: "error"
      });
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image_url: previewUrl }));
    setErrors((prev) => ({ ...prev, image_url: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form inputs
    const validationErrors = validateBanner({
      title: formData.title,
      image_url: formData.image_url,
      imageFile: imageFile,
      link: formData.link,
      position: formData.position,
      startDate: formData.start_date,
      endDate: formData.end_date,
      isEdit: isEditing,
      initialStartDate: initialStartDate,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      setBannerAlert({ msg: firstError || "Vui lòng kiểm tra lại các trường thông tin.", type: "error" });
      return;
    }

    setErrors({});
    setSubmitting(true);

    const method = "POST";
    const url = isEditing ? `${API_URL}/api/banners/${id}` : `${API_URL}/api/banners`;

    try {
      const data = new FormData();
      data.append("title", (formData.title || "").trim());
      data.append("description", (formData.description || "").trim());
      data.append("image_url", formData.image_url || "");
      data.append("link", (formData.link || "").trim());
      data.append("position", String(formData.position || 0));
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
        alert(isEditing ? "Cập nhật banner thành công!" : "Thêm mới banner thành công!");
        router.push("/admin/banners");
      } else {
        try {
          const errData = await res.json();
          setBannerAlert({ msg: errData.message || "Có lỗi xảy ra khi lưu banner.", type: "error" });
        } catch {
          setBannerAlert({ msg: "Có lỗi xảy ra khi lưu banner.", type: "error" });
        }
      }
    } catch (error) {
      console.error("Lỗi lưu banner:", error);
      setBannerAlert({ msg: "Lỗi kết nối đến máy chủ.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#b70011]"></div>
        <p className="mt-3 text-slate-500 font-medium text-sm">Đang tải thông tin banner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl w-full mx-auto p-4 animate__animated animate__fadeIn font-sans bg-[#f7f9fb] text-[#191c1e]">
      {bannerAlert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown transition-all z-50 ${bannerAlert.type === 'success'
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-red-50 text-red-800 border-red-200'
          }`}>
          <div className="flex items-center gap-2.5">
            {bannerAlert.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className="text-sm font-semibold">{bannerAlert.msg}</p>
          </div>
          <button
            type="button"
            aria-label="Đóng thông báo"
            title="Đóng thông báo"
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer border-0 bg-transparent"
            onClick={() => setBannerAlert(null)}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Breadcrumbs & Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#545f73] mb-2 font-medium">
            <Link className="hover:text-[#b70011] transition-colors text-decoration-none" href="/admin/dashboard">Marketing</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#545f73]" />
            <Link className="hover:text-[#b70011] transition-colors text-decoration-none" href="/admin/banners">Quản lý Banner</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#545f73]" />
            <span className="text-[#191c1e] font-semibold">{isEditing ? "Cập nhật" : "Thêm mới"}</span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#191c1e] font-sans">
                {isEditing ? "Cập Nhật Banner" : "Thêm Banner Mới"}
              </h2>
              <p className="text-sm text-[#545f73] mt-1">Cấu hình các thông số hiển thị và liên kết điều hướng cho banner.</p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/admin/banners"
                className="px-5 py-2.5 border border-[#e6bdb8] text-[#545f73] font-semibold text-xs rounded hover:bg-[#f2f4f6] transition-all flex items-center justify-center gap-2 text-decoration-none bg-white cursor-pointer"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#dc2626] text-white font-semibold text-xs rounded hover:bg-[#b70011] transition-all active:scale-95 flex items-center gap-2 shadow-sm border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sliders className="w-4 h-4" />
                <span>{submitting ? "Đang lưu..." : (isEditing ? "Lưu thay đổi" : "Lưu Banner")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Layout Form */}
        <div className="grid grid-cols-12 gap-8">

          {/* Left Column: Input Fields */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#b70011]" />
                <span>Thông tin cơ bản</span>
              </h3>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider">
                      Tên banner <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#545f73]">{(formData.title || "").length}/255</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập tên banner (ví dụ: Khuyến mãi hè 2026)..."
                    maxLength={255}
                    className={`w-full bg-white border ${errors.title ? "border-red-500 ring-1 ring-red-500" : "border-[#e6bdb8]"
                      } rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none text-[#191c1e]`}
                    value={formData.title || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                  />
                  {errors.title ? (
                    <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.title}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#545f73] mt-1.5 italic">Tên banner chính dùng để hiển thị và phân biệt.</p>
                  )}
                </div>



                <div>
                  <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Thứ tự hiển thị (Ngoài Trang chủ)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.position}
                    onChange={(e) => {
                      setFormData({ ...formData, position: parseInt(e.target.value) || 0 });
                      if (errors.position) setErrors((prev) => ({ ...prev, position: undefined }));
                    }}
                    className={`w-full bg-white border ${errors.position ? "border-red-500 ring-1 ring-red-500" : "border-[#e6bdb8]"
                      } rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none`}
                    placeholder="Ví dụ: 0, 1, 2..."
                  />
                  {errors.position ? (
                    <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.position}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#545f73] mt-1.5 italic">Thứ tự ưu tiên hiển thị banner trên trang chủ (số nhỏ hơn hiển thị trước).</p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#b70011]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Thời gian áp dụng</span>
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start_date" className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Từ ngày <span className="text-red-500">*</span></label>
                  <input
                    id="start_date"
                    type="date"
                    title="Ngày bắt đầu áp dụng"
                    aria-label="Ngày bắt đầu áp dụng"
                    value={formData.start_date ? formData.start_date.substring(0, 10) : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, start_date: e.target.value });
                      if (errors.startDate || errors.endDate) setErrors((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));
                    }}
                    className={`w-full bg-white border ${errors.startDate ? "border-red-500 ring-1 ring-red-500" : "border-[#e6bdb8]"
                      } rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none text-[#191c1e]`}
                  />
                  {errors.startDate && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.startDate}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Đến ngày <span className="text-red-500">*</span></label>
                  <input
                    id="end_date"
                    type="date"
                    title="Ngày kết thúc áp dụng"
                    aria-label="Ngày kết thúc áp dụng"
                    value={formData.end_date ? formData.end_date.substring(0, 10) : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, end_date: e.target.value });
                      if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }));
                    }}
                    className={`w-full bg-white border ${errors.endDate ? "border-red-500 ring-1 ring-red-500" : "border-[#e6bdb8]"
                      } rounded px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none text-[#191c1e]`}
                  />
                  {errors.endDate && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.endDate}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Upload & Preview */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#b70011]" />
                <span>Tải lên hình ảnh <span className="text-red-500">*</span></span>
              </h3>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelection(file);
                }}
                onClick={() => document.getElementById("banner-image-file-input")?.click()}
                className={`border-2 border-dashed ${errors.image_url ? "border-red-500 bg-red-50/30" : "border-[#e6bdb8] hover:border-[#b70011] hover:bg-[#f2f4f6]/50"
                  } rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group`}
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
                  title="Tải lên hình ảnh banner"
                  aria-label="Tải lên hình ảnh banner"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelection(file);
                    e.target.value = "";
                  }}
                />
              </div>

              {errors.image_url && (
                <p className="mt-2 text-xs text-red-600 font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.image_url}</span>
                </p>
              )}

              {imageFile && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setFormData({ ...formData, image_url: "" });
                    }}
                    className="text-xs font-bold text-red-600 border border-red-200 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    Xóa tệp tải lên
                  </button>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#e6bdb8]/30">
                <label className="block text-xs font-bold text-[#545f73] uppercase tracking-wider mb-2">Hoặc nhập URL hình ảnh trực tiếp</label>
                <div style={{ position: "relative" }}>
                  <ImageIcon className="w-4 h-4 text-slate-400" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="https://example.com/image.png"
                    value={imageFile ? `[Tải lên từ thiết bị: ${imageFile.name}]` : formData.image_url}
                    onChange={(e) => {
                      if (imageFile) setImageFile(null);
                      setFormData({ ...formData, image_url: e.target.value });
                      if (errors.image_url) setErrors((prev) => ({ ...prev, image_url: undefined }));
                    }}
                    disabled={!!imageFile}
                    style={{ paddingLeft: "2.5rem" }}
                    className="w-full bg-white border border-[#e6bdb8] rounded py-2.5 pr-4 text-xs focus:ring-1 focus:ring-[#b70011] focus:border-[#b70011] transition-all outline-none disabled:opacity-60 disabled:bg-slate-50 text-[#191c1e]"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white border border-[#e6bdb8] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#b70011]">visibility</span>
                  <span>Xem trước</span>
                </h3>

                <div className="flex gap-1 bg-slate-100 p-0.5 rounded">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded transition-colors border-0 bg-transparent cursor-pointer ${previewDevice === 'desktop' ? 'bg-white text-[#b70011] shadow-sm' : 'text-[#545f73] hover:text-[#b70011]'}`}
                    title="Desktop View"
                  >
                    <Layout className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded transition-colors border-0 bg-transparent cursor-pointer ${previewDevice === 'mobile' ? 'bg-white text-[#b70011] shadow-sm' : 'text-[#545f73] hover:text-[#b70011]'}`}
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

                <div className={`preview-frame relative flex items-center justify-center p-2 bg-slate-50 transition-all duration-300 ${previewDevice === 'desktop'
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
    </div>
  );
}
