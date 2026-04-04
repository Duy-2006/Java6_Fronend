"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  cartDetailId: number;
  bookId:       number;
  title:        string;
  imageUrl:     string;
  price:        number;
  quantity:     number;
  selected:     boolean;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " đ";

export default function CartClient() {
  const router = useRouter();
  const [items,   setItems]   = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* Fetch cart */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  /* Helpers */
  const selectedItems = items.filter(i => i.selected);
  const subTotal      = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const allChecked    = items.length > 0 && items.every(i => i.selected);

  const toggleAll = async (checked: boolean) => {
    const next = items.map(i => ({ ...i, selected: checked }));
    setItems(next);
    await Promise.all(next.map(i =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/select`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartDetailId: i.cartDetailId, selected: checked }),
      })
    ));
  };

  const toggleOne = async (id: number, checked: boolean) => {
    setItems(prev => prev.map(i => i.cartDetailId === id ? { ...i, selected: checked } : i));
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/select`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartDetailId: id, selected: checked }),
    });
  };

  const updateQty = async (id: number, delta: number) => {
    const item = items.find(i => i.cartDetailId === id);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    setItems(prev => prev.map(i => i.cartDetailId === id ? { ...i, quantity: newQty } : i));
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/update`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartDetailId: id, quantity: newQty }),
    });
  };

  const removeItem = async (id: number) => {
    if (!confirm("Xác nhận xóa sản phẩm khỏi giỏ hàng?")) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cartDetailId=${id}`,
    });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.cartDetailId !== id));
      showToast("Đã xóa sản phẩm khỏi giỏ hàng.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="bg-[#f0f0f0] min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span> {toast}
        </div>
      )}

      <div className="max-w-[1230px] mx-auto px-4 pt-6 pb-20">
        <h2 className="text-xl font-bold uppercase mb-4">
          Giỏ hàng{" "}
          <span className="text-sm font-normal lowercase text-gray-500">({items.length} sản phẩm)</span>
        </h2>

        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT: Cart items */}
          <div className="lg:w-2/3 space-y-3">

            {/* Select all header */}
            {items.length > 0 && (
              <div className="bg-white p-4 rounded-xl shadow-sm hidden md:flex items-center text-sm font-bold text-gray-600">
                <div className="w-1/2 flex items-center gap-3">
                  <input type="checkbox" checked={allChecked}
                    onChange={e => toggleAll(e.target.checked)}
                    className="w-4 h-4 accent-red-600 cursor-pointer" />
                  <span>Chọn tất cả</span>
                </div>
                <div className="w-1/4 text-center">Số lượng</div>
                <div className="w-1/4 text-right">Thành tiền</div>
              </div>
            )}

            {/* Empty */}
            {items.length === 0 && (
              <div className="bg-white p-20 rounded-2xl shadow-sm text-center">
                <p className="text-6xl mb-4">🛒</p>
                <p className="text-gray-500 mb-6">Chưa có sản phẩm nào trong giỏ hàng.</p>
                <Link href="/" className="bg-red-600 text-white px-10 py-2.5 rounded-xl font-bold uppercase text-sm hover:bg-red-700 transition">
                  Mua sắm ngay
                </Link>
              </div>
            )}

            {/* Items */}
            {items.map(item => (
              <div key={item.cartDetailId}
                className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">

                {/* Checkbox + Image + Info */}
                <div className="flex items-center w-full md:w-1/2 gap-3">
                  <input type="checkbox" checked={item.selected}
                    onChange={e => toggleOne(item.cartDetailId, e.target.checked)}
                    className="w-4 h-4 accent-red-600 cursor-pointer flex-shrink-0" />
                  <div className="flex gap-4">
                    <img src={item.imageUrl || "/images/book-default.jpg"} alt={item.title}
                      className="w-20 h-28 object-contain border rounded-xl p-1 bg-gray-50 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                    />
                    <div className="flex flex-col justify-between py-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">{item.title}</p>
                      <div className="mt-2">
                        <span className="text-base font-bold text-gray-900">{fmt(item.price)}</span>
                        <span className="text-xs text-gray-400 line-through block">{fmt(Math.round(item.price * 1.2))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qty control */}
                <div className="w-full md:w-1/4 flex justify-center">
                  <div className="flex items-center border border-gray-200 rounded-xl h-9 overflow-hidden">
                    <button onClick={() => updateQty(item.cartDetailId, -1)}
                      className="w-9 h-full bg-white hover:bg-gray-100 text-gray-500 border-r transition font-bold text-lg select-none"
                      disabled={item.quantity <= 1}>−</button>
                    <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.cartDetailId, 1)}
                      className="w-9 h-full bg-white hover:bg-gray-100 text-gray-500 border-l transition font-bold text-lg select-none">+</button>
                  </div>
                </div>

                {/* Subtotal + Delete */}
                <div className="w-full md:w-1/4 flex flex-col items-end gap-2">
                  <span className="text-red-600 font-bold text-base">{fmt(item.price * item.quantity)}</span>
                  <button onClick={() => removeItem(item.cartDetailId)}
                    className="text-gray-300 hover:text-red-500 transition" title="Xóa">
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:w-1/3 space-y-3">
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">

              {/* Coupon row */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-xl">confirmation_number</span>
                  <span className="text-sm font-bold">Khuyến mãi</span>
                </div>
                <a href="#" className="text-blue-500 text-xs flex items-center gap-0.5 hover:underline">
                  Xem thêm <span className="material-symbols-outlined text-xs">chevron_right</span>
                </a>
              </div>

              {/* Price rows */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thành tiền</span>
                  <span className="font-medium text-gray-800">{fmt(subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span className="font-medium text-gray-800">0 đ</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-base font-bold">Tổng cộng</span>
                  <span className="text-xl font-bold text-red-600">{fmt(subTotal)}</span>
                </div>
              </div>

              {/* Checkout btn */}
              <button
                disabled={selectedItems.length === 0}
                onClick={() => router.push("/checkout")}
                className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold uppercase text-base hover:bg-red-700 transition-all
                  shadow-lg shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                  enabled:hover:scale-[1.02] active:scale-100">
                Thanh toán ({selectedItems.length})
              </button>

              <p className="text-[11px] text-red-500 italic mt-3 text-center">
                (Giảm giá trên web chỉ áp dụng cho bán lẻ)
              </p>
            </div>

            {/* Free shipping note */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-green-600 text-xl mt-0.5">local_shipping</span>
              <p className="text-xs text-green-800">
                <strong>Miễn phí giao hàng</strong> cho đơn từ 500k trở lên!{" "}
                <a href="#" className="underline">Chi tiết</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}