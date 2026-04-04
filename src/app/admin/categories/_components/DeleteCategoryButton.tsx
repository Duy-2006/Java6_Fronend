"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCategoryButton({ categoryId }: { categoryId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Cảnh báo: Bạn có chắc chắn muốn xóa thể loại này không?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${categoryId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        router.push("/admin/categories?success=" + encodeURIComponent("Đã xóa thể loại thành công."));
        router.refresh();
      } else {
        router.push("/admin/categories?error=" + encodeURIComponent("Không thể xóa thể loại này."));
      }
    } catch {
      router.push("/admin/categories?error=" + encodeURIComponent("Lỗi kết nối tới server."));
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
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      ) : (
        <i className="fa-solid fa-trash-can" />
      )}
    </button>
  );
}