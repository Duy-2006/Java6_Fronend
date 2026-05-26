"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateAuthor } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  ChevronRight, 
  UserPlus, 
  Edit 
} from "lucide-react";

interface Author { 
  id?: number | null; 
  name: string; 
  email?: string; 
}

export default function AuthorForm({ author }: { author?: Author }) {
  const isEdit = !!author?.id;
  const router = useRouter();

  // ✅ FALLBACK URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const [form, setForm] = useState({
    id: author?.id ?? null,
    name: author?.name ?? "",
    email: author?.email ?? "",
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateAuthor>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const setField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Kiểm tra nếu edit nhưng thiếu id
    if (isEdit && !form.id) {
      setApiError("Lỗi: Không tìm thấy ID tác giả. Vui lòng quay lại trang danh sách.");
      return;
    }

    const errs = validateAuthor({ name: form.name, email: form.email });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `${API_BASE}/api/admin/authors/${form.id}`
        : `${API_BASE}/api/admin/authors`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });

      if (res.ok) {
        const msg = isEdit ? "Cập nhật thành công." : "Thêm tác giả thành công.";
        router.push(`/admin/authors?success=${encodeURIComponent(msg)}`);
        router.refresh();
      } else {
        const errorText = await res.text();
        setApiError(errorText || "Có lỗi xảy ra trên máy chủ.");
      }
    } catch {
      setApiError("Không thể kết nối tới server. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 animate__animated animate__fadeIn font-sans">
      {/* Breadcrumb & Header */}
      <section className="space-y-2">
        <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Link href="/admin/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/admin/authors" className="hover:text-slate-600 transition-colors">Tác giả</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#b70011]">{isEdit ? "Cập nhật" : "Thêm mới"}</span>
        </nav>
        <h2 className="text-2xl font-bold text-[#191c1e] font-sans">
          {isEdit ? "Cập Nhật Hồ Sơ Tác Giả" : "Thêm Tác Giả Mới"}
        </h2>
      </section>

      {/* Main Form Card */}
      <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
        {/* Header Block with linear gradient */}
        <div className="bg-gradient-to-r from-[#b70011] to-[#bf0715] p-5 text-white flex items-center gap-2.5">
          {isEdit ? (
            <Edit className="w-5.5 h-5.5" />
          ) : (
            <UserPlus className="w-5.5 h-5.5" />
          )}
          <h3 className="font-bold text-sm uppercase tracking-wide">
            {isEdit ? `Chỉnh sửa: ${author?.name}` : "Thông tin hồ sơ tác giả"}
          </h3>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-white space-y-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* API Error alert */}
            {apiError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0 animate-pulse" />
                <p className="font-medium">{apiError}</p>
              </div>
            )}

            {/* Input Tên Tác Giả */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Tên Tác Giả <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className={`w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none ${
                    errors.name ? "ring-2 ring-red-500" : ""
                  }`}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  onBlur={() =>
                    setErrors((v) => ({
                      ...v,
                      ...validateAuthor({ name: form.name }),
                    }))
                  }
                  placeholder="Nhập tên tác giả (VD: Nguyễn Nhật Ánh)..."
                  maxLength={100}
                  disabled={loading}
                />
              </div>
              {errors.name && <FieldError msg={errors.name} />}
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold px-0.5">
                <span>Nhập tên hiển thị chính thức của tác giả</span>
                <span>{form.name.length}/100</span>
              </div>
            </div>

            {/* Input Email Liên Hệ */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Email Liên Hệ <span className="text-slate-400 font-normal text-xs">(Tùy chọn)</span>
              </label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  className={`w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none ${
                    errors.email ? "ring-2 ring-red-500" : ""
                  }`}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  onBlur={() => {
                    if (form.email)
                      setErrors((v) => ({
                        ...v,
                        ...validateAuthor({
                          name: form.name,
                          email: form.email,
                        }),
                      }));
                  }}
                  placeholder="contact@author.com"
                  disabled={loading}
                />
              </div>
              {errors.email && <FieldError msg={errors.email} />}
              <p className="text-[11px] text-slate-400 font-semibold px-0.5">
                Email dùng để liên hệ bản quyền tác phẩm hoặc đối soát doanh thu.
              </p>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/admin/authors"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#b70011] text-white hover:bg-[#b70011]/90 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#b70011]/15 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu hồ sơ"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}