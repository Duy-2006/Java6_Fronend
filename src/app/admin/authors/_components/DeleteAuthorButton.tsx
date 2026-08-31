"use client";
import { authFetch } from "@/lib/authFetch";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/app/admin/_components/ConfirmModal";

export default function DeleteAuthorButton({ authorId, bookCount, onSuccess }: { authorId: number, bookCount?: number, onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  const handleDeleteClick = () => {
    if (bookCount && bookCount > 0) {
      router.push("/admin/authors?error=" + encodeURIComponent("Không thể xóa tác giả này vì họ đang có sách trên hệ thống. Vui lòng xóa sách trước hoặc chuyển trạng thái tác giả sang Ẩn."));
      return;
    }
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!authorId) {
      router.push("/admin/authors?error=" + encodeURIComponent("ID tác giả không hợp lệ."));
      return;
    }

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
    <>
      <button
        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center justify-center border border-red-200/50 cursor-pointer"
        title="Xóa"
        onClick={handleDeleteClick}
        disabled={loading}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
        ) : (
          <Trash2 className="w-4.5 h-4.5" />
        )}
      </button>
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Xóa Tác Giả"
        message="Cảnh báo: Xóa tác giả sẽ ảnh hưởng đến các sách liên quan. Bạn chắc chắn muốn xóa?"
      />
    </>
  );
}