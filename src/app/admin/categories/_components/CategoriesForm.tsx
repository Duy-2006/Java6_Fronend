"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateCategory } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";

interface Category { id?: number | null; name: string }

export default function CategoryForm({ category }: { category?: Category }) {
  const isEdit = !!category?.id;
  const router = useRouter();

  const [name, setName]     = useState(category?.name ?? "");
  const [errors, setErrors] = useState<ReturnType<typeof validateCategory>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCategory({ name });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${category!.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        router.push(`/admin/categories?success=${encodeURIComponent(isEdit ? "Cập nhật thành công." : "Thêm thể loại thành công.")}`);
        router.refresh();
      } else { alert("Có lỗi từ server. Vui lòng thử lại."); }
    } catch { alert("Không thể kết nối tới server."); }
    finally { setLoading(false); }
  };

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-lg mt-4">
            <div className="card-header text-white py-3" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", borderRadius: "0.5rem 0.5rem 0 0" }}>
              <h5 className="m-0 fw-bold text-uppercase d-flex align-items-center">
                {isEdit ? <i className="fa-solid fa-pen-to-square me-2" /> : <i className="fa-solid fa-circle-plus me-2" />}
                {isEdit ? "Cập Nhật Thể Loại" : "Thêm Thể Loại Mới"}
              </h5>
            </div>

            <div className="card-body p-4 bg-white">
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary">
                    Tên Thể Loại <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="fa-solid fa-tag text-muted" /></span>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${errors.name ? "border-danger" : ""}`}
                      value={name}
                      onChange={e => { setName(e.target.value); setErrors({}); }}
                      onBlur={() => setErrors(validateCategory({ name }))}
                      placeholder="Ví dụ: Sách Kinh Tế, Tiểu Thuyết..."
                      maxLength={50}
                    />
                  </div>
                  <FieldError msg={errors.name} />
                  <div className="d-flex justify-content-between mt-1">
                    <div className="form-text text-muted small ms-1">Tên thể loại nên ngắn gọn và rõ nghĩa.</div>
                    <small className="text-muted">{name.length}/50</small>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-5">
                  <a href="/admin/categories" className="btn btn-light border fw-bold px-4">
                    <i className="fa-solid fa-arrow-left me-1" /> Quay lại
                  </a>
                  <button type="submit" disabled={loading} className="btn btn-primary fw-bold px-4 shadow-sm">
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