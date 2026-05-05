'use client';

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllAuthors } from "@/services/authorsService";
import DeleteAuthorButton from "./_components/DeleteAuthorButton";

export default function AuthorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Đọc thông báo từ URL khi mount
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) setAlert({ msg: success, type: 'success' });
    if (error) setAlert({ msg: error, type: 'error' });
    // Xóa params khỏi URL để không hiện lại khi refresh
    if (success || error) {
      router.replace('/admin/authors', { shallow: true });
    }
  }, [searchParams, router]);

  // Tự động ẩn thông báo sau 1 giây
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 1000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Tải danh sách tác giả
  useEffect(() => {
    getAllAuthors()
      .then(setAuthors)
      .catch(() => setAlert({ msg: "Không thể tải danh sách tác giả.", type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5">Đang tải...</div>;

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} me-2`} />
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close" />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        {/* Header giữ nguyên */}
        <div className="card-header text-white py-3 d-flex justify-content-between align-items-center" style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}>
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-user-pen fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Danh sách Tác Giả</h5>
          </div>
          <Link href="/admin/authors/new" className="btn btn-light text-primary fw-bold btn-sm shadow-sm">
            <i className="fa-solid fa-plus me-1" /> Thêm mới
          </Link>
        </div>

        {/* Table giữ nguyên, chỉ bỏ phần xử lý success/error cũ */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
              <thead>
                <tr className="text-center text-uppercase small fw-bold text-secondary" style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ width: 80 }}>ID</th>
                  <th className="text-start">Tên Tác Giả</th>
                  <th className="text-start">Email Liên Hệ</th>
                  <th style={{ width: 180 }}>Thống kê</th>
                  <th style={{ width: 150 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {authors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-feather fa-3x mb-3 opacity-25 d-block" />
                      <p className="m-0 fw-bold">Chưa có dữ liệu tác giả.</p>
                      <small>Hãy thêm tác giả mới để bắt đầu quản lý sách.</small>
                    </td>
                  </tr>
                ) : (
                  authors.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center fw-bold text-muted">{item.id}</td>
                      <td className="fw-bold" style={{ color: "var(--primary-blue)" }}>
                        <i className="fa-regular fa-id-card me-2 text-muted opacity-50" />
                        {item.name}
                      </td>
                      <td className="text-start text-muted">
                        {item.email ? (
                          <>
                            <i className="fa-regular fa-envelope me-1 small" />
                            {item.email}
                          </>
                        ) : (
                          <span className="text-muted small fst-italic">(Chưa cập nhật)</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-white text-primary border border-primary-subtle px-3 py-2 shadow-sm">
                          <i className="fa-solid fa-book-open me-1" />
                          {item.bookCount ?? 0} tác phẩm
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Link href={`/admin/authors/${item.id}/edit`} className="btn btn-outline-primary" title="Chỉnh sửa">
                            <i className="fa-solid fa-pen-to-square" />Sửa 
                          </Link>
                          <DeleteAuthorButton authorId={item.id} />
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