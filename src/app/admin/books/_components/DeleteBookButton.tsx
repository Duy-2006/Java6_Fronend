"use client";

import { useState } from "react";
import { EyeOff } from "lucide-react";

export default function DeleteBookButton({ bookId, onSuccess }: { bookId: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/books/${bookId}`, { method: "DELETE" });
      if (res.ok) {
        onSuccess(); // Gọi callback để refresh danh sách
      } else {
        let errorMsg = "Không thể ẩn sách.";
        try {
          const text = await res.text();
          if (text.startsWith("{")) errorMsg = JSON.parse(text).message || errorMsg;
          else if (text.length < 200) errorMsg = text;
        } catch { }
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
      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center justify-center border border-red-200/50 cursor-pointer"
      title="Ẩn sách"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
      ) : (
        <EyeOff className="w-4 h-4" />
      )}
    </button>
  );
}