"use client";

import { useState } from "react";
import { importStock } from "@/services/inventoryService";

interface Props {
  bookId: number;
  bookTitle: string;
  onSuccess: () => void; // callback để refresh danh sách sau khi nhập kho
}

export default function ImportModal({ bookId, bookTitle, onSuccess }: Props) {
  const [show, setShow] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) return;

    setLoading(true);
    setError("");
    try {
      await importStock({ bookId, quantity, note: note.trim() || undefined });
      setShow(false);
      setQuantity(10);
      setNote("");
      onSuccess(); // gọi refresh dữ liệu từ trang cha
    } catch (err: any) {
      setError(err.message || "Nhập kho thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        className="btn btn-sm btn-outline-primary fw-bold shadow-sm"
        onClick={() => setShow(true)}
      >
        <i className="fa-solid fa-dolly me-1" /> Nhập hàng
      </button>

      {/* Modal overlay */}
      {show && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShow(false)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div
                  className="modal-header text-white"
                  style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}
                >
                  <h5 className="modal-title fw-bold">
                    <i className="fa-solid fa-circle-plus me-2" />Nhập Kho Sách
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShow(false)}
                  />
                </div>

                {/* Body */}
                <div className="modal-body p-4">
                  {/* Tên sách (readonly) */}
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-bold small text-uppercase">
                      Sách được chọn
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fa-solid fa-book text-primary" />
                      </span>
                      <input
                        type="text"
                        className="form-control bg-light fw-bold text-dark border-start-0"
                        value={bookTitle}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="row">
                    {/* Số lượng */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-secondary fw-bold small text-uppercase">
                        Số lượng nhập <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control fw-bold text-success"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        required
                      />
                    </div>
                    {/* Người nhập (có thể lấy từ token hoặc để admin) */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-secondary fw-bold small text-uppercase">
                        Người nhập
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value="Admin"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-bold small text-uppercase">
                      Ghi chú nhập hàng
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Ví dụ: Nhập hàng đợt 1 tháng 10..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {/* Hiển thị lỗi nếu có */}
                  {error && (
                    <div className="alert alert-danger py-2 small">
                      <i className="fa-solid fa-circle-exclamation me-1" /> {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-light fw-bold"
                    onClick={() => setShow(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary fw-bold px-4 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))",
                      border: "none",
                    }}
                  >
                    <i className="fa-solid fa-check me-1" />
                    {loading ? "Đang xử lý..." : "Xác nhận"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}