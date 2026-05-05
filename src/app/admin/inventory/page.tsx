// app/admin/inventory/page.tsx
'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllInventoryBooks, getInventoryLogs, getLowStockBooks, BookInventory, InventoryLog } from "@/services/inventoryService";
import ImportModal from "./_components/ImportModal";

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [books, setBooks] = useState<BookInventory[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<BookInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Đọc thông báo từ URL (nếu có)
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) setAlert({ msg: success, type: 'success' });
    if (error) setAlert({ msg: error, type: 'error' });
    if (success || error) {
      router.replace('/admin/inventory', { shallow: true });
    }
  }, [searchParams, router]);

  // Tự động ẩn thông báo sau 1.5s
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 1500);
    return () => clearTimeout(timer);
  }, [alert]);

  // Tải dữ liệu
  const refreshData = async () => {
    setLoading(true);
    try {
      const [booksData, logsData, lowData] = await Promise.all([
        getAllInventoryBooks(),
        getInventoryLogs(),
        getLowStockBooks(10),
      ]);
      setBooks(booksData);
      setLogs(logsData);
      setLowStockBooks(lowData);
    } catch (err: any) {
      setAlert({ msg: err.message || "Không thể tải dữ liệu kho.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (loading) {
    return <div className="text-center py-5">Đang tải dữ liệu kho...</div>;
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show shadow-sm mb-3`} role="alert">
          <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} me-2`} />
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} />
        </div>
      )}

      {/* Cảnh báo tồn kho thấp */}
      {lowStockBooks.length > 0 && (
        <div className="alert alert-warning shadow-sm border-warning d-flex align-items-center mb-4">
          <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: 50, height: 50, flexShrink: 0 }}>
            <i className="fa-solid fa-bell fa-xl" />
          </div>
          <div>
            <h6 className="fw-bold mb-1 text-dark">Cảnh báo tồn kho</h6>
            <small className="text-dark">
              Có <strong>{lowStockBooks.length}</strong> sách dưới định mức (10 cuốn). Vui lòng nhập thêm ngay!
            </small>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Bảng tồn kho */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header text-white py-3 border-0" style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))", borderRadius: "0.5rem 0.5rem 0 0" }}>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0 fw-bold text-uppercase">
                  <i className="fa-solid fa-boxes-stacked me-2" />Danh Sách Tồn Kho
                </h6>
                <span className="badge bg-white text-primary rounded-pill">{books.length} sách</span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: 600 }}>
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light sticky-top">
                    <tr className="text-secondary small text-uppercase fw-bold">
                      <th className="ps-4">Sách</th>
                      <th className="text-center">Tồn kho</th>
                      <th className="text-end pe-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-muted">Chưa có dữ liệu sách</td>
                      </tr>
                    ) : (
                      books.map((book) => {
                        const imgSrc = book.imageUrl
                          ? `${API_BASE}/uploads/books/${book.imageUrl}`
                          : "/images/book-default.jpg";
                        return (
                          <tr key={book.id}>
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div className="position-relative">
                                  <img src={imgSrc} alt={book.title} className="rounded border shadow-sm" style={{ width: 45, height: 65, objectFit: "cover" }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/45x65?text=N/A"; }} />
                                  {book.quantity === 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white">Hết</span>
                                  )}
                                </div>
                                <div className="ms-3">
                                  <div className="fw-bold text-dark">{book.title}</div>
                                  <small className="text-muted fst-italic">ISBN: {book.isbn}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              <span className={`badge rounded-pill fs-6 fw-normal px-3 py-2 ${book.quantity < 10 ? "bg-danger-subtle text-danger border border-danger-subtle" : "bg-success-subtle text-success border border-success-subtle"}`}>
                                {book.quantity}
                              </span>
                            </td>
                            <td className="text-end pe-4">
                              <ImportModal bookId={book.id} bookTitle={book.title} onSuccess={refreshData} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Lịch sử giao dịch */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header text-white py-3 border-0" style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))", borderRadius: "0.5rem 0.5rem 0 0" }}>
              <h6 className="m-0 fw-bold text-uppercase">
                <i className="fa-solid fa-clock-rotate-left me-2" />Lịch sử Giao dịch
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: 600 }}>
                <table className="table table-striped table-hover align-middle mb-0 small">
                  <thead className="bg-light sticky-top">
                    <tr>
                      <th className="ps-3">Thời gian</th>
                      <th>Sách</th>
                      <th className="text-center">Thay đổi</th>
                      <th>Loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-4 text-muted fst-italic">Chưa có dữ liệu lịch sử.</td></tr>
                    ) : (
                      logs.map((log, idx) => {
                        const date = new Date(log.logDate);
                        const dateStr = date.toLocaleDateString("vi-VN");
                        const timeStr = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                        const isImport = log.type === "IMPORT";
                        return (
                          <tr key={idx}>
                            <td className="ps-3 text-muted">
                              <span className="fw-bold d-block text-dark">{dateStr}</span>
                              <span>{timeStr}</span>
                            </td>
                            <td>
                              <span className="d-block text-truncate fw-bold text-primary" style={{ maxWidth: 130 }}>
                                {log.bookTitle || "Không xác định"}
                              </span>
                            </td>
                            <td className="text-center fw-bold fs-6">
                              {isImport ? <span className="text-success">+{log.changeAmount}</span> : <span className="text-danger">-{log.changeAmount}</span>}
                            </td>
                            <td>
                              <span className={`badge ${isImport ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                                {isImport ? "Nhập kho" : "Xuất bán"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}