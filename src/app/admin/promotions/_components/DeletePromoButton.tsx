"use client";
import { isLoggedIn } from "@/lib/authFetch";

import { useState } from "react";
import { deletePromotion } from "@/services/promotionServices";
import { Trash2 } from "lucide-react";

interface Props {
  promoId:   number;
  onDeleted: () => void; // ✅ callback để parent tự refresh data
}

export default function DeletePromoButton({ promoId, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa khuyến mãi này?")) return;

    
    if (!isLoggedIn()) {
      alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    try {
      await deletePromotion(promoId);
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
      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent disabled:opacity-50"
      title="Xóa"
    >
      {loading ? (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent inline-block"></span>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}