"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteCategoryButton({ categoryId }: { categoryId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm("Cảnh báo: Bạn có chắc chắn muốn xóa thể loại này không?");
    if (!confirmed) return;

    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${baseUrl}/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/categories?success=" + encodeURIComponent("Đã xóa thể loại thành công."));
        router.refresh();
      } else {
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