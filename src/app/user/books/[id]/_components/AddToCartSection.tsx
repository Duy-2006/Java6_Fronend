"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  bookId: number;
  stock: number;
}

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export default function AddToCartSection({ bookId, stock }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const isOutOfStock = stock === 0;

  const changeQty = (delta: number) => {
    setQty((q) => Math.min(Math.max(1, q + delta), stock));
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = async () => {
    if (isOutOfStock) {
      showToast("Sách đã hết hàng", "error");
      return;
    }

    const token = getToken();
    if (!token) {
      showToast("Vui lòng đăng nhập", "error");
      router.push("/auth/login");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId,
          quantity: qty,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`Đã thêm ${qty} cuốn vào giỏ hàng`, "success");

        // update navbar cart
        window.dispatchEvent(new Event("cartUpdated"));

        // 👉 chuyển sang giỏ hàng
        setTimeout(() => {
          router.push("/user/cart");
        }, 500);
      } else if (res.status === 401) {
        showToast("Hết phiên đăng nhập", "error");
        router.push("/auth/login");
      } else {
        showToast(data.message || "Lỗi thêm giỏ hàng", "error");
      }
    } catch (error) {
      showToast("Không kết nối được server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold">Số lượng:</span>

        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => changeQty(-1)}
            disabled={qty <= 1 || isOutOfStock}
            className="px-3 py-1"
          >
            −
          </button>

          <input
            value={qty}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) {
                setQty(Math.min(Math.max(1, v), stock));
              }
            }}
            className="w-12 text-center outline-none"
          />

          <button
            onClick={() => changeQty(1)}
            disabled={qty >= stock || isOutOfStock}
            className="px-3 py-1"
          >
            +
          </button>
        </div>

        <span className="text-xs text-gray-400">
          ({stock} có sẵn)
        </span>
      </div>

      {/* Button */}
      <div className="pt-3">
        <button
          onClick={addToCart}
          disabled={loading || isOutOfStock}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
        >
          {isOutOfStock
            ? "Hết hàng"
            : loading
            ? "Đang thêm..."
            : "Thêm vào giỏ hàng"}
        </button>
      </div>
    </>
  );
}