'use client'; // ✅ BẮT BUỘC để dùng hooks

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllCategories } from "@/services/categoriesService";
import DeleteCategoryButton from "@/app/admin/categories/_components/DeleteCategoryButton";

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // 1. Đọc thông báo từ URL khi mount
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) setAlert({ msg: success, type: 'success' });
    if (error) setAlert({ msg: error, type: 'error' });
    // Xóa params khỏi URL để không hiện lại khi refresh
    if (success || error) {
      router.replace('/admin/categories', { shallow: true });
    }
  }, [searchParams, router]);

  // 2. Tự động ẩn thông báo sau 1 giây
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 1000);
    return () => clearTimeout(timer);
  }, [alert]);

  // 3. Tải danh sách thể loại
  useEffect(() => {
    getAllCategories()
      .then(setCategories)
      .catch(() => setAlert({ msg: "Không thể tải danh sách thể loại.", type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5">Đang tải...</div>;

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {/* Hiển thị thông báo tự động ẩn */}
      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} me-2`} />
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close" />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        {/* Header giữ nguyên */}
        <div
          className="card-header text-white py-3 d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-layer-group fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Danh sách Thể Loại</h5>
          </div>
          <Link href="/admin/categories/new" className="btn btn-light text-primary fw-bold btn-sm shadow-sm">
            <i className="fa-solid fa-plus me-1" /> Thêm mới
          </Link>
        </div>

        {/* Table */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
              <thead>
                <tr
                  className="text-center text-uppercase small fw-bold text-secondary"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <th style={{ width: 80 }}>ID</th>
                  <th className="text-start">Tên Thể Loại</th>
                  <th style={{ width: 200 }}>Thống kê</th>
                  <th style={{ width: 150 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-folder-open fa-3x mb-3 opacity-25 d-block" />
                      <p className="m-0 fw-bold">Chưa có dữ liệu thể loại.</p>
                      <small>Hãy bấm "Thêm mới" để bắt đầu.</small>
                    </td>
                  </tr>
                ) : (
                  categories.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center fw-bold text-muted">{item.id}</td>
                      <td className="fw-bold" style={{ color: "var(--primary-blue)" }}>
                        {item.name}
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-light text-dark border border-secondary-subtle px-3 py-2">
                          <i className="fa-solid fa-book me-1 text-info" />
                          {item.books?.length ?? 0} đầu sách
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/admin/categories/${item.id}/edit`}
                            className="btn btn-outline-primary btn-sm"
                            title="Chỉnh sửa"
                          >
                            <i className="fa-solid fa-pen-to-square me-1" /> Sửa
                          </Link>
                          <DeleteCategoryButton categoryId={item.id} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}