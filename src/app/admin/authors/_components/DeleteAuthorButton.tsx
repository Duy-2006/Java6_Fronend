"use client";
import { authFetch } from "@/lib/authFetch";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteAuthorButton({ authorId, onSuccess }: { authorId: number, onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  const handleDelete = async () => {
    if (!authorId) {
      router.push("/admin/authors?error=" + encodeURIComponent("ID tác giả không hợp lệ."));
      return;
    }

    const confirmed = window.confirm(
      "Cảnh báo: Xóa tác giả sẽ ảnh hưởng đến các sách liên quan. Bạn chắc chắn muốn xóa?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/admin/authors/${authorId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        router.push("/admin/authors?success=" + encodeURIComponent("Đã xóa tác giả thành công."));
        router.refresh();
      } else {
        const errorText = await res.text();
        router.push(`/admin/authors?error=${encodeURIComponent(errorText || "Không thể xóa tác giả này.")}`);
      }
    } catch {
      router.push("/admin/authors?error=" + encodeURIComponent("Lỗi kết nối tới server."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center justify-center border border-red-200/50 cursor-pointer"
      title="Xóa"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
      ) : (
        <Trash2 className="w-4.5 h-4.5" />
      )}
    </button>
  );
}