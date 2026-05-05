"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCategoryButton({ categoryId }: { categoryId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm("Cảnh báo: Bạn có chắc chắn muốn xóa thể loại này không?");
    if (!confirmed) return;

    setLoading(true);
    try {
      //  Thêm fallback URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${baseUrl}/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/categories?success=" + encodeURIComponent("Đã xóa thể loại thành công."));
        router.refresh();
      } else {
        //  Lấy nội dung lỗi từ backend để hiển thị chi tiết
        const errorText = await res.text();
        router.push("/admin/categories?error=" + encodeURIComponent(errorText || "Không thể xóa thể loại này."));
      }
    } catch (err) {
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
      <>
        <i className="fa-solid fa-trash-can me-1" /> Xóa
      </>
    )}
  </button>
);
}