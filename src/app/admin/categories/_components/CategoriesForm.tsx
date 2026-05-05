"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateCategory } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";

interface Category {
  id?: number | null;
  name: string;
}

export default function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();

  // Xác định chế độ: edit chỉ khi có id hợp lệ
  const isEdit = !!category?.id && typeof category.id === "number";
  const [name, setName] = useState(category?.name ?? "");
  const [errors, setErrors] = useState<ReturnType<typeof validateCategory>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Lấy base URL từ biến môi trường, có fallback cho development
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Nếu đang ở chế độ edit nhưng không có id, chuyển sang chế độ tạo mới (tránh lỗi undefined)
  useEffect(() => {
    if (isEdit && !category?.id) {
      console.warn("CategoryForm: Edit mode but id is missing. Switching to create mode.");
      // Có thể chuyển hướng hoặc chỉ log, ở đây ta không ép buộc thay đổi state.
      // Tuy nhiên, để an toàn, ta sẽ không cho phép submit khi thiếu id.
    }
  }, [isEdit, category?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Validate dữ liệu
    const errs = validateCategory({ name });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Kiểm tra thêm nếu là edit nhưng thiếu id
    if (isEdit && !category?.id) {
      setApiError("Không tìm thấy ID thể loại. Vui lòng quay lại trang danh sách và thử lại.");
      return;
    }

    setLoading(true);

    try {
      // Xây dựng URL dựa trên chế độ
      const endpoint = isEdit
        ? `${API_BASE_URL}/api/categories/${category!.id}`
        : `${API_BASE_URL}/api/categories`;

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const successMsg = isEdit
          ? "Cập nhật thành công."
          : "Thêm thể loại thành công.";
        router.push(`/admin/categories?success=${encodeURIComponent(successMsg)}`);
        router.refresh();
      } else {
        // Xử lý lỗi từ server chi tiết hơn
        let errorText = "Có lỗi từ server. Vui lòng thử lại.";
        try {
          const errorData = await response.json();
          if (errorData.message) errorText = errorData.message;
          else if (Array.isArray(errorData)) errorText = errorData.join(", ");
        } catch {
          // Nếu response không phải JSON, giữ nguyên errorText
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
              className="card-header text-white py-3"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                borderRadius: "0.5rem 0.5rem 0 0",
              }}
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
              <form onSubmit={handleSubmit} noValidate>
                {/* Hiển thị lỗi API nếu có */}
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
                  <label className="form-label fw-bold text-secondary">
                    Tên Thể Loại <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="fa-solid fa-tag text-muted" />
                    </span>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${
                        errors.name ? "border-danger" : ""
                      }`}
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

                <div className="d-flex gap-2 justify-content-end mt-5">
                  <a
                    href="/admin/categories"
                    className="btn btn-light border fw-bold px-4"
                  >
                    <i className="fa-solid fa-arrow-left me-1" /> Quay lại
                  </a>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary fw-bold px-4 shadow-sm"
                  >
                    <i className="fa-solid fa-floppy-disk me-1" />
                    {loading
                      ? "Đang lưu..."
                      : isEdit
                      ? "Cập nhật"
                      : "Lưu mới"}
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