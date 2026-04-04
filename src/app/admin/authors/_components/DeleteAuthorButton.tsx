"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteAuthorButton({ authorId }: { authorId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Cảnh báo: Xóa tác giả sẽ ảnh hưởng đến các sách liên quan. Bạn chắc chắn chứ?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/authors/${authorId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        router.push("/admin/authors?success=Đã xóa tác giả thành công.");
        router.refresh();
      } else {
        router.push("/admin/authors?error=Không thể xóa tác giả này.");
      }
    } catch {
      router.push("/admin/authors?error=Lỗi kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-outline-danger btn-sm"
      title="Xóa"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        />
      ) : (
        <i className="fa-solid fa-trash-can" />
      )}
    </button>
  );
}