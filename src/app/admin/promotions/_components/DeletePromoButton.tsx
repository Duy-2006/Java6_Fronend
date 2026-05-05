"use client";

import { useState } from "react";
import { deletePromotion } from "@/services/promotionServices";

interface Props {
  promoId:   number;
  onDeleted: () => void; // ✅ callback để parent tự refresh data
}

export default function DeletePromoButton({ promoId, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa khuyến mãi này?")) return;

    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token")      ||
      "";

    if (!token) {
      alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    try {
      await deletePromotion(promoId, token);
      onDeleted(); // ✅ gọi callback → parent tự gọi lại getData()
    } catch (err: any) {
      alert(err.message || "Xóa thất bại.");
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