"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateAuthor } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";

interface Author { id?: number | null; name: string; email?: string }

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

  const setField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra nếu edit nhưng thiếu id
    if (isEdit && !form.id) {
      alert("Lỗi: Không tìm thấy ID tác giả. Vui lòng quay lại trang danh sách.");
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
        router.push(
          `/admin/authors?success=${encodeURIComponent(
            isEdit ? "Cập nhật thành công." : "Thêm tác giả thành công."
          )}`
        );
        router.refresh();
      } else {
        const errorText = await res.text();
        alert(`Lỗi server: ${errorText}`);
      }
    } catch {
      alert("Không thể kết nối tới server. Vui lòng kiểm tra kết nối.");
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
                  <i className="fa-solid fa-pen-nib me-2" />
                ) : (
                  <i className="fa-solid fa-user-plus me-2" />
                )}
                {isEdit ? "Cập Nhật Hồ Sơ Tác Giả" : "Thêm Tác Giả Mới"}
              </h5>
            </div>

            <div className="card-body p-4 bg-white">
              <form onSubmit={handleSubmit} noValidate>
                {/* Tên */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary">
                    Tên Tác Giả <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="fa-solid fa-signature text-muted" />
                    </span>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${errors.name ? "is-invalid border-danger" : ""
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
                    />
                  </div>
                  <FieldError msg={errors.name} />
                  <div className="d-flex justify-content-end mt-1">
                    <small className="text-muted">{form.name.length}/100</small>
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary">
                    Email Liên Hệ (Tùy chọn)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="fa-solid fa-envelope text-muted" />
                    </span>
                    <input
                      type="email"
                      className={`form-control form-control-lg ${errors.email ? "border-danger" : ""
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
                    />
                  </div>
                  <FieldError msg={errors.email} />
                  <div className="form-text text-muted small mt-1 ms-1">
                    Email dùng để liên hệ bản quyền hoặc hợp tác.
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-5 pt-3 border-top">
                  <a
                    href="/admin/authors"
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
                        : "Lưu hồ sơ"}
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