"use client";
import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateCategory } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";
import { getAllCategories } from "@/services/categoriesService";
import {
  ArrowLeft,
  Save,
  Tag,
  Image as ImageIcon,
  ChevronRight,
  FolderPlus,
  Edit
} from "lucide-react";

interface Category {
  id?: number | null;
  name: string;
  imageUrl?: string;
}

export default function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const isEdit = !!category?.id && typeof category.id === "number";
  const [name, setName] = useState(category?.name ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(category?.imageUrl ?? "");
  const [errors, setErrors] = useState<ReturnType<typeof validateCategory>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  useEffect(() => {
    if (isEdit && !category?.id) {
      console.warn("CategoryForm: Edit mode but id is missing.");
    }
  }, [isEdit, category?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const errs = validateCategory({ name });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (isEdit && !category?.id) {
      setApiError("Không tìm thấy ID thể loại. Vui lòng quay lại trang danh sách và thử lại.");
      return;
    }

    setLoading(true);

    try {
      // Kiểm tra trùng tên thể loại trên client trước khi gửi lên server
      try {
        const existingCategories = await getAllCategories();
        const trimmedName = name.trim().toLowerCase();
        const duplicate = existingCategories.find(
          (c) => c.name.trim().toLowerCase() === trimmedName && (!isEdit || c.id !== category?.id)
        );

        if (duplicate) {
          setErrors({ name: "Tên thể loại này đã tồn tại. Vui lòng nhập tên khác." });
          setLoading(false);
          return;
        }
      } catch (checkErr) {
        console.warn("Lỗi khi kiểm tra danh sách thể loại trùng:", checkErr);
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const endpoint = isEdit
        ? `${API_BASE_URL}/api/categories/${category!.id}`
        : `${API_BASE_URL}/api/categories`;
      const method = isEdit ? "PUT" : "POST";

      const response = await authFetch(endpoint, {
        method,
        headers: {},
        body: formData,
      });

      if (response.ok) {
        const successMsg = isEdit
          ? "Cập nhật thành công."
          : "Thêm thể loại thành công.";
        router.push(`/admin/categories?success=${encodeURIComponent(successMsg)}`);
        router.refresh();
      } else {
        let errorText = "Có lỗi từ server. Vui lòng thử lại.";
        if (response.status === 401) {
          errorText = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        } else if (response.status === 403) {
          errorText = "Bạn không có quyền thực hiện thao tác này.";
        } else {
          try {
            const errorData = await response.json();
            if (errorData.message) errorText = errorData.message;
            else if (typeof errorData === "string") errorText = errorData;
            else if (Array.isArray(errorData)) errorText = errorData.join(", ");
          } catch {
            // Bỏ qua nếu response không phải JSON
          }
        }

        if (
          errorText.toLowerCase().includes("trùng") ||
          errorText.toLowerCase().includes("exist") ||
          errorText.toLowerCase().includes("already") ||
          response.status === 409
        ) {
          setErrors({ name: "Tên thể loại này đã tồn tại. Vui lòng nhập tên khác." });
        } else {
          setApiError(errorText);
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      setApiError("Không thể kết nối tới server. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 animate__animated animate__fadeIn font-sans">
      {/* Header */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-[#191c1e] font-sans">
          {isEdit ? "Cập Nhật Thể Loại" : "Thêm Thể Loại Mới"}
        </h2>
      </section>

      {/* Main Form Card */}
      <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
        {/* Header Block with linear gradient */}
        <div className="bg-gradient-to-r from-[#b70011] to-[#bf0715] p-5 text-white flex items-center gap-2.5">
          {isEdit ? (
            <Edit className="w-5.5 h-5.5" />
          ) : (
            <FolderPlus className="w-5.5 h-5.5" />
          )}
          <h3 className="font-bold text-sm uppercase tracking-wide">
            {isEdit ? `Chỉnh sửa: ${category?.name}` : "Thông tin hồ sơ thể loại"}
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

            {/* Input Tên Thể Loại */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Tên Thể Loại <span className="text-red-500">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Tag className="w-4.5 h-4.5 text-slate-400" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  style={{ paddingLeft: "2.5rem" }}
                  className={`w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none ${
                    errors.name ? "ring-2 ring-red-500" : ""
                  }`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors({});
                    setApiError(null);
                  }}
                  onBlur={() => setErrors(validateCategory({ name }))}
                  placeholder="Nhập tên thể loại (VD: Sách Kinh Tế, Tiểu Thuyết)..."
                  maxLength={50}
                  disabled={loading}
                />
              </div>
              {errors.name && <FieldError msg={errors.name} />}
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold px-0.5">
                <span>Nhập tên hiển thị chính thức của thể loại</span>
                <span>{name.length}/50</span>
              </div>
            </div>

            {/* Input Hình Ảnh Danh Mục */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Hình ảnh danh mục <span className="text-slate-400 font-normal text-xs">(Tùy chọn)</span>
              </label>
              <div style={{ position: "relative" }}>
                <ImageIcon className="w-4.5 h-4.5 text-slate-400" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id="categoryImage"
                  ref={fileInputRef}
                  type="file"
                  style={{ paddingLeft: "2.5rem" }}
                  className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-semibold px-0.5">
                Chọn ảnh đại diện (JPEG, PNG, WebP, tối đa 2MB). Nếu không chọn, ảnh cũ sẽ được giữ nguyên (khi sửa).
              </p>
              {previewUrl && (
                <div className="mt-3 flex items-center gap-3 bg-slate-50 p-2.5 border border-slate-200 rounded-lg w-fit">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-14 w-14 rounded-md object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-700 font-semibold bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                    onClick={handleRemoveImage}
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/admin/categories"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#b70011] text-white hover:bg-[#b70011]/90 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#b70011]/15 transition-all cursor-pointer border-0"
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