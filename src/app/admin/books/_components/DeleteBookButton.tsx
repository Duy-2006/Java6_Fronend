"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteBookButton({ bookId }: { bookId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Cảnh báo: Hành động này sẽ ẩn sách khỏi hệ thống bán hàng. Tiếp tục?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/books/${bookId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        router.push("/admin/books?success=Đã xóa sách thành công.");
        router.refresh();
      } else {
        router.push("/admin/books?error=Không thể xóa sách này.");
      }
    } catch {
      router.push("/admin/books?error=Lỗi kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-outline-danger btn-sm"
      title="Xóa / Ẩn"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      ) : (
        <i className="fa-solid fa-trash-can" />
      )}
    </button>
  );
}