"use client";
import { authFetch } from "@/lib/authFetch";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateCategory } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";

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
      const formData = new FormData();
      formData.append("name", name);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const endpoint = isEdit
        ? `${API_BASE_URL}/api/categories/${category!.id}`
        : `${API_BASE_URL}/api/categories`;
      const method = isEdit ? "PUT" : "POST";

      const response = await authFetch(endpoint, {
        method,
        headers: {
          },
        body: formData, // Không set Content-Type, browser tự thêm boundary
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
            else if (Array.isArray(errorData)) errorText = errorData.join(", ");
          } catch {
            // Bỏ qua nếu response không phải JSON
          }
        }
        setApiError(errorText);
      }
    } catch (err) {
      console.error("Network error:", err);
      setApiError("Không thể kết nối tới server. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-lg mt-4">
            <div
              className="card-header text-white py-3 bg-gradient-to-br from-[#b70011] to-[#8a000d] rounded-t-lg"
            >
              <h5 className="m-0 fw-bold text-uppercase d-flex align-items-center">
                {isEdit ? (
                  <i className="fa-solid fa-pen-to-square me-2" />
                ) : (
                  <i className="fa-solid fa-circle-plus me-2" />
                )}
                {isEdit ? "Cập Nhật Thể Loại" : "Thêm Thể Loại Mới"}
              </h5>
            </div>

            <div className="card-body p-4 bg-white">
              <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
                {apiError && (
                  <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    {apiError}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setApiError(null)}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="categoryName" className="form-label fw-bold text-secondary">
                    Tên Thể Loại <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="fa-solid fa-tag text-muted" />
                    </span>
                    <input
                      id="categoryName"
                      type="text"
                      className={`form-control form-control-lg ${errors.name ? "border-danger" : ""}`}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors({});
                        setApiError(null);
                      }}
                      onBlur={() => setErrors(validateCategory({ name }))}
                      placeholder="Ví dụ: Sách Kinh Tế, Tiểu Thuyết..."
                      maxLength={50}
                      disabled={loading}
                    />
                  </div>
                  <FieldError msg={errors.name} />
                  <div className="d-flex justify-content-between mt-1">
                    <div className="form-text text-muted small ms-1">
                      Tên thể loại nên ngắn gọn và rõ nghĩa.
                    </div>
                    <small className="text-muted">{name.length}/50</small>
                  </div>
                </div>

                {/* Upload ảnh */}
                <div className="mb-4">
                  <label htmlFor="categoryImage" className="form-label fw-bold text-secondary">Hình ảnh danh mục</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="fa-solid fa-image text-muted" />
                    </span>
                    <input
                      id="categoryImage"
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-text text-muted small mt-1">
                    Chọn ảnh đại diện (JPEG, PNG, WebP, tối đa 2MB). Nếu không chọn, ảnh cũ sẽ được giữ nguyên (khi sửa).
                  </div>
                  {previewUrl && (
                    <div className="mt-3 d-flex align-items-start gap-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="img-thumbnail max-h-[120px] max-w-[120px] object-cover"
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRemoveImage}
                      >
                        <i className="fa-solid fa-trash-alt me-1"></i> Xóa ảnh
                      </button>
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2 justify-content-end mt-5">
                  <a href="/admin/categories" className="btn btn-light border fw-bold px-4">
                    <i className="fa-solid fa-arrow-left me-1" /> Quay lại
                  </a>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary fw-bold px-4 shadow-sm"
                  >
                    <i className="fa-solid fa-floppy-disk me-1" />
                    {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}