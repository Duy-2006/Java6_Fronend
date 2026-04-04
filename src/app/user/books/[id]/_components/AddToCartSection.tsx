"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  bookId: number;
  stock:  number;
}

export default function AddToCartSection({ bookId, stock }: Props) {
  const router = useRouter();
  const [qty, setQty]       = useState(1);
  const [toast, setToast]   = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const changeQty = (delta: number) => {
    setQty(q => Math.min(Math.max(1, q + delta), stock));
  };

  const showToast = (msg: string, type: "success"|"error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookId, quantity: qty }),
      });
      if (res.ok) {
        showToast(`Đã thêm ${qty} cuốn vào giỏ hàng!`, "success");
      } else if (res.status === 401) {
        router.push("/auth/login");
      } else {
        showToast("Không thể thêm vào giỏ hàng.", "error");
      }
    } catch {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setLoading(false);
    }
  };

  const buyNow = async () => {
    await addToCart();
    router.push("/cart");
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all animate-fade-in
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-bold text-gray-700">Số lượng:</span>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => changeQty(-1)}
            className="px-4 py-2 hover:bg-gray-100 transition font-bold text-lg text-gray-600 select-none"
            disabled={qty <= 1}
          >−</button>
          <input
            type="text"
            value={qty}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) setQty(Math.min(Math.max(1, v), stock));
            }}
            className="w-12 text-center text-sm font-bold border-x outline-none py-2"
          />
          <button
            onClick={() => changeQty(1)}
            className="px-4 py-2 hover:bg-gray-100 transition font-bold text-lg text-gray-600 select-none"
            disabled={qty >= stock}
          >+</button>
        </div>
        <span className="text-xs text-gray-400">({stock} sản phẩm có sẵn)</span>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={addToCart}
          disabled={loading || stock === 0}
          className="flex-1 min-w-[200px] border-2 border-red-600 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
          {loading ? "Đang thêm..." : "Thêm vào giỏ hàng"}
        </button>
        <button
          onClick={buyNow}
          disabled={loading || stock === 0}
          className="flex-1 min-w-[200px] bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {stock === 0 ? "Hết hàng" : "Mua ngay"}
        </button>
      </div>
    </>
  );
}