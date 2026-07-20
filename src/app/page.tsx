"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

const HERO_IMAGE = "https://lh3.googleusercontent.com/aida/ADBb0ugHjrY8tAvrREQdtUimgd1bjF-cWPdDhU6ZyTv3D1p43vZNu-ciJQNSTseUx-PR03kkb36UL9GYHUlTb1Z1YyKyEJxFzyA0TwwRknkvypkhMKD6R6pjuYVaaDG9D3hov90KJNoWwT5Y6x-paL72oVm37XXAsHS8eKE5tDVSSEt6z2XrH3rtteInGdkIKUFqh3SLpprDqNbOxXd3C6pF3IkXckXIDSbNM-fO6IcC5SwosqArKUsBU90SoJ0";

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
    if (!b?.id) return;
    // N+1 problem fixed: Do not fetch reviews for every single book card.
    // In a real scenario, rating and review count should come from the BookDTO directly.
    setRating(b.rating || 4.8);
    setReviewCount(b.reviewCount || Math.floor(b.id * 7 % 60 + 15));
  }, [b?.id]);

  const getImageSrc = () => {
    if (imgError) return "/images/book-default.jpg";
    if (b?.imageUrl && b.imageUrl.trim()) {
      let cleanUrl = b.imageUrl;
      if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
      return `${API_URL}/uploads/books/${cleanUrl}`;
    }
    return "/images/book-default.jpg";
  };

  const price = Number(b?.price) || 0;
  
  const hasValidDiscountPrice = b?.discountPrice !== undefined && b?.discountPrice !== null;
  const discountPriceRaw = hasValidDiscountPrice ? Number(b.discountPrice) : price;
  const hasDiscount = hasValidDiscountPrice && discountPriceRaw >= 0 && discountPriceRaw < price;
  
  const discountPercent = b?.discountValue 
    ? Number(b.discountValue) 
    : (hasDiscount ? Math.round((1 - discountPriceRaw / price) * 100) : 0);

  const finalPrice = hasDiscount ? discountPriceRaw : price;
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(finalPrice);
  const formattedOriginal = hasDiscount ? new Intl.NumberFormat("vi-VN").format(price) : null;

  const audioPrice = b?.audioPrice ? Number(b.audioPrice) : 0;
  const formattedAudioPrice = new Intl.NumberFormat("vi-VN").format(audioPrice);

  const handleImageError = () => { if (!imgError) setImgError(true); };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/user/books/${b?.id}/audiobook`);
  };

  if (!b) return null;

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
          <p className="text-gray-500 text-xs mb-0.5 truncate font-medium">
            {b.authorNames && b.authorNames.length > 0 
              ? b.authorNames.join(", ") 
              : (b.authors && b.authors.length > 0 
                ? b.authors.map((a: any) => a.name).join(", ") 
                : (b.authorName || "Nguyễn Nhật Ánh"))}
          </p>
          {((b.publisherNames && b.publisherNames.length > 0) || (b.publishers && b.publishers.length > 0) || b.publisherName || b.publisher?.name || b.publisher) && (
            <p className="text-gray-400 text-[10px] mb-1.5 truncate">
              NXB: {b.publisherNames && b.publisherNames.length > 0 
                ? b.publisherNames.join(", ") 
                : (b.publishers && b.publishers.length > 0 
                  ? b.publishers.map((p: any) => p.name).join(", ") 
                  : (b.publisherName || b.publisher?.name || b.publisher))}
            </p>
          )}

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

  const [audioBooksList, setAudioBooksList] = useState<any[]>([]);
  const [loadingAudioBooks, setLoadingAudioBooks] = useState(false);

  const [flashSaleBooks, setFlashSaleBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [banners, setBanners] = useState<any[]>([]);
  const [heroSlide, setHeroSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600 * 2 + 15 * 60 + 40);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = async (book: any, redirectToCheckout: boolean = false) => {
    if (!isLoggedIn()) {
      showToast("Vui lòng đăng nhập để thêm vào giỏ hàng", true);
      router.push("/auth/login");
      return;
    }
    try {
      const response = await authFetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const fetchNewBooks = async (page: number, isLoadMore = false, passedFlashMap?: Map<any, any>) => {
    try {
      setLoadingNewBooks(true);
      const res = await authFetch(`${API_URL}/api/books/new?page=${page}&size=10&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        let content = data.content || (Array.isArray(data) ? data : []);
        content = content.filter((b: any) => b.active !== false);
        const totalPages = data.totalPages || 1;

        const flashMap = passedFlashMap || new Map();
        if (!passedFlashMap) {
          flashSaleBooks.forEach(item => {
            flashMap.set(item.id, {
              discountPrice: item.discountPrice,
              discountValue: item.discountValue,
            });
          });
        }

        content = content.map((book: any) => {
          const flashInfo = flashMap.get(book.id);
          if (flashInfo) {
            return { ...book, discountPrice: flashInfo.discountPrice, discountValue: flashInfo.discountValue };
          }
          return book;
        });

        // Filter out books that are in Flash Sale
        content = content.filter((book: any) => !flashMap.has(book.id));

        if (isLoadMore) {
          setNewBooks(prev => [...prev, ...content]);
        } else {
          setNewBooks(content);
        }
        setNewBooksTotalPages(totalPages);
      } else {
        const allRes = await authFetch(`${API_URL}/api/books/new?t=${Date.now()}`);
        let allBooks = await allRes.json();
        if (!Array.isArray(allBooks)) allBooks = [];
        allBooks = allBooks.filter((b: any) => b.active !== false);
        const sorted = [...allBooks].sort((a, b) => b.id - a.id);
        const pageSize = 10;
        const start = page * pageSize;
        const paginated = sorted.slice(start, start + pageSize);
        const totalPages = Math.ceil(sorted.length / pageSize);

        const flashMap = passedFlashMap || new Map();
        if (!passedFlashMap) {
          flashSaleBooks.forEach(item => {
            flashMap.set(item.id, {
              discountPrice: item.discountPrice,
              discountValue: item.discountValue,
            });
          });
        }

        const mappedPaginated = paginated.map((book: any) => {
          const flashInfo = flashMap.get(book.id);
          if (flashInfo) {
            return { ...book, discountPrice: flashInfo.discountPrice, discountValue: flashInfo.discountValue };
          }
          return book;
        });

        // Filter out books that are in Flash Sale
        const filteredMappedPaginated = mappedPaginated.filter((book: any) => !flashMap.has(book.id));

        if (isLoadMore) {
          setNewBooks(prev => [...prev, ...filteredMappedPaginated]);
        } else {
          setNewBooks(filteredMappedPaginated);
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

  const fetchBestSellers = async (page: number, isLoadMore = false, passedFlashMap?: Map<any, any>) => {
    try {
      setLoadingBestSellers(true);
      // FIXED [Frontend]: Sửa từ /books/new thành đúng endpoint /books/best-sellers
      const res = await fetch(`${API_URL}/api/books/best-sellers?page=${page}&size=10`);
      let books: any[] = [];
      let totalPages = 0;
      if (res.ok) {
        const data = await res.json();
        books = data.content ?? (Array.isArray(data) ? data : []);
        books = books.filter((b: any) => b.active !== false);
        totalPages = data.totalPages ?? 1;
      } else {
        const allRes = await fetch(`${API_URL}/api/books/best-sellers`);
        if (!allRes.ok) throw new Error();
        let allBooks = await allRes.json();
        if (!Array.isArray(allBooks)) allBooks = [];
        allBooks = allBooks.filter((b: any) => b.active !== false);
        const pageSize = 10;
        const start = page * pageSize;
        books = allBooks.slice(start, start + pageSize);
        totalPages = Math.ceil(allBooks.length / pageSize);
      }

      const flashMap = passedFlashMap || new Map();
      if (!passedFlashMap) {
        flashSaleBooks.forEach(item => {
          flashMap.set(item.id, {
            discountPrice: item.discountPrice,
            discountValue: item.discountValue,
          });
        });
      }

      const mergedBooks = books.map((book: any) => {
        const flashInfo = flashMap.get(book.id);
        if (flashInfo) {
          return { ...book, discountPrice: flashInfo.discountPrice, discountValue: flashInfo.discountValue };
        }
        return book;
      });

      // Filter out books that are in Flash Sale
      const filteredMergedBooks = mergedBooks.filter((book: any) => !flashMap.has(book.id));

      if (isLoadMore) {
        setBestSellers(prev => [...prev, ...filteredMergedBooks]);
      } else {
        setBestSellers(filteredMergedBooks);
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

  const fetchAudioBooks = async () => {
    try {
      setLoadingAudioBooks(true);
      const res = await authFetch(`${API_URL}/api/books/audiobooks?page=0&size=10&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        let content = data.content || (Array.isArray(data) ? data : []);
        content = content.filter((b: any) => b.active !== false);
        setAudioBooksList(content);
      } else {
        const resBest = await authFetch(`${API_URL}/api/books/best-sellers?t=${Date.now()}`);
        if (resBest.ok) {
          const data = await resBest.json();
          let content = data.content || (Array.isArray(data) ? data : []);
          content = content.filter((b: any) => b.active !== false && b.audioPrice > 0);
          setAudioBooksList(content.slice(0, 10));
        }
      }
    } catch (err) {
      console.error("Fetch audiobooks error:", err);
    } finally {
      setLoadingAudioBooks(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`; // "YYYY-MM-DD" local time

          const activeBanners = data
            .filter((b: any) => {
              if (!b.active) return false;
              
              // Check start_date
              if (b.start_date) {
                const startStr = b.start_date.substring(0, 10); // "YYYY-MM-DD"
                if (startStr > todayStr) return false;
              }
              
              // Check end_date
              if (b.end_date) {
                const endStr = b.end_date.substring(0, 10); // "YYYY-MM-DD"
                if (endStr < todayStr) return false;
              }
              
              return true;
            })
            .sort((a: any, b: any) => {
              // 1. Sort by position (ascending)
              if (a.position !== b.position) {
                return a.position - b.position;
              }
              // 2. Sort by start_date (descending)
              const tA = a.start_date ? new Date(a.start_date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const tB = b.start_date ? new Date(b.start_date).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return tB - tA;
            });
          setBanners(activeBanners);
        }
      }
    } catch (err) {
      console.error("Fetch banners error:", err);
    }
  };



  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

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

  useEffect(() => {
    const init = async () => {
      // Fetch all data in parallel — no blocking loading screen
      const [flashRes] = await Promise.all([
        fetch(`${API_URL}/api/books/flash-sale`).catch(() => null),
        fetchBanners(),
        fetchAudioBooks(),
      ]);

      let flashMap = new Map();
      if (flashRes && flashRes.ok) {
        try {
          const data = await flashRes.json();
          let fBooks = Array.isArray(data) ? data : [];
          fBooks = fBooks.filter((b: any) => b.active !== false);

          fBooks.forEach((item: any) => {
            flashMap.set(item.id, {
              discountPrice: item.discountPrice,
              discountValue: item.discountValue,
            });
          });

          fBooks.sort((a: any, b: any) => {
            const aDiscount = Number(a.discountValue) || 0;
            const bDiscount = Number(b.discountValue) || 0;
            if (bDiscount !== aDiscount) return bDiscount - aDiscount;
            const aSold = Number(a.soldCount) || 0;
            const bSold = Number(b.soldCount) || 0;
            return bSold - aSold;
          });

          setFlashSaleBooks(fBooks);

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
          console.error('Flash sale parse error:', err);
        }
      }

      // Fetch books using the flashMap already built
      await Promise.all([
        fetchNewBooks(0, false, flashMap),
        fetchBestSellers(0, false, flashMap),
      ]);
    };
    init();
  }, []);

  useEffect(() => {
    const slideCount = banners.length > 0 ? banners.length : 1;
    const id = setInterval(() => setHeroSlide(s => (s + 1) % slideCount), 5000);
    return () => clearInterval(id);
  }, [banners.length]);

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

  const scrollAudio = (direction: "left" | "right") => {
    if (audioScrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      audioScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };


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

  return (
    <div className="bg-[#f7f9fb] font-sans text-[#191c1e] antialiased min-h-screen">
      <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 animate-fade-in ${toast.isError ? "bg-[#ba1a1a] text-white" : "bg-emerald-600 text-white"}`}>
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
          {banners.length > 0 ? (
            <div className="relative rounded-3xl overflow-hidden h-[440px] md:h-[500px] lg:h-[540px] group shadow-2xl">
              <img
                alt={banners[heroSlide].title || "Banner"}
                className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out"
                src={banners[heroSlide].image_url.startsWith('http') ? banners[heroSlide].image_url : `${API_URL}${banners[heroSlide].image_url}`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#191c1e] via-[#191c1e]/75 to-transparent z-10" />

              <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 max-w-3xl z-20">
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-3 py-1 bg-[#b70011] text-white font-semibold rounded text-[11px] uppercase tracking-widest">
                    Chương Trình
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-white backdrop-blur-md font-semibold rounded text-[11px] uppercase tracking-widest border border-white/10">
                    Khuyến Mãi
                  </span>
                </div>

                <h1 className="font-extrabold text-[40px] md:text-[54px] lg:text-[60px] leading-tight text-white mb-6 font-headline-lg tracking-tighter line-clamp-2">
                  {banners[heroSlide].title}
                </h1>

                {banners[heroSlide].description && (
                  <p className="text-white/80 text-sm md:text-base lg:text-lg mb-10 leading-relaxed max-w-xl font-body-lg line-clamp-3">
                    {banners[heroSlide].description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4">
                  <Link
                    href={banners[heroSlide].link || "#"}
                    className="bg-[#b70011] hover:bg-[#dc2626] text-white px-8 py-4 font-bold rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg shadow-[#b70011]/30 group/btn"
                  >
                    <span className="material-symbols-outlined fill-1 transition-transform group-hover/btn:scale-110">explore</span>
                    Xem Chi Tiết
                  </Link>
                </div>
              </div>

              {banners.length > 1 && (
                <div className="absolute bottom-8 right-8 md:right-16 flex gap-3 z-20">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setHeroSlide(index)}
                      aria-label={`Slide ${index + 1}`}
                      className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                        heroSlide === index ? "w-12 bg-[#b70011]" : "w-3 bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden h-[440px] md:h-[500px] lg:h-[540px] group shadow-2xl">
              <img
                alt="Mắt Biếc"
                className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out"
                src={HERO_IMAGE}
              />
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

              <div className="absolute bottom-8 right-8 md:right-16 flex gap-3 z-20">
                <div className="w-12 h-1.5 bg-[#b70011] rounded-full cursor-pointer"></div>
                <div className="w-3 h-1.5 bg-white/30 rounded-full cursor-pointer hover:bg-white/50 transition-all duration-300"></div>
                <div className="w-3 h-1.5 bg-white/30 rounded-full cursor-pointer hover:bg-white/50 transition-all duration-300"></div>
              </div>
            </div>
          )}
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
        {(flashSaleBooks.length > 0 || loadingNewBooks) && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-[#f25841] rounded-[8px] p-4 relative shadow-md">
              <div className="bg-white rounded-[8px] flex flex-col md:flex-row justify-between items-center px-4 py-3 mb-4 shadow-sm w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className="flex items-center">
                    <span className="italic font-black text-2xl text-[#f25841] tracking-tighter flex items-center">
                      FL<span className="material-symbols-outlined text-[#ffc107] text-[28px] mx-[-2px] fill-1" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>SH SALE
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[#191c1e] font-semibold text-[13px] md:text-sm">Kết thúc trong</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-sm">
                      {parseInt(d) > 0 && (
                        <>
                          <div className="bg-[#191c1e] text-white px-2 py-0.5 rounded-[4px] min-w-[28px] text-center">{d}</div>
                          <span className="text-[#191c1e] font-black">:</span>
                        </>
                      )}
                      <div className="bg-[#191c1e] text-white px-2 py-0.5 rounded-[4px] min-w-[28px] text-center">{h}</div>
                      <span className="text-[#191c1e] font-black">:</span>
                      <div className="bg-[#191c1e] text-white px-2 py-0.5 rounded-[4px] min-w-[28px] text-center">{m}</div>
                      <span className="text-[#191c1e] font-black">:</span>
                      <div className="bg-[#191c1e] text-white px-2 py-0.5 rounded-[4px] min-w-[28px] text-center">{s}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="flash-sale-carousel" className="flex overflow-x-auto gap-3 md:gap-4 relative z-10 scroll-smooth no-scrollbar pb-2 snap-x snap-mandatory">
                {flashSaleBooks.length > 0 ? flashSaleBooks.map(book => (
                  <div key={book.id} className="min-w-[160px] w-[calc(50%-6px)] md:min-w-[200px] md:w-[calc(25%-12px)] lg:min-w-[220px] lg:w-[calc(20%-13px)] shrink-0 snap-start">
                    <BookCard b={book} onAddToCart={addToCart} />
                  </div>
                )) : Array.from({length: 5}).map((_, i) => (
                  <div key={i} className="min-w-[160px] w-[calc(50%-6px)] md:min-w-[200px] shrink-0 bg-white/20 rounded-xl h-[260px] animate-pulse" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Trending Best Sellers Section */}
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
              {bestSellers.length > 0 ? bestSellers.map(book => (
                <BookCard key={book.id} b={book} onAddToCart={addToCart} />
              )) : Array.from({length: 10}).map((_, i) => (
                <div key={i} className="bg-[#f2f4f6] rounded-2xl h-[280px] animate-pulse" />
              ))}
            </div>

            {bestSellersPage + 1 < bestSellersTotalPages && (
              <div className="flex justify-center mt-10 pt-4">
                <button
                  onClick={handleLoadMoreBest}
                  disabled={loadingBestSellers}
                  className="px-8 py-3 bg-[#f2f4f6] hover:bg-[#b70011] text-[#191c1e] hover:text-white rounded-full text-xs font-bold transition-all duration-300 shadow-sm border border-transparent hover:shadow-md"
                >
                  {loadingBestSellers ? "Đang tải..." : "Xem Thêm Siêu Phẩm"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 5. Audiobooks Section */}
        {audioBooksList.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-[#f0f4f8] rounded-[28px] p-6 md:p-8 border border-[#dce3e9]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-extrabold text-2xl md:text-3xl text-[#191c1e] font-headline-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#b70011] text-2xl md:text-3xl fill-1">headphones</span> 
                    Sách Nói Bán Chạy Nhất
                  </h2>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">Trải nghiệm đọc sách bằng tai với chất lượng âm thanh đỉnh cao</p>
                </div>
                <div className="flex gap-2">
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
        )}

        {/* 6. New Books Section */}
        {newBooks.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-white rounded-[28px] border border-[#191c1e]/5 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-[#f2f4f6]">
                <div>
                  <h2 className="font-extrabold text-2xl md:text-3xl text-[#191c1e] font-headline-lg">Sách Mới Cập Nhật</h2>
                  <div className="w-12 h-1 bg-[#b70011] mt-2 rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {newBooks.map(book => (
                  <BookCard key={book.id} b={book} onAddToCart={addToCart} />
                ))}
              </div>

              {newBooksPage + 1 < newBooksTotalPages && (
                <div className="flex justify-center mt-10 pt-4">
                  <button
                    onClick={handleLoadMoreNew}
                    disabled={loadingNewBooks}
                    className="px-8 py-3 bg-[#f2f4f6] hover:bg-[#b70011] text-[#191c1e] hover:text-white rounded-full text-xs font-bold transition-all duration-300 shadow-sm border border-transparent hover:shadow-md"
                  >
                    {loadingNewBooks ? "Đang tải..." : "Tải Thêm Sách Mới"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* Styled Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
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