"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  bookId: number;
  stock: number;
  usageLimit?: number | null;
}

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export default function AddToCartSection({ bookId, stock, usageLimit }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [cartQty, setCartQty] = useState(0);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const isOutOfStock = stock === 0;

  // Lấy số lượng sách này đã có trong giỏ hàng
  useEffect(() => {
    const fetchCartQty = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const cartItems = Array.isArray(data.cartItems) ? data.cartItems : data;
          const item = cartItems.find(
            (i: any) => (i.bookId ?? i.book?.id) === bookId
          );
          if (item) {
            const inCart = item.quantity ?? 0;
            setCartQty(inCart);
            if (stock - inCart <= 0) {
              setQty(0);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching cart quantity", e);
      }
    };
    fetchCartQty();
  }, [bookId, API_URL, stock]);

  const maxAddable = Math.max(0, stock - cartQty);

  const changeQty = (delta: number) => {
    if (delta > 0 && qty >= maxAddable) {
      showToast(
        "Đạt giới hạn: Số lượng sách trong giỏ và thêm mới đã đạt tối đa tồn kho.",
        "error"
      );
      return;
    }
    setQty((q) => Math.min(Math.max(maxAddable > 0 ? 1 : 0, q + delta), maxAddable));
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addToCart = async () => {
    if (isOutOfStock) {
      showToast("Sách đã hết hàng", "error");
      return;
    }

    if (qty <= 0 || qty > maxAddable) {
      showToast("Số lượng thêm không hợp lệ hoặc vượt quá giới hạn", "error");
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
        setCartQty((prev) => prev + qty);
        setQty((prev) => (maxAddable - qty > 0 ? 1 : 0));

        // update navbar cart
        window.dispatchEvent(new Event("cartUpdated"));

        // 👉 chuyển sang giỏ hàng
        setTimeout(() => {
          router.push("/user/cart");
        }, 800);
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
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold max-w-sm
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600 animate-shake"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Quantity */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold">Số lượng:</span>

          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => changeQty(-1)}
              disabled={qty <= 1 || isOutOfStock || maxAddable === 0}
              className="px-3 py-1 font-bold disabled:opacity-40"
            >
              −
            </button>

            <input
              value={qty}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) {
                  if (v > maxAddable) {
                    showToast(
                      "Đạt giới hạn: Số lượng sách trong giỏ và thêm mới đã đạt tối đa tồn kho.",
                      "error"
                    );
                    setQty(maxAddable);
                  } else {
                    setQty(
                      Math.min(Math.max(maxAddable > 0 ? 1 : 0, v), maxAddable)
                    );
                  }
                }
              }}
              className="w-12 text-center outline-none border-x text-sm"
              disabled={maxAddable === 0}
            />

            <button
              onClick={() => changeQty(1)}
              disabled={qty >= maxAddable || isOutOfStock || maxAddable === 0}
              className="px-3 py-1 font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>

          <span className="text-xs text-gray-400">({stock} có sẵn)</span>
        </div>

        {cartQty > 0 && (
          <span className="text-[11px] text-gray-500 font-medium">
            (Đã có <strong>{cartQty}</strong> cuốn trong giỏ hàng. Có thể thêm
            tối đa <strong>{maxAddable}</strong> cuốn)
          </span>
        )}
      </div>

      {/* Button */}
      <div className="pt-3">
        <button
          onClick={addToCart}
          disabled={
            loading ||
            isOutOfStock ||
            (maxAddable === 0 && getToken() !== null)
          }
          className="w-full bg-[#C92127] text-white py-3 px-6 rounded-full font-bold hover:bg-[#A8171C] transition duration-200 disabled:opacity-50 disabled:bg-gray-400 text-sm tracking-wide uppercase"
        >
          {isOutOfStock
            ? "Hết hàng"
            : maxAddable === 0 && getToken() !== null
            ? "Đã đạt giới hạn giỏ hàng"
            : loading
            ? "Đang thêm..."
            : "Thêm vào giỏ hàng"}
        </button>
      </div>
    </>
  );
}