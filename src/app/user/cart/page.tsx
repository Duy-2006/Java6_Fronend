/*
 * page.tsx (Cart Page)
 * Component hien thi gio hang cua khach hang.
 * Chuc nang:
 * - Lay danh sach san pham trong gio hang tu backend.
 * - Cho phep thay doi so luong, xoa san pham, chon san pham de thanh toan.
 * - Hien thi sach goi y (Recommendations) va chuong trinh Flash Sale.
 * - Tinh toan tam tinh va dieu huong sang trang thanh toan (Checkout).
 */

/* eslint-disable @next/next/no-img-element */
"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  authorName?: string;
  isAudiobook?: boolean;
}

interface FlashSaleBook {
  id: number;
  discountValue?: number;
  discountPrice?: number;
  price?: number;
  usageLimit?: number | null;
  usedCount?: number;
  promotionId?: number;
}

interface BookRecommendation {
  id: number;
  title: string;
  price: number;
  imageUrl?: string;
  authorName?: string;
  active?: boolean;
}

interface BackendCartItem {
  id: number;
  cartDetailId?: number;
  bookId?: number;
  title?: string;
  imageUrl?: string;
  price?: number;
  quantity?: number;
  selected?: boolean;
  book?: {
    id?: number;
    title?: string;
    imageUrl?: string;
    price?: number;
    audioPrice?: number;
    author?: {
      name?: string;
    };
  };
  authorName?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [flashSaleMap, setFlashSaleMap] = useState<Map<number, { price: number, limit: number | null, usedCount: number, promotionId: number }>>(new Map());
  const [recommendedBooks, setRecommendedBooks] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Lấy danh sách flash sale
  const fetchFlashSale = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/books/flash-sale`);
      if (!res.ok) return;
      const data: FlashSaleBook[] = await res.json();
      const map = new Map<number, { price: number, limit: number | null, usedCount: number, promotionId: number }>();
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
        if (finalPrice !== null && !isNaN(finalPrice) && finalPrice > 0 && book.promotionId) {
          map.set(book.id, { price: finalPrice, limit: book.usageLimit ?? null, usedCount: book.usedCount ?? 0, promotionId: book.promotionId });
        }
      });
      setFlashSaleMap(map);
    } catch (err) {
      console.error("Failed to fetch flash sale", err);
    }
  }, []);

  // Lấy gợi ý sách
  const fetchRecommendations = useCallback(async (cartItems: CartItem[]) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/books?size=30`);
      if (res.ok) {
        const data = await res.json();
        const allBooks: BookRecommendation[] = Array.isArray(data) ? data : (data.content || []);
        const cartBookIds = new Set(cartItems.map(item => item.bookId));
        const filtered = allBooks.filter((b) => !cartBookIds.has(b.id) && b.active !== false);
        setRecommendedBooks(filtered.slice(0, 10));
      }
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn()) {
      setError("Vui lòng đăng nhập để xem giỏ hàng");
      setLoading(false);
      return;
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.status === 401) {
        setError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let cartItems = Array.isArray(data.cartItems) ? data.cartItems : data;
      
      cartItems = cartItems.map((item: BackendCartItem) => ({
        ...item,
        cartDetailId: item.cartDetailId ?? item.id,
        bookId: item.bookId ?? item.book?.id ?? item.bookId,
        title: item.title ?? item.book?.title,
        imageUrl: item.imageUrl ?? item.book?.imageUrl,
        price: Number(item.price ?? item.book?.price),
        quantity: item.quantity ?? 1,
        selected: item.selected ?? false,
        authorName: item.book?.author?.name || item.authorName || "Nguyễn Nhật Ánh",
        isAudiobook: item.book?.audioPrice !== undefined && item.book.audioPrice > 0 && Number(item.price) === Number(item.book.audioPrice),
      }));
      
      setItems(cartItems);
      fetchRecommendations(cartItems);
      setError(null);
    } catch (err) {
      console.error("❌ CartPage - Error:", err);
      setError(err instanceof Error ? err.message : "Lỗi khi tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations]);

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
      fetchFlashSale();
      fetchCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [fetchFlashSale, fetchCart]);

  const updateQuantity = async (cartDetailId: number, newQuantity: number) => {
    if (!isLoggedIn()) return;
    setUpdatingItems(prev => new Set(prev).add(cartDetailId));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cart/update`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ cartDetailId, quantity: newQuantity }),
      });
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.cartDetailId === cartDetailId ? { ...item, quantity: newQuantity } : item
        ));
        showToast("Đã cập nhật số lượng", "success");
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const data = await res.json();
        showToast(data.message || "Cập nhật thất bại", "error");
        fetchCart();
      }
    } catch {
      showToast("Lỗi kết nối máy chủ", "error");
      fetchCart();
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartDetailId);
        return newSet;
      });
    }
  };

  const removeItem = async (cartDetailId: number) => {
    if (!isLoggedIn()) return;
    setUpdatingItems(prev => new Set(prev).add(cartDetailId));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cart/remove`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ cartDetailId }),
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.cartDetailId !== cartDetailId));
        showToast("Đã xóa sản phẩm", "success");
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        fetchCart();
      }
    } catch {
      showToast("Lỗi kết nối máy chủ", "error");
      fetchCart();
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartDetailId);
        return newSet;
      });
    }
  };

  const toggleSelection = async (cartDetailId: number, currentSelected: boolean) => {
    if (!isLoggedIn()) return;
    const newSelected = !currentSelected;
    setItems(prev => prev.map(item => item.cartDetailId === cartDetailId ? { ...item, selected: newSelected } : item));
    try {
      await authFetch(`${API_BASE_URL}/api/cart/select`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartDetailId, selected: newSelected }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelectAll = async () => {
    if (!isLoggedIn()) return;
    const isAllSelected = items.length > 0 && items.every(item => item.selected);
    const newSelected = !isAllSelected;
    setItems(prev => prev.map(item => ({ ...item, selected: newSelected })));
    try {
      await Promise.all(items.map(item =>
        authFetch(`${API_BASE_URL}/api/cart/select`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartDetailId: item.cartDetailId, selected: newSelected }),
        })
      ));
    } catch (e) {
      console.error(e);
    }
  };

  // Tiến hành thanh toán
  const handleCheckout = async () => {
    if (!isLoggedIn()) return;

    const selectedItems = items.filter(item => item.selected);
    if (selectedItems.length === 0) {
      showToast("Vui lòng chọn ít nhất một sản phẩm để thanh toán", "error");
      return;
    }
    
    // Lưu danh sách ID các sản phẩm được chọn để thanh toán
    const selectedIds = selectedItems.map(item => item.cartDetailId);
    sessionStorage.setItem("selectedCartDetailIds", JSON.stringify(selectedIds));
    
    router.push("/user/checkout");
  };

  // Thêm sách từ danh sách gợi ý vào giỏ hàng
  const handleAddRecommendedToCart = async (book: BookRecommendation) => {
    if (!isLoggedIn()) {
      showToast("Vui lòng đăng nhập để thêm vào giỏ hàng", "error");
      router.push("/auth/login");
      return;
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ bookId: book.id, quantity: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Đã thêm "${book.title}" vào giỏ hàng!`, "success");
        fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        showToast(data.message || "Không thể thêm vào giỏ hàng", "error");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  // Cuộn thanh trượt gợi ý
  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 320;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const getBookImageSrc = (item: { imageUrl?: string }) => {
    if (!item.imageUrl) return "/images/book-default.jpg";
    let cleanUrl = item.imageUrl;
    if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
    return `${API_BASE_URL}/uploads/books/${cleanUrl}`;
  };

  // Tính toán số lượng khuyến mãi cho từng item để đảm bảo 1 promotionId chỉ được áp dụng 1 lần duy nhất trong toàn giỏ hàng
  const promoQtyMap = useMemo(() => {
    const map = new Map<number, number>();
    const appliedPromos = new Set<number>();
    
    // Ưu tiên các item được chọn trước (nếu không chọn thì không tính là đã dùng khuyến mãi)
    items.forEach(item => {
      const promoInfo = flashSaleMap.get(item.bookId);
      if (!item.selected || !promoInfo || promoInfo.price >= item.price) {
        map.set(item.cartDetailId, 0);
        return;
      }
      
      const isExhausted = promoInfo.limit !== null && promoInfo.usedCount >= promoInfo.limit;
      if (!isExhausted && !appliedPromos.has(promoInfo.promotionId)) {
        map.set(item.cartDetailId, 1);
        appliedPromos.add(promoInfo.promotionId);
      } else {
        map.set(item.cartDetailId, 0);
      }
    });
    return map;
  }, [items, flashSaleMap]);

  // Tính tổng tiền chỉ dựa trên item đã được chọn (item.selected)
  const subTotal = items.reduce((sum, item) => {
    if (!item.selected) return sum;
    const promoInfo = flashSaleMap.get(item.bookId);
    let itemTotal = item.price * item.quantity;
    const promoQty = promoQtyMap.get(item.cartDetailId) || 0;
    
    if (promoInfo && promoQty > 0) {
      const normalQty = item.quantity - promoQty;
      itemTotal = (promoQty * promoInfo.price) + (normalQty * item.price);
    }
    return sum + itemTotal;
  }, 0);

  // Tính giá gốc (không áp dụng flash sale) để hiển thị số tiền tiết kiệm
  const originalTotal = items.reduce((sum, item) => {
    if (!item.selected) return sum;
    return sum + item.price * item.quantity;
  }, 0);

  const savedAmount = originalTotal - subTotal;

  const total = subTotal;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
          <div className="text-center font-mono text-[13px]">
            <div className="animate-spin w-8 h-8 border-[2px] border-[#b70011] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#545f73]">Đang tải giỏ hàng...</p>
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
        <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb] px-4">
          <div className="text-center bg-white p-8 border border-[#e0e3e5] rounded-[4px] max-w-sm w-full font-sans">
            <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-3">lock</span>
            <p className="text-[14px] text-[#ba1a1a] mb-6 font-medium">{error}</p>
            <div className="space-y-2">
              <Link href="/auth/login" className="block w-full bg-[#b70011] hover:bg-[#b70011]/90 text-white text-[13px] font-bold py-2.5 rounded-[2px] transition duration-200 uppercase tracking-wider text-center">
                Đăng nhập ngay
              </Link>
              <Link href="/" className="block w-full border border-[#916f6b] text-[#191c1e] text-[13px] font-bold py-2.5 rounded-[2px] hover:bg-[#f2f4f6] transition duration-200 uppercase tracking-wider text-center">
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

      <main className="bg-[#f7f9fb] min-h-screen py-10 font-sans text-[#191c1e]">
        <div className="max-w-[1230px] mx-auto px-4">
          <h1 className="text-[32px] font-bold text-[#191c1e] tracking-[-0.02em] font-sans mb-8">Giỏ hàng của bạn</h1>
          
          {items.length === 0 ? (
            <div className="bg-white p-16 border border-[#e0e3e5] rounded-[4px] text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[64px] text-[#e0e3e5] mb-4">shopping_cart</span>
              <p className="text-[14px] text-[#545f73] mb-8 font-sans">Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
              <Link href="/" className="inline-block bg-[#b70011] hover:bg-[#b70011]/90 text-white text-[13px] font-bold px-8 py-3 rounded-[2px] transition-all uppercase tracking-wider">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Danh sách items */}
              <div className="w-full lg:w-2/3">
                <div className="bg-white border border-[#e0e3e5] rounded-[4px] divide-y divide-[#e0e3e5] overflow-hidden">
                  <div className="p-4 bg-gray-50 flex items-center gap-3 border-b border-[#e0e3e5]">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer accent-[#b70011]" 
                      checked={items.length > 0 && items.every(i => i.selected)}
                      onChange={toggleSelectAll}
                      title="Chọn tất cả sản phẩm"
                      aria-label="Chọn tất cả sản phẩm"
                    />
                    <span className="font-semibold text-sm">Chọn tất cả ({items.length} sản phẩm)</span>
                  </div>
                  {items.map((item) => {
                    const promoInfo = flashSaleMap.get(item.bookId);
                    let hasDiscount = false;
                    let itemTotal = item.price * item.quantity;
                    let promoQty = 0;
                    let normalQty = item.quantity;
                    let promoPrice = item.price;

                    let isExhausted = false;

                    if (promoInfo && promoInfo.price < item.price) {
                      isExhausted = promoInfo.limit !== null && promoInfo.usedCount >= promoInfo.limit;
                      promoQty = promoQtyMap.get(item.cartDetailId) || 0;
                      
                      if (promoQty > 0) {
                        hasDiscount = true;
                        promoPrice = promoInfo.price;
                        normalQty = item.quantity - promoQty;
                        itemTotal = (promoQty * promoPrice) + (normalQty * item.price);
                      }
                    }

                    return (
                      <div key={item.cartDetailId} className="p-6 flex gap-4 group items-start sm:items-stretch">
                        <div className="pt-2 sm:pt-[70px] pr-2 flex-shrink-0">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 cursor-pointer accent-[#b70011]" 
                            checked={item.selected}
                            onChange={() => toggleSelection(item.cartDetailId, item.selected)}
                            title={`Chọn sản phẩm ${item.title}`}
                            aria-label={`Chọn sản phẩm ${item.title}`}
                          />
                        </div>
                        <div className="w-[112px] h-[168px] bg-[#eceef0] flex-shrink-0 overflow-hidden rounded-[2px] border border-[#e0e3e5] relative shadow-sm group-hover:shadow-md transition-shadow">
                          <img
                            src={getBookImageSrc(item)}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h3 className="font-semibold text-[20px] text-[#191c1e] leading-[28px] hover:text-[#b70011] transition-colors leading-snug">
                                  <Link href={`/user/books/${item.bookId}`}>{item.title}</Link>
                                </h3>
                                <p className="text-[13px] text-[#545f73] mt-0.5 font-sans">Tác giả: {item.authorName}</p>
                                
                                {/* Badges */}
                                <div className="flex items-center gap-2 mt-2">
                                  {item.isAudiobook ? (
                                    <>
                                      <span className="px-2 py-0.5 bg-[#6a7188] text-white text-[10px] font-medium font-mono rounded-[2px] tracking-wide uppercase">Sách nói</span>
                                      <span className="px-2 py-0.5 bg-[#e6e8ea] text-[#5c403c] text-[10px] font-medium font-mono rounded-[2px]">Kỹ thuật số</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="px-2 py-0.5 bg-[#d5e0f8] text-[#586377] text-[10px] font-medium font-mono rounded-[2px] tracking-wide uppercase">Sách giấy</span>
                                      <span className="px-2 py-0.5 bg-[#e6e8ea] text-[#5c403c] text-[10px] font-medium font-mono rounded-[2px]">Bìa cứng</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                {hasDiscount ? (
                                  <div className="text-[13px] space-y-1 text-right font-sans">
                                    {promoQty > 0 && (
                                      <div className="text-[#b70011] font-semibold">
                                        Khuyến mãi: {promoQty} x {fmt(promoPrice)}
                                      </div>
                                    )}
                                    {normalQty > 0 && (
                                      <div className="text-[#545f73]">
                                        Giá gốc: {normalQty} x {fmt(item.price)}
                                      </div>
                                    )}
                                    <div className="font-semibold text-[20px] text-[#191c1e] mt-1 border-t border-[#eceef0] pt-1">
                                      {fmt(itemTotal)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-semibold text-[20px] text-[#191c1e]">{fmt(itemTotal)}</span>
                                )}
                                {isExhausted && (
                                  <div className="text-[12px] text-[#ba1a1a] font-medium mt-1">
                                    Ưu đãi đã hết lượt
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {hasDiscount && item.quantity > 1 && (
                              <p className="text-[11px] text-[#ba1a1a] font-mono mt-2">
                                * Khuyến mãi chỉ áp dụng cho 1 sản phẩm duy nhất/tài khoản. {normalQty} sản phẩm còn lại tính giá gốc.
                              </p>
                            )}
                            {!hasDiscount && promoInfo && !isExhausted && promoInfo.price < item.price && item.selected && (
                              <p className="text-[11px] text-[#ba1a1a] font-mono mt-2">
                                * Khuyến mãi này đã được áp dụng cho một cuốn sách khác trong giỏ hàng.
                              </p>
                            )}
                          </div>
                          
                          <div className="pt-4 flex items-center justify-between border-t border-[#f2f4f6] mt-4">
                            {/* Quantity Selector */}
                            <div className={`flex items-center border border-[#916f6b] rounded-[2px] overflow-hidden ${item.isAudiobook ? "opacity-40 cursor-not-allowed" : ""}`}>
                              <button
                                onClick={() => !item.isAudiobook && updateQuantity(item.cartDetailId, Math.max(1, item.quantity - 1))}
                                className="w-8 h-8 text-[16px] font-semibold bg-transparent hover:bg-[#f2f4f6] active:bg-[#e6e8ea] transition-colors disabled:opacity-40 flex items-center justify-center"
                                disabled={item.isAudiobook || updatingItems.has(item.cartDetailId) || item.quantity <= 1}
                              >
                                −
                              </button>
                              <span className="w-10 text-center text-xs font-mono font-medium">{item.quantity}</span>
                              <button
                                onClick={() => !item.isAudiobook && updateQuantity(item.cartDetailId, item.quantity + 1)}
                                className="w-8 h-8 text-[16px] font-semibold bg-transparent hover:bg-[#f2f4f6] active:bg-[#e6e8ea] transition-colors disabled:opacity-40 flex items-center justify-center"
                                disabled={item.isAudiobook || updatingItems.has(item.cartDetailId)}
                              >
                                +
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                              <button
                                onClick={() => showToast("Đã lưu sách vào mục lưu trữ", "success")}
                                className="text-[#b70011] font-mono text-[11px] flex items-center gap-1 hover:underline"
                              >
                                <span className="material-symbols-outlined text-[14px]">bookmark</span> Lưu lại
                              </button>
                              <button
                                onClick={() => removeItem(item.cartDetailId)}
                                className="text-[#ba1a1a] font-mono text-[11px] flex items-center gap-1 hover:underline disabled:opacity-50"
                                disabled={updatingItems.has(item.cartDetailId)}
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span> Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="w-full lg:w-1/3 lg:sticky lg:top-24">
                <div className="bg-white border border-[#e0e3e5] rounded-[4px] p-6 space-y-6">
                  <h2 className="font-semibold text-lg text-[#191c1e]">Thông tin đơn hàng</h2>
                  
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between text-[14px] text-[#545f73]">
                      <span>Tiền sách ({items.filter(i => i.selected).length} sản phẩm)</span>
                      <span className="font-semibold text-[#191c1e]">{fmt(subTotal)}</span>
                    </div>
                    {savedAmount > 0 && (
                      <div className="flex justify-between text-[14px]">
                        <span className="text-[#191c1e] flex items-center gap-1">
                          Tiết kiệm được
                        </span>
                        <span className="text-[#191c1e] font-semibold">-{fmt(savedAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[14px] text-[#545f73]">
                      <span>Phí vận chuyển</span>
                      <span className="text-[#166534] font-semibold">Miễn phí</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#e0e3e5] pt-4 flex justify-between items-center">
                    <span className="font-semibold text-[15px] text-[#191c1e]">Tổng cộng</span>
                    <span className="font-bold text-2xl text-[#b70011]">{fmt(total)}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-[#b70011] hover:bg-[#b70011]/90 text-white font-bold rounded-[2px] transition-all shadow-sm active:scale-[0.99] uppercase tracking-wider text-[13px] font-sans"
                  >
                    Tiến hành thanh toán
                  </button>

                  <div className="flex items-center justify-center gap-1.5 opacity-60 text-[11px] text-[#545f73] font-mono">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span>Secure SSL Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gợi ý cho bạn */}
          {recommendedBooks.length > 0 && (
            <section className="mt-16 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#191c1e] tracking-tight">Gợi ý cho bạn</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollSlider("left")}
                    className="w-8 h-8 flex items-center justify-center border border-[#916f6b] rounded-full hover:bg-[#eceef0] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button
                    onClick={() => scrollSlider("right")}
                    className="w-8 h-8 flex items-center justify-center border border-[#916f6b] rounded-full hover:bg-[#eceef0] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>

              <div
                ref={sliderRef}
                className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x scroll-smooth no-scrollbar"
              >
                {recommendedBooks.map((b) => (
                  <div key={b.id} className="min-w-[200px] w-[200px] flex-shrink-0 group snap-start cursor-pointer">
                    <div className="relative aspect-[2/3] bg-[#f2f4f6] rounded-[2px] overflow-hidden border border-[#e0e3e5]">
                      <img
                        src={getBookImageSrc(b)}
                        alt={b.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddRecommendedToCart(b);
                        }}
                        className="absolute bottom-3 right-3 bg-white text-[#b70011] w-8 h-8 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-105"
                        title="Thêm vào giỏ hàng"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                      </button>
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="font-semibold text-[13px] text-[#191c1e] line-clamp-1 group-hover:text-[#b70011] transition-colors font-sans">
                        {b.title}
                      </h4>
                      <p className="text-[11px] text-[#545f73] mt-0.5 truncate font-sans">{b.authorName || "Nguyễn Nhật Ánh"}</p>
                      <p className="font-bold text-[13px] text-[#b70011] mt-1 font-sans">{fmt(b.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Sleek Minimalist Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 border rounded-[2px] shadow-md max-w-sm animate-fade-in flex items-center gap-3 font-mono text-[12px]
          ${toast.type === "success"
            ? "bg-white border-[#586377] text-[#191c1e]"
            : "bg-white border-[#ba1a1a] text-[#ba1a1a]"}`}
        >
          <span className="material-symbols-outlined text-[16px] text-inherit">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <Footer />
    </>
  );
}