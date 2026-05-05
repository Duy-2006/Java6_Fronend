"use client";

import { useState } from "react";

export default function DeleteBookButton({ bookId, onSuccess }: { bookId: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleDelete = async () => {
    if (!confirm("Ẩn sách này khỏi hệ thống bán hàng?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/books/${bookId}`, { method: "DELETE" });
      if (res.ok) {
        onSuccess(); //  Gọi callback để refresh danh sách
      } else {
        let errorMsg = "Không thể ẩn sách.";
        try {
          const text = await res.text();
          if (text.startsWith("{")) errorMsg = JSON.parse(text).message || errorMsg;
          else if (text.length < 200) errorMsg = text;
        } catch {}
        alert(errorMsg);
      }
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn btn-outline-danger btn-sm" onClick={handleDelete} disabled={loading}>
      {loading ? <span className="spinner-border spinner-border-sm" /> : <><i className="fa-solid fa-eye-slash me-1"></i> Ẩn</>}
    </button>
  );
}