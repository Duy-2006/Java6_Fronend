"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const BANNERS = ["/uploads/s1.webp", "/uploads/s2.webp", "/uploads/s3.webp", "/uploads/s4.webp"];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// BookCard component hỗ trợ hiển thị giá khuyến mãi
function BookCard({ b, onAddToCart }: { b: any; onAddToCart: (book: any, redirect?: boolean) => void }) {
  const [imgError, setImgError] = useState(false);

  const getImageSrc = () => {
    if (imgError) return "/images/book-default.jpg";
    if (b.imageUrl && b.imageUrl.trim()) {
      let cleanUrl = b.imageUrl;
      if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
      return `${API_URL}/uploads/books/${cleanUrl}`;
    }
    return "/images/book-default.jpg";
  };

  const price = Number(b.price) || 0;
  const discountPriceRaw = Number(b.discountPrice) || 0;
  const hasDiscount = discountPriceRaw > 0 && discountPriceRaw < price;

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(hasDiscount ? discountPriceRaw : price);
  const formattedOriginal = hasDiscount ? new Intl.NumberFormat("vi-VN").format(price) : null;

  const handleImageError = () => {
    if (!imgError) setImgError(true);
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer relative">
      {hasDiscount && (
        <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          -{b.discountValue}%
        </div>
      )}
      <Link href={`user/books/${b.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={getImageSrc()}
            alt={b.title}
            className="w-full h-full object-contain p-2"
            onError={handleImageError}
          />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 h-9 group-hover:text-red-600 transition">{b.title}</h3>
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-red-600 font-bold text-base">{formattedPrice} ₫</span>
                <span className="text-gray-400 text-xs line-through">{formattedOriginal} ₫</span>
              </>
            ) : (
              <span className="text-red-600 font-bold text-base">{formattedPrice} ₫</span>
            )}
          </div>
          <div className="flex text-orange-400 text-[10px]">★★★★★</div>
        </div>
      </Link>
      <div className="flex gap-2 mt-3">
        <button
          onClick={(e) => { e.preventDefault(); onAddToCart(b, false); }}
          className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-red-600 hover:text-white transition"
        >
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [flashSaleBooks, setFlashSaleBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600 + 9 * 60 + 25);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string, isError: boolean = false) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = async (book: any, redirectToCheckout: boolean = false) => {
    const token = getToken();
    if (!token) {
      showToast("Vui lòng đăng nhập để thêm vào giỏ hàng", true);
      router.push("/auth/login");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: book.id, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Thêm vào giỏ thất bại");
      showToast(`Đã thêm "${book.title}" vào giỏ hàng!`);
      window.dispatchEvent(new Event('cartUpdated'));
      if (redirectToCheckout) router.push("/user/cart");
    } catch (error: any) {
      console.error("Add to cart error:", error);
      showToast(error.message, true);
    }
  };

  // Lấy sách mới
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/books/new`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setBooks(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Lấy sách flash sale
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await fetch(`${API_URL}/api/books/flash-sale`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log("Raw flash sale data from API:", data);
        setFlashSaleBooks(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Flash sale error:", err);
        setFlashSaleBooks([]);
      }
    };
    fetchFlashSale();
  }, []);

  // Lấy danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Banner auto-slide
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % BANNERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => t > 0 ? t - 1 : 3600 * 2);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");

  // Lọc sách mới: loại bỏ những sách đã xuất hiện trong Flash Sale
  const newBooksNotInFlashSale = books.filter(book => !flashSaleBooks.some(fb => fb.id === book.id)).slice(0, 10);

  if (loading) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
            <p className="text-red-600 mb-4">Lỗi: {error}</p>
            <p className="text-gray-500 text-sm mb-4">Không thể kết nối đến server tại {API_URL}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] font-display text-gray-800">
      <Navbar />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span> {toast}
        </div>
      )}

      <main className="max-w-[1230px] mx-auto px-4 mt-4 space-y-6 pb-12">
        {/* Banner */}
        <div className="grid grid-cols-12 gap-3 lg:gap-4">
          <section className="col-span-12 lg:col-span-8 relative rounded-xl overflow-hidden shadow-sm h-[200px] md:h-[300px] lg:h-[320px] bg-white">
            <div className="relative h-full w-full">
              {BANNERS.map((src, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    i === slide ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={src}
                    className="w-full h-full object-fill lg:object-cover"
                    alt={`Banner ${i + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/1200x320/C92127/white?text=Banner+${i + 1}`;
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? 20 : 8,
                    backgroundColor: i === slide ? "#C92127" : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </div>
          </section>
          <div className="hidden lg:col-span-4 lg:flex flex-col gap-3 h-[320px]">
            {["/uploads/d1.webp", "/uploads/d2.webp"].map((src, i) => (
              <div key={i} className="flex-1 rounded-xl overflow-hidden shadow-sm bg-gray-100">
                <img
                  src={src}
                  className="w-full h-full object-fill cursor-pointer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/400x150/eee/999?text=Promo+${i + 1}`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Flash Sale */}
        {flashSaleBooks.length > 0 && (
          <section>
            <div className="bg-red-600 rounded-t-xl p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black italic tracking-tighter uppercase">⚡ Flash Sale</h2>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>Kết thúc trong:</span>
                  <div className="flex gap-1 items-center">
                    {[h, m, s].map((unit, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="bg-black px-2 py-1 rounded font-mono">{unit}</span>
                        {idx < 2 && <span>:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-b-xl p-4 shadow-sm border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {flashSaleBooks.map(book => (
                  <BookCard key={book.id} b={book} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Danh mục sản phẩm */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-50">
            <span className="material-symbols-outlined text-red-600 text-2xl">widgets</span>
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Danh mục sản phẩm</h2>
          </div>
          <div className="p-6 flex justify-between items-start gap-4 overflow-x-auto no-scrollbar">
            {categories.length > 0 ? (
              categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/user/category/${cat.id}`}
                  className="flex flex-col items-center gap-3 group cursor-pointer min-w-[100px] flex-1 transition-transform hover:-translate-y-1"
                >
                  <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center transition-all duration-300 group-hover:drop-shadow-lg">
                    <img
                      src={`/uploads/e${(i % 10) + 1}.webp`}
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 text-center group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Đang tải danh mục...</p>
            )}
          </div>
        </section>

        {/* Sách mới (đã loại bỏ sách đã có trong Flash Sale) */}
        {newBooksNotInFlashSale.length > 0 && (
          <section>
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-t-xl p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
                <h2 className="text-xl font-bold uppercase tracking-tight">Sách mới</h2>
              </div>
            </div>
            <div className="bg-white rounded-b-xl p-4 shadow-sm border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {newBooksNotInFlashSale.map(book => (
                  <BookCard key={book.id} b={book} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}