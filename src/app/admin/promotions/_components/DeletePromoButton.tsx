"use client";
import { isLoggedIn } from "@/lib/authFetch";

import { useState } from "react";
import { deletePromotion } from "@/services/promotionServices";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/app/admin/_components/ConfirmModal";

interface Props {
  promoId: number;
  onDeleted: () => void; // callback để parent tự refresh data
}

export default function DeletePromoButton({ promoId, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!isLoggedIn()) {
      setErrorMsg("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    try {
      await deletePromotion(promoId);
      onDeleted(); //  gọi callback → parent tự gọi lại getData()
    } catch (err: any) {
      setErrorMsg(err.message || "Xóa thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
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

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Xóa Khuyến Mãi"
        message="Bạn có chắc chắn muốn xóa khuyến mãi này? Hành động này không thể hoàn tác."
      />

      {errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg z-[9999] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900 font-bold">×</button>
        </div>
      )}
    </>
  );
}