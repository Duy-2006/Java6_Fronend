"use client";

import { useState } from "react";

export default function RestoreBookButton({ bookId, onSuccess }: { bookId: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleRestore = async () => {
    if (!confirm("Bật sách này để kinh doanh lại?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/books/${bookId}/restore`, { method: "PUT" });
      if (res.ok) {
        onSuccess(); // ✅ Gọi callback refresh
      } else {
        let errorMsg = "Không thể bật sách.";
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
    <button className="btn btn-outline-success btn-sm" onClick={handleRestore} disabled={loading}>
      {loading ? <span className="spinner-border spinner-border-sm" /> : <><i className="fa-solid fa-eye me-1"></i> Mở</>}
    </button>
  );
}