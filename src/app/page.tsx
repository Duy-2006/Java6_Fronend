"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const HERO_IMAGE = "https://lh3.googleusercontent.com/aida/ADBb0ugHjrY8tAvrREQdtUimgd1bjF-cWPdDhU6ZyTv3D1p43vZNu-ciJQNSTseUx-PR03kkb36UL9GYHUlTb1Z1YyKyEJxFzyA0TwwRknkvypkhMKD6R6pjuYVaaDG9D3hov90KJNoWwT5Y6x-paL72oVm37XXAsHS8eKE5tDVSSEt6z2XrH3rtteInGdkIKUFqh3SLpprDqNbOxXd3C6pF3IkXckXIDSbNM-fO6IcC5SwosqArKUsBU90SoJ0";

const getToken = () => {
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

// Custom Premium BookCard Component
interface BookCardProps {
  b: any;
  onAddToCart: (book: any, redirect?: boolean) => void;
  showFormatBadges?: boolean;
}

function BookCard({ b, onAddToCart, showFormatBadges = true }: BookCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_URL}/api/books/${b.id}/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then((reviews) => {
        if (!isMounted) return;
        if (Array.isArray(reviews) && reviews.length > 0) {
          const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
          setRating(avg);
          setReviewCount(reviews.length);
        } else {
          setRating(0);
          setReviewCount(0);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRating(0);
          setReviewCount(0);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [b.id]);

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
  const discountPercent = b.discountValue ? Number(b.discountValue) : (hasDiscount ? Math.round((1 - discountPriceRaw / price) * 100) : 0);

  const finalPrice = hasDiscount ? discountPriceRaw : price;
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(finalPrice);
  const formattedOriginal = hasDiscount ? new Intl.NumberFormat("vi-VN").format(price) : null;

  // Lấy giá sách nói từ database, mặc định = 0
  const audioPrice = b.audioPrice ? Number(b.audioPrice) : 0;
  const formattedAudioPrice = new Intl.NumberFormat("vi-VN").format(audioPrice);

  const handleImageError = () => { if (!imgError) setImgError(true); };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/user/books/${b.id}/audiobook`);
  };

  return (
    <div className="bg-white rounded-2xl p-4 transition-all duration-300 hover:-translate-y-2 group book-card-shadow border border-[#191c1e]/5 flex flex-col relative overflow-hidden">
      {/* Book Cover Area */}
      <Link href={`/user/books/${b.id}`} className="relative aspect-[3/4] mb-4 overflow-hidden rounded-xl bg-[#f2f4f6] flex items-center justify-center p-3 cursor-pointer block group/cover">
        <img 
          src={getImageSrc()} 
          alt={b.title} 
          className="w-full h-full object-contain transition-transform duration-500 group-hover/cover:scale-110" 
          onError={handleImageError} 
        />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-[#b70011] text-white text-[10px] font-bold rounded shadow-sm w-fit">
              -{discountPercent}%
            </span>
          )}
          {showFormatBadges && (
            <>
              <span className="px-2 py-0.5 bg-white/90 text-[#b70011] text-[9px] font-bold rounded flex items-center gap-1 shadow-sm w-fit border border-[#b70011]/10">
                <span className="material-symbols-outlined text-[10px] fill-1">book</span> Sách giấy
              </span>
              <span className="px-2 py-0.5 bg-[#b70011]/10 text-[#b70011] text-[9px] font-bold rounded flex items-center gap-1 backdrop-blur-sm shadow-sm w-fit border border-[#b70011]/10">
                <span className="material-symbols-outlined text-[10px] fill-1">headphones</span> Sách nói
              </span>
            </>
          )}
        </div>

        {/* Hover Listen Overlay Button */}
        <button 
          onClick={handlePlayAudio}
          className="absolute bottom-3 right-3 w-9 h-9 bg-[#b70011]/90 hover:bg-[#b70011] text-white rounded-full flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 shadow-md transform hover:scale-105 z-20"
          title="Nghe sách nói ngay"
        >
          <span className="material-symbols-outlined text-base fill-1">play_arrow</span>
        </button>

        {b.quantity <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
            <span className="bg-[#191c1e] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-full shadow-md tracking-wider">
              Hết hàng
            </span>
          </div>
        )}
      </Link>

      {/* Book Metadata & Pricing */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/user/books/${b.id}`} className="block">
            <h3 className="font-semibold text-base mb-1 truncate text-[#191c1e] group-hover:text-[#b70011] transition-colors leading-snug">
              {b.title}
            </h3>
          </Link>
          <p className="text-gray-500 text-xs mb-2 truncate font-medium">{b.authorName || "Nguyễn Nhật Ánh"}</p>
          
          <div className="flex items-center gap-1 mb-3">
            <span className="material-symbols-outlined text-[14px] text-yellow-500 fill-1">star</span>
            <span className="text-xs font-bold text-[#191c1e]">{rating && rating > 0 ? rating.toFixed(1) : "4.8"}</span>
            <span className="text-gray-400 text-xs">({reviewCount > 0 ? reviewCount : Math.floor(b.id * 7 % 60 + 15)})</span>
          </div>
        </div>

        <div>
          {/* Format Pricing Grid */}
          <div className="space-y-0.5 mb-4 border-t border-[#f2f4f6] pt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Sách giấy:</span>
              <span className="font-bold text-[#191c1e]">{formattedPrice} ₫</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Sách nói:</span>
              <span className="font-bold text-[#b70011]">{formattedAudioPrice} ₫</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#f2f4f6]">
            <div>
              {hasDiscount ? (
                <span className="text-xs text-gray-400 line-through font-medium">{formattedOriginal} ₫</span>
              ) : (
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Đã bán {b.soldCount || 0}</span>
              )}
            </div>
            
            <button 
              onClick={(e) => { e.preventDefault(); if (b.quantity === undefined || b.quantity > 0) onAddToCart(b, false); }}
              disabled={b.quantity !== undefined && b.quantity <= 0}
              className="w-8 h-8 bg-[#f2f4f6] hover:bg-[#b70011] text-[#191c1e] hover:text-white transition-all duration-300 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:hover:bg-[#f2f4f6] disabled:hover:text-gray-400"
              title="Thêm vào giỏ hàng"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const audioScrollRef = useRef<HTMLDivElement>(null);

  // States
  const [newBooks, setNewBooks] = useState<any[]>([]);
  const [newBooksPage, setNewBooksPage] = useState(0);
  const [newBooksTotalPages, setNewBooksTotalPages] = useState(0);
  const [loadingNewBooks, setLoadingNewBooks] = useState(false);

  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [bestSellersPage, setBestSellersPage] = useState(0);
  const [bestSellersTotalPages, setBestSellersTotalPages] = useState(0);
  const [loadingBestSellers, setLoadingBestSellers] = useState(false);

  const [flashSaleBooks, setFlashSaleBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [heroSlide, setHeroSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600 * 2 + 15 * 60 + 40);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  // Get new books
  const fetchNewBooks = async (page: number, isLoadMore = false) => {
    try {
      setLoadingNewBooks(true);
      const res = await fetch(`${API_URL}/api/books/new?page=${page}&size=10&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        let content = data.content || (Array.isArray(data) ? data : []);
        content = content.filter((b: any) => b.active !== false);
        const totalPages = data.totalPages || 1;
        if (isLoadMore) {
          setNewBooks(prev => [...prev, ...content]);
        } else {
          setNewBooks(content);
        }
        setNewBooksTotalPages(totalPages);
      } else {
        const allRes = await fetch(`${API_URL}/api/books/new?t=${Date.now()}`);
        let allBooks = await allRes.json();
        if (!Array.isArray(allBooks)) allBooks = [];
        allBooks = allBooks.filter((b: any) => b.active !== false);
        const sorted = [...allBooks].sort((a, b) => b.id - a.id);
        const pageSize = 10;
        const start = page * pageSize;
        const paginated = sorted.slice(start, start + pageSize);
        const totalPages = Math.ceil(sorted.length / pageSize);
        if (isLoadMore) {
          setNewBooks(prev => [...prev, ...paginated]);
        } else {
          setNewBooks(paginated);
        }
        setNewBooksTotalPages(totalPages);
      }
    } catch (err) {
      console.error("Fetch new books error:", err);
      if (!isLoadMore) setNewBooks([]);
    } finally {
      setLoadingNewBooks(false);
    }
  };

  // Get best sellers
  const fetchBestSellers = async (page: number, isLoadMore = false) => {
    try {
      setLoadingBestSellers(true);
      const res = await fetch(`${API_URL}/api/books/best-sellers?page=${page}&size=10&t=${Date.now()}`);
      let books: any[] = [];
      let totalPages = 0;
      if (res.ok) {
        const data = await res.json();
        books = data.content ?? (Array.isArray(data) ? data : []);
        books = books.filter((b: any) => b.active !== false);
        totalPages = data.totalPages ?? 1;
      } else {
        const allRes = await fetch(`${API_URL}/api/books/best-sellers?t=${Date.now()}`);
        if (!allRes.ok) throw new Error();
        let allBooks = await allRes.json();
        if (!Array.isArray(allBooks)) allBooks = [];
        allBooks = allBooks.filter((b: any) => b.active !== false);
        const pageSize = 10;
        const start = page * pageSize;
        books = allBooks.slice(start, start + pageSize);
        totalPages = Math.ceil(allBooks.length / pageSize);
      }
      
      // Merge with flash sale
      let flashMap = new Map();
      try {
        const flashRes = await fetch(`${API_URL}/api/books/flash-sale`);
        if (flashRes.ok) {
          const flashData = await flashRes.json();
          if (Array.isArray(flashData)) {
            flashData.forEach((item: any) => {
              flashMap.set(item.id, {
                discountPrice: item.discountPrice,
                discountValue: item.discountValue,
              });
            });
          }
        }
      } catch (e) { }
      
      const mergedBooks = books.map((book: any) => {
        const flashInfo = flashMap.get(book.id);
        if (flashInfo) {
          return { ...book, discountPrice: flashInfo.discountPrice, discountValue: flashInfo.discountValue };
        }
        return book;
      });

      if (isLoadMore) {
        setBestSellers(prev => [...prev, ...mergedBooks]);
      } else {
        setBestSellers(mergedBooks);
      }
      setBestSellersTotalPages(totalPages);
      setBestSellersPage(page);
    } catch (err) {
      console.error("Fetch best sellers error:", err);
      if (!isLoadMore) setBestSellers([]);
    } finally {
      setLoadingBestSellers(false);
    }
  };

  // Fetch flash sale
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await fetch(`${API_URL}/api/books/flash-sale?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        let fBooks = Array.isArray(data) ? data : [];
        setFlashSaleBooks(fBooks.filter((b: any) => b.active !== false));

        if (fBooks.length > 0) {
           let maxDate = 0;
           fBooks.forEach((fb: any) => {
              if (fb.endDate) {
                 const d = new Date(fb.endDate).getTime();
                 if (d > maxDate) maxDate = d;
              }
           });
           if (maxDate > 0) {
              const endDateObj = new Date(maxDate);
              endDateObj.setHours(23, 59, 59, 999);
              const diff = Math.floor((endDateObj.getTime() - Date.now()) / 1000);
              setTimeLeft(diff > 0 ? diff : 0);
           }
        }
      } catch (err) {
        console.error("Flash sale error:", err);
        setFlashSaleBooks([]);
      }
    };
    fetchFlashSale();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Set top categories
  useEffect(() => {
    if (bestSellers.length > 0 && categories.length > 0) {
      const catCount = new Map();
      bestSellers.forEach(book => {
        const catId = book.categoryId || book.category?.id;
        if (catId) {
          catCount.set(catId, (catCount.get(catId) || 0) + 1);
        }
      });
      const sortedCatIds = Array.from(catCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(entry => entry[0]);
      let top = categories.filter(cat => sortedCatIds.includes(cat.id));
      if (top.length < 6) {
        const remaining = categories.filter(cat => !sortedCatIds.includes(cat.id)).slice(0, 6 - top.length);
        top = [...top, ...remaining];
      }
      setTopCategories(top.slice(0, 6));
    } else if (categories.length > 0) {
      setTopCategories(categories.slice(0, 6));
    }
  }, [bestSellers, categories]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchNewBooks(0, false),
        fetchBestSellers(0, false),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  // Hero slider auto shift
  useEffect(() => {
    const id = setInterval(() => setHeroSlide(s => (s + 1) % 3), 5000);
    return () => clearInterval(id);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const d = String(Math.floor(timeLeft / (3600 * 24)));
  const h = String(Math.floor((timeLeft % (3600 * 24)) / 3600)).padStart(2, "0");
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");

  const newBooksNotInFlashSale = newBooks.filter(book => !flashSaleBooks.some(fb => fb.id === book.id));

  const handleLoadMoreNew = () => {
    if (newBooksPage + 1 < newBooksTotalPages) {
      fetchNewBooks(newBooksPage + 1, true);
      setNewBooksPage(prev => prev + 1);
    }
  };

  const handleLoadMoreBest = () => {
    if (bestSellersPage + 1 < bestSellersTotalPages) {
      fetchBestSellers(bestSellersPage + 1, true);
    }
  };

  // Horizontal scroll controls for Sách Nói Mới
  const scrollAudio = (direction: "left" | "right") => {
    if (audioScrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      audioScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen font-sans">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#b70011] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 font-semibold text-sm">Đang mở trang sách Crimson Books...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen font-sans">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center bg-white p-10 rounded-3xl border border-[#191c1e]/10 max-w-md shadow-xl">
            <span className="material-symbols-outlined text-[#b70011] text-5xl mb-4">error</span>
            <p className="text-[#191c1e] font-extrabold text-xl mb-2">Không thể tải trang</p>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">Đã xảy ra lỗi kết nối với máy chủ của Libris. Vui lòng thử lại sau.</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#b70011] hover:bg-[#dc2626] text-white rounded-full text-sm font-bold shadow-md transition-all duration-300">
              Tải lại trang
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Create Audiobook mock list from real books to showcase "Sách Nói Mới"
  const audioBooksList = bestSellers.slice(0, 6);

  return (
    <div className="bg-[#f7f9fb] font-sans text-[#191c1e] antialiased min-h-screen">
      <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 animate-fade-in ${
          toast.isError ? "bg-[#ba1a1a] text-white" : "bg-emerald-600 text-white"
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.isError ? "error" : "check_circle"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="space-y-16 pb-24">

        {/* 1. Cinematic Hero Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
          <div className="relative rounded-3xl overflow-hidden h-[440px] md:h-[500px] lg:h-[540px] group shadow-2xl">
            <img 
              alt="Mắt Biếc" 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out" 
              src={HERO_IMAGE}
            />
            {/* Cinematic Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#191c1e] via-[#191c1e]/75 to-transparent z-10" />
            
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 max-w-3xl z-20">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-[#b70011] text-white font-semibold rounded text-[11px] uppercase tracking-widest">
                  Sách Mới Nhất
                </span>
                <span className="px-3 py-1 bg-white/10 text-white backdrop-blur-md font-semibold rounded text-[11px] uppercase tracking-widest border border-white/10">
                  Bestseller
                </span>
              </div>
              
              <h1 className="font-extrabold text-[40px] md:text-[54px] lg:text-[60px] leading-tight text-white mb-6 font-headline-lg tracking-tighter">
                Mắt Biếc: <span className="text-[#ffb4ab]">Eternal Memory</span>
              </h1>
              
              <p className="text-white/80 text-sm md:text-base lg:text-lg mb-10 leading-relaxed max-w-xl font-body-lg">
                Đắm chìm trong tuyệt tác của Nguyễn Nhật Ánh qua định dạng sách nói chất lượng cao, với âm hưởng điện ảnh và giọng đọc đầy cảm xúc.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/user/books/1016/audiobook" 
                  className="bg-[#b70011] hover:bg-[#dc2626] text-white px-8 py-4 font-bold rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg shadow-[#b70011]/30 group/btn"
                >
                  <span className="material-symbols-outlined fill-1 transition-transform group-hover/btn:scale-110">play_circle</span>
                  Nghe Thử Ngay
                </Link>
                <Link 
                  href="/user/books/1016" 
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 font-bold rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Xem Chi Tiết
                </Link>
              </div>
            </div>

            {/* Custom Dot Indicators */}
            <div className="absolute bottom-8 right-8 md:right-16 flex gap-3 z-20">
              <div className="w-12 h-1.5 bg-[#b70011] rounded-full cursor-pointer"></div>
              <div className="w-3 h-1.5 bg-white/30 rounded-full cursor-pointer hover:bg-white/50 transition-all duration-300"></div>
              <div className="w-3 h-1.5 bg-white/30 rounded-full cursor-pointer hover:bg-white/50 transition-all duration-300"></div>
            </div>
          </div>
        </section>

        {/* 2. Highlighted Categories Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-white p-6 md:p-8 rounded-[28px] border border-[#191c1e]/5 shadow-sm">
            <div className="flex justify-between items-center gap-6 overflow-x-auto no-scrollbar py-2">
              {topCategories.length > 0 ? (
                topCategories.map((cat, i) => {
                  let imageSrc = `/uploads/e${(i % 10) + 1}.webp`;
                  if (cat.imageUrl) {
                    imageSrc = cat.imageUrl.startsWith('http') ? cat.imageUrl : `${API_URL}${cat.imageUrl}`;
                  }
                  return (
                    <Link 
                      key={cat.id} 
                      href={`/user/category/${cat.id}`}
                      className="flex flex-col items-center gap-3 group shrink-0 min-w-[100px] flex-1"
                    >
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#f2f4f6] overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-[#b70011] group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <img 
                          alt={cat.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                          src={imageSrc}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=150&auto=format&fit=crop`;
                          }}
                        />
                      </div>
                      <span className="text-xs md:text-sm font-semibold text-[#191c1e] group-hover:text-[#b70011] transition-colors line-clamp-1 max-w-[110px] text-center font-headline-sm">
                        {cat.name}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="text-gray-400 text-sm py-4 text-center w-full">Không có danh mục nào được tìm thấy.</div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Flash Sale Section */}
        {flashSaleBooks.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flash-sale-gradient rounded-[28px] p-6 md:p-10 relative overflow-hidden shadow-xl">
              {/* Background Accent Gradients */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#b70011]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#ffb4ab]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 relative z-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-3xl md:text-4xl">bolt</span>
                    FLASH SALE
                  </h2>
                  <p className="text-white/60 text-xs md:text-sm mt-1">Giảm giá lên đến 50% chỉ trong hôm nay</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-white/60 font-semibold text-xs tracking-wider">KẾT THÚC SAU</span>
                  <div className="flex gap-2 font-mono">
                    {parseInt(d) > 0 && (
                      <>
                        <div className="bg-[#b70011] text-white w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shadow-md border border-white/5">{d}d</div>
                        <span className="text-[#ffb4ab] self-center font-black text-xl">:</span>
                      </>
                    )}
                    <div className="bg-[#b70011] text-white w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shadow-md border border-white/5">{h}</div>
                    <span className="text-[#ffb4ab] self-center font-black text-xl">:</span>
                    <div className="bg-[#b70011] text-white w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shadow-md border border-white/5">{m}</div>
                    <span className="text-[#ffb4ab] self-center font-black text-xl">:</span>
                    <div className="bg-[#b70011] text-white w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shadow-md border border-white/5">{s}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 relative z-10">
                {flashSaleBooks.map(book => (
                  <BookCard key={book.id} b={book} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Trending Best Sellers Section */}
        {bestSellers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-white rounded-[28px] border border-[#191c1e]/5 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-[#f2f4f6]">
                <div>
                  <h2 className="font-extrabold text-2xl md:text-3xl text-[#191c1e] font-headline-lg">Bán Chạy Nhất</h2>
                  <div className="w-12 h-1 bg-[#b70011] mt-2 rounded-full"></div>
                </div>
                <Link href="/user/catalog" className="text-[#b70011] font-bold text-xs hover:underline flex items-center gap-1 uppercase tracking-wider">
                  Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {bestSellers.slice(0, 10).map(book => (
                  <BookCard key={book.id} b={book} onAddToCart={addToCart} />
                ))}
              </div>

              {bestSellersPage + 1 < bestSellersTotalPages && (
                <div className="flex justify-center mt-10 pt-4">
                  <button 
                    onClick={handleLoadMoreBest} 
                    disabled={loadingBestSellers}
                    className="border-2 border-[#191c1e] hover:bg-[#191c1e] hover:text-white text-[#191c1e] font-bold text-sm px-8 py-3 rounded-full transition-all duration-300 shadow-sm disabled:opacity-40"
                  >
                    {loadingBestSellers ? "Đang tải thêm..." : "Xem thêm sách bán chạy"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. New Audiobooks Section (Immersive Design) */}
        <section className="bg-[#f2f4f6] py-16 border-y border-[#e6e8ea]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-extrabold text-2xl md:text-3xl text-[#191c1e] font-headline-lg">Sách Nói Mới</h2>
                <p className="text-gray-500 text-xs md:text-sm mt-1.5">Trải nghiệm âm thanh đỉnh cao, đọc mọi lúc mọi nơi.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => scrollAudio("left")}
                  className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center bg-white text-[#191c1e] hover:bg-[#b70011] hover:text-white hover:border-[#b70011] transition-all duration-300 shadow-sm"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <button 
                  onClick={() => scrollAudio("right")}
                  className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center bg-white text-[#191c1e] hover:bg-[#b70011] hover:text-white hover:border-[#b70011] transition-all duration-300 shadow-sm"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Scrollable container */}
            <div 
              ref={audioScrollRef}
              className="flex gap-6 overflow-x-auto no-scrollbar py-4"
            >
              {audioBooksList.map((book) => {
                const physicalPrice = Number(book.price) || 0;
                // Nếu chưa cấu hình giá sách nói thì mặc định = 0
                const audioPrice = book.audioPrice ? Number(book.audioPrice) : 0;
                const formattedAudioPrice = new Intl.NumberFormat("vi-VN").format(audioPrice);
                
                let imageSrc = "/images/book-default.jpg";
                if (book.imageUrl && book.imageUrl.trim()) {
                  let cleanUrl = book.imageUrl;
                  if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
                  imageSrc = `${API_URL}/uploads/books/${cleanUrl}`;
                }

                return (
                  <div 
                    key={`audio-${book.id}`}
                    className="group flex bg-white p-4 rounded-2xl border border-[#e6e8ea] hover:border-[#b70011]/30 transition-all duration-300 book-card-shadow shrink-0 w-[290px] md:w-[340px]"
                  >
                    {/* Audio Thumbnail Cover */}
                    <Link href={`/user/books/${book.id}`} className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 relative overflow-hidden rounded-xl bg-[#f2f4f6] flex items-center justify-center p-2 block group/audiocover cursor-pointer">
                      <img 
                        alt={book.title} 
                        className="w-full h-full object-contain group-hover/audiocover:scale-110 transition-transform duration-500" 
                        src={imageSrc}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                      />
                      {/* Play Button Overlay */}
                      <div 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/user/books/${book.id}/audiobook`); }}
                        className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover/audiocover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-white text-3xl fill-1 scale-90 group-hover/audiocover:scale-100 transition-transform duration-300">play_circle</span>
                      </div>
                    </Link>

                    {/* Metadata Content */}
                    <div className="ml-4 flex flex-col justify-center overflow-hidden flex-1">
                      <span className="text-[9px] font-extrabold tracking-widest text-[#b70011] bg-[#b70011]/10 px-2 py-0.5 rounded w-fit mb-2 uppercase font-label-sm">
                        Audiobook
                      </span>
                      <Link href={`/user/books/${book.id}`} className="block">
                        <h4 className="font-semibold text-sm md:text-base text-[#191c1e] truncate mb-1 group-hover:text-[#b70011] transition-colors leading-snug">
                          {book.title}
                        </h4>
                      </Link>
                      <p className="text-gray-500 text-xs mb-3 truncate font-medium">{book.authorName || "Nguyễn Nhật Ánh"}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#b70011] text-sm md:text-base">{formattedAudioPrice} ₫</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-medium uppercase font-semibold">Đã bán {book.soldCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. New Physical Books Section */}
        {newBooksNotInFlashSale.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-white rounded-[28px] border border-[#191c1e]/5 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-[#f2f4f6]">
                <div>
                  <h2 className="font-extrabold text-2xl md:text-3xl text-[#191c1e] font-headline-lg">Sách Giấy Mới Cập Nhật</h2>
                  <div className="w-12 h-1 bg-[#b70011] mt-2 rounded-full"></div>
                </div>
                <Link href="/user/catalog" className="text-[#b70011] font-bold text-xs hover:underline flex items-center gap-1 uppercase tracking-wider">
                  Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {newBooksNotInFlashSale.slice(0, 10).map(book => (
                  <BookCard key={book.id} b={book} onAddToCart={addToCart} />
                ))}
              </div>

              {newBooksPage + 1 < newBooksTotalPages && (
                <div className="flex justify-center mt-10 pt-4">
                  <button 
                    onClick={handleLoadMoreNew} 
                    disabled={loadingNewBooks}
                    className="border-2 border-[#191c1e] hover:bg-[#191c1e] hover:text-white text-[#191c1e] font-bold text-sm px-8 py-3 rounded-full transition-all duration-300 shadow-sm disabled:opacity-40"
                  >
                    {loadingNewBooks ? "Đang tải thêm..." : "Xem thêm sách mới"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
        
      </main>
      
      <Footer />

      {/* Styled Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { 
          from { opacity: 0; transform: translateY(8px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in { animation: fade-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .book-card-shadow {
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
        }
        .book-card-shadow:hover {
          box-shadow: 0 12px 30px -5px rgba(183, 0, 17, 0.08);
        }
        .flash-sale-gradient {
          background: linear-gradient(135deg, #191c1e 0%, #2d3133 100%);
        }
      `}} />
    </div>
  );
}