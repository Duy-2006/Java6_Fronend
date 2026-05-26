"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

export default function RestoreBookButton({ bookId, onSuccess }: { bookId: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleRestore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/books/${bookId}/restore`, { method: "PUT" });
      if (res.ok) {
        onSuccess(); // Gọi callback refresh
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
    <button
      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center border border-emerald-200/50 cursor-pointer"
      title="Hiển thị sách"
      onClick={handleRestore}
      disabled={loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>
  );
}