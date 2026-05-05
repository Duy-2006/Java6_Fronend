"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface CartItem {
  cartDetailId: number;
  bookId: number;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
  selected: boolean;
}

interface FlashSaleBook {
  id: number;
  discountValue?: number;
  discountPrice?: number;
  price?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [flashSaleMap, setFlashSaleMap] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  const getToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  };

  const showToast = (msg: string) => console.log(msg);

  // Lấy danh sách flash sale
  const fetchFlashSale = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/books/flash-sale`);
      if (!res.ok) return;
      const data: FlashSaleBook[] = await res.json();
      console.log("🔥 Flash sale data from API:", data);
      const map = new Map<number, number>();
      data.forEach(book => {
        let finalPrice: number | null = null;
        if (book.discountPrice !== undefined && book.discountPrice !== null) {
          finalPrice = Number(book.discountPrice);
        } else if (book.discountValue !== undefined && book.price !== undefined) {
          const discount = Number(book.discountValue);
          const original = Number(book.price);
          if (!isNaN(discount) && !isNaN(original) && discount > 0 && discount <= 100) {
            finalPrice = original * (100 - discount) / 100;
          }
        }
        if (finalPrice !== null && !isNaN(finalPrice) && finalPrice > 0) {
          map.set(book.id, finalPrice);
          console.log(`✅ Mapped book ${book.id} -> discountPrice = ${finalPrice}`);
        }
      });
      setFlashSaleMap(map);
    } catch (err) {
      console.error("Failed to fetch flash sale", err);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Vui lòng đăng nhập để xem giỏ hàng");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        setError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let cartItems = Array.isArray(data.cartItems) ? data.cartItems : data;
      
      // Chuẩn hóa: đảm bảo mỗi item có trường bookId
      cartItems = cartItems.map((item: any) => ({
        ...item,
        cartDetailId: item.cartDetailId ?? item.id,
        bookId: item.bookId ?? item.book?.id ?? item.bookId,   // quan trọng
        title: item.title ?? item.book?.title,
        imageUrl: item.imageUrl ?? item.book?.imageUrl,
        price: Number(item.price ?? item.book?.price),
        quantity: item.quantity ?? 1,
        selected: item.selected ?? false,
      }));
      
      setItems(cartItems);
      setError(null);
    } catch (err: any) {
      console.error("❌ CartPage - Error:", err);
      setError(err.message || "Lỗi khi tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dữ liệu ban đầu
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFlashSale(), fetchCart()]);
      if (isMounted) setLoading(false);
    };
    loadData();
    return () => { isMounted = false; };
  }, [fetchFlashSale, fetchCart]);

  // Lắng nghe sự kiện cartUpdated
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log("Cart updated, refetching data...");
      fetchFlashSale();
      fetchCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [fetchFlashSale, fetchCart]);

  const getDisplayPrice = (item: CartItem) => {
    const discounted = flashSaleMap.get(item.bookId);
    console.log(`📘 bookId=${item.bookId}, discounted=${discounted}, original=${item.price}`);
    if (discounted && discounted < item.price) return discounted;
    return item.price;
  };

  // Các hàm cập nhật số lượng, chọn, xóa (giữ nguyên như cũ)
  const updateQuantity = async (cartDetailId: number, newQuantity: number) => {
    const token = getToken();
    if (!token) return;
    setUpdatingItems(prev => new Set(prev).add(cartDetailId));
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartDetailId, quantity: newQuantity }),
      });
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.cartDetailId === cartDetailId ? { ...item, quantity: newQuantity } : item
        ));
      } else {
        const data = await res.json();
        showToast(data.message || "Cập nhật thất bại");
        fetchCart();
      }
    } catch (error) {
      fetchCart();
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartDetailId);
        return newSet;
      });
    }
  };

  const toggleSelect = async (cartDetailId: number, selected: boolean) => {
    const token = getToken();
    if (!token) return;
    setItems(prev => prev.map(item =>
      item.cartDetailId === cartDetailId ? { ...item, selected } : item
    ));
    try {
      await fetch(`${API_BASE_URL}/api/cart/select`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartDetailId, selected }),
      });
    } catch (error) {
      fetchCart();
    }
  };

  const toggleSelectAll = async (checked: boolean) => {
    const token = getToken();
    if (!token) return;
    setItems(prev => prev.map(item => ({ ...item, selected: checked })));
    try {
      await Promise.all(items.map(item =>
        fetch(`${API_BASE_URL}/api/cart/select`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cartDetailId: item.cartDetailId, selected: checked }),
        })
      ));
    } catch (error) {
      fetchCart();
    }
  };

  const removeItem = async (cartDetailId: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    const token = getToken();
    if (!token) return;
    setUpdatingItems(prev => new Set(prev).add(cartDetailId));
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/remove`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartDetailId }),
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.cartDetailId !== cartDetailId));
        showToast("Đã xóa sản phẩm");
      } else {
        fetchCart();
      }
    } catch (error) {
      fetchCart();
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartDetailId);
        return newSet;
      });
    }
  };

  const selectedItems = items.filter(item => item.selected);
  const subTotal = selectedItems.reduce((sum, item) => {
    const displayPrice = getDisplayPrice(item);
    return sum + displayPrice * item.quantity;
  }, 0);
  const shippingFee = subTotal >= 500000 ? 0 : 30000;
  const total = subTotal + shippingFee;
  const allSelected = items.length > 0 && items.every(item => item.selected);

  // Render (giữ nguyên phần JSX)
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
            <p className="text-6xl mb-4">🔒</p>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-3">
              <Link href="/auth/login" className="block w-full bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition">
                Đăng nhập ngay
              </Link>
              <Link href="/" className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-[1230px] mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h1>
          {items.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
              <p className="text-6xl mb-4">🛒</p>
              <p className="text-gray-500 mb-6">Chưa có sản phẩm nào trong giỏ hàng.</p>
              <Link href="/" className="inline-block bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="w-4 h-4 accent-red-600"
                    />
                    <span className="text-sm font-medium text-gray-600">Chọn tất cả ({items.length} sản phẩm)</span>
                  </div>
                  <div className="divide-y">
                    {items.map((item) => {
                      const displayPrice = getDisplayPrice(item);
                      const hasDiscount = displayPrice < item.price;
                      return (
                        <div key={item.cartDetailId} className="p-4 flex gap-4">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => toggleSelect(item.cartDetailId, e.target.checked)}
                            className="w-4 h-4 accent-red-600 mt-6"
                          />
                          <img
                            src={(() => {
                              if (!item.imageUrl) return "/images/book-default.jpg";
                              let cleanUrl = item.imageUrl;
                              if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
                              return `${API_BASE_URL}/uploads/books/${cleanUrl}`;
                            })()}
                            alt={item.title}
                            className="w-24 h-32 object-cover rounded-lg border"
                            onError={(e) => (e.target as HTMLImageElement).src = "/images/book-default.jpg"}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-medium text-gray-800 hover:text-red-600">
                                  <Link href={`/books/${item.bookId}`}>{item.title}</Link>
                                </h3>
                                <div className="mt-1">
                                  {hasDiscount ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-red-600 font-bold text-lg">{fmt(displayPrice)}</span>
                                      <span className="text-gray-400 text-sm line-through">{fmt(item.price)}</span>
                                    </div>
                                  ) : (
                                    <p className="text-red-600 font-bold text-lg">{fmt(item.price)}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem(item.cartDetailId)}
                                className="text-gray-400 hover:text-red-600 transition"
                                disabled={updatingItems.has(item.cartDetailId)}
                              >
                                🗑️
                              </button>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                              <div className="flex items-center border rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.cartDetailId, Math.max(1, item.quantity - 1))}
                                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                                  disabled={updatingItems.has(item.cartDetailId) || item.quantity <= 1}
                                >-</button>
                                <span className="w-10 text-center text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.cartDetailId, item.quantity + 1)}
                                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                                  disabled={updatingItems.has(item.cartDetailId)}
                                >+</button>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Thành tiền</p>
                                <p className="text-red-600 font-bold">{fmt(displayPrice * item.quantity)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="lg:w-1/3">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <h2 className="text-lg font-bold mb-4">Thông tin đơn hàng</h2>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính ({selectedItems.length} sản phẩm)</span>
                      <span className="font-medium">{fmt(subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển</span>
                      <span className="font-medium">{shippingFee === 0 ? "Miễn phí" : fmt(shippingFee)}</span>
                    </div>
                    {subTotal > 0 && subTotal < 500000 && (
                      <div className="text-xs text-blue-600">
                        * Mua thêm {fmt(500000 - subTotal)} để được miễn phí vận chuyển
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-bold">Tổng cộng</span>
                      <span className="text-xl font-bold text-red-600">{fmt(total)}</span>
                    </div>
                  </div>
                  <button
                    disabled={selectedItems.length === 0}
                    onClick={() => router.push("/user/checkout")}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Thanh toán ({selectedItems.length})
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-4">Phí vận chuyển sẽ được tính ở bước tiếp theo</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}