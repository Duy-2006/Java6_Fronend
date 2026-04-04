"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePromoButton({ promoId }: { promoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/promotions/${promoId}`,
        { method: "DELETE" }
      );
      if (res.ok) router.refresh();
      else alert("Xóa thất bại.");
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        marginRight: 6, fontSize: 13, padding: "6px 10px",
        borderRadius: 8, border: "1px solid #d1d5db",
        color: "#dc2626", background: "none", cursor: "pointer",
      }}
    >
      {loading ? "..." : "Xóa"}
    </button>
  );
}