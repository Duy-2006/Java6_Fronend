'use client';

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllBooks } from "@/services/booksService";
import BookRow from "./_components/BookRow";

export default function BooksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Đọc thông báo từ URL
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) setAlert({ msg: success, type: 'success' });
    if (error) setAlert({ msg: error, type: 'error' });
    if (success || error) {
      router.replace('/admin/books', { shallow: true });
    }
  }, [searchParams, router]);

  // Tự động ẩn thông báo sau 1 giây
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 1000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Hàm tải lại danh sách sách
  const refreshBooks = async () => {
    setLoading(true);
    try {
      const data = await getAllBooks();
      setBooks(data);
    } catch {
      setAlert({ msg: "Không thể tải danh sách sách.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu lần đầu
  useEffect(() => {
    refreshBooks();
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
        <div className="card-header text-white py-3 d-flex justify-content-between align-items-center" style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}>
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-book-journal-whills fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Kho Sách</h5>
          </div>
          <Link href="/admin/books/new" className="btn btn-light text-primary fw-bold btn-sm shadow-sm">
            <i className="fa-solid fa-plus me-1" /> Nhập sách mới
          </Link>
        </div>

        <div className="card-body p-0">
          {books.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-box-open fa-3x mb-3 opacity-25 d-block" />
              <p className="m-0 fw-bold">Kho sách đang trống.</p>
              <small>Hãy nhập thêm đầu sách mới để bắt đầu kinh doanh.</small>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle mb-0">
                  <thead>
                    <tr className="text-center small fw-bold text-secondary bg-light">
                      <th style={{ width: 80 }}>Hình ảnh</th>
                      <th className="text-start">Thông tin sách</th>
                      <th style={{ width: 120 }}>Giá bán</th>
                      <th style={{ width: 100 }}>Tồn kho</th>
                      <th style={{ width: 150 }}>Thể loại</th>
                      <th style={{ width: 120 }}>Trạng thái</th>
                      <th style={{ width: 120 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <BookRow key={book.id} book={book} onRefresh={refreshBooks} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-footer bg-white border-0 py-3">
                <div className="small text-muted text-center">
                  Hiển thị toàn bộ <strong>{books.length}</strong> đầu sách trong kho.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}