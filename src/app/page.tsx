
"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Custom Premium BookCard Component - Fahasa Large Standalone Cover Edition
interface BookCardProps {
  b: any;
  onAddToCart: (book: any, redirect?: boolean) => void;
  showFormatBadges?: boolean;
}

function BookCard({ b, onAddToCart }: BookCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!b?.id) return;

    authFetch(`${API_URL}/api/books/${b.id}/reviews`)
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
  const exhibitorsDiscount = b?.discountPrice !== undefined && b?.discountPrice !== null;
  const discountPriceRaw = exhibitorsDiscount ? Number(b.discountPrice) : price;
  const hasDiscount = exhibitorsDiscount && discountPriceRaw >= 0 && discountPriceRaw < price;

  const discountPercent = b?.discountValue
    ? Number(b.discountValue)
    : (hasDiscount ? Math.round((1 - discountPriceRaw / price) * 100) : 0);

  const finalPrice = hasDiscount ? discountPriceRaw : price;
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(finalPrice);
  const formattedOriginal = hasDiscount ? new Intl.NumberFormat("vi-VN").format(price) : null;

  // Kiểm tra điều kiện thực sự khả dụng của Audio Book
  const audioPriceNum = Number(b?.audioPrice) || 0;
  const isAudioAvailable = audioPriceNum > 0 && (b?.audioUrl || b?.hasChapters || b?.audioPrice);
  const formattedAudioPrice = new Intl.NumberFormat("vi-VN").format(audioPriceNum);

  const handleImageError = () => { if (!imgError) setImgError(true); };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/user/books/${b?.id}/audiobook`);
  };

  if (!b) return null;

  return (
    <div className="bg-white rounded-2xl p-3 md:p-4 transition-all duration-300 hover:-translate-y-2 group book-card-shadow border border-[#191c1e]/5 flex flex-col relative overflow-hidden">
      {/* KHÔNG CÓ DIV BỌC ẢNH XÁM: Bìa sách hiển thị trực tiếp to đẹp chuẩn Fahasa */}
      <Link href={`/user/books/${b.id}`} className="relative aspect-[3/4] mb-3 md:mb-4 overflow-hidden flex items-center justify-center cursor-pointer block group/cover">
        <img
          src={getImageSrc()}
          alt={b.title}
          className="w-full h-full object-contain transition-transform duration-500 group-hover/cover:scale-105 drop-shadow-md"
          onError={handleImageError}
        />

        {/* Badge Giảm Giá */}
        {hasDiscount && (
          <div className="absolute top-1 left-1 z-10">
            <span className="px-2 py-0.5 bg-[#b70011] text-white text-[10px] font-bold rounded-md shadow-md w-fit">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Hover Listen Overlay Button */}
        {isAudioAvailable && (
          <button
            onClick={handlePlayAudio}
            className="absolute bottom-1 right-1 w-9 h-9 bg-[#b70011]/90 hover:bg-[#b70011] text-white rounded-full flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 shadow-lg transform hover:scale-105 z-20 backdrop-blur-sm cursor-pointer"
            title="Nghe sách nói ngay"
          >
            <span className="material-symbols-outlined text-[16px] fill-1">play_arrow</span>
          </button>
        )}

        {b.quantity <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10 rounded-lg">
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
            <h3 className="font-bold text-sm mb-1 truncate text-[#191c1e] group-hover:text-[#b70011] transition-colors leading-snug">
              {b.title}
            </h3>
          </Link>
          <p className="text-gray-500 text-xs mb-1 truncate font-medium">
            {b.authorNames && b.authorNames.length > 0
              ? b.authorNames.join(", ")
              : (b.authors && b.authors.length > 0
                ? b.authors.map((a: any) => a.name).join(", ")
                : (b.authorName || "Đang cập nhật"))}
          </p>

          <div className="flex items-center gap-1 mb-2.5">
            <span className="material-symbols-outlined text-[14px] text-yellow-500 fill-1">star</span>
            <span className="text-xs font-bold text-[#191c1e]">{rating && rating > 0 ? rating.toFixed(1) : "4.8"}</span>
            <span className="text-gray-400 text-xs">({reviewCount > 0 ? reviewCount : Math.floor(b.id * 7 % 60 + 15)})</span>
          </div>
        </div>

        <div>
          {/* MỤC 3: Hiển thị giá tiền rõ ràng minh bạch */}
          <div className="space-y-0.5 mb-3 border-t border-[#f2f4f6] pt-2 font-medium text-sm">
            <div className="text-[#191c1e] font-bold">
              {formattedPrice} ₫
            </div>
            
            {/* CHỈ HIỂN THỊ GIÁ AUDIO KHI SẢN PHẨM THỰC SỰ KHẢ DỤNG AUDIO */}
            {isAudioAvailable && (
              <div className="text-[#b70011] text-xs font-semibold">
                Giá Audio: {formattedAudioPrice} ₫
              </div>
            )}
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
              className="w-8 h-8 bg-[#f2f4f6] hover:bg-[#b70011] text-[#191c1e] hover:text-white transition-all duration-300 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:hover:bg-[#f2f4f6] disabled:hover:text-gray-400 cursor-pointer"
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
  
  // States cho Banner động (MỤC 1)
  const [activeBanners, setActiveBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // States Dữ liệu Sách
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

  const audioScrollRef = useRef<HTMLDivElement>(null);
  const [audioBooksList, setAudioBooksList] = useState<any[]>([]);
  const [loadingAudioBooks, setLoadingAudioBooks] = useState(false);

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

  // Fetch Banner Hoạt động (MỤC 1)
  const fetchActiveBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/banners/active`);
      if (res.ok) {
        const data = await res.json();
        setActiveBanners(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách banner client:", err);
    }
  };

  const fetchNewBooks = async (page: number, isLoadMore = false) => {
    try {
      setLoadingNewBooks(true);
      const res = await authFetch(`${API_URL}/api/books/new?page=${page}&size=10&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        let content = data.content || (Array.isArray(data) ? data : []);
        content = content.filter((b: any) => b.active !== false);
        const totalPages = data.totalPages || 1;

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

        content = content.map((book: any) => {
          const flashInfo = flashMap.get(book.id);
          if (flashInfo) {
            return { ...book, discountPrice: flashInfo.discountPrice, discountValue: flashInfo.discountValue };
          }
          return book;
        });

        content = content.filter((book: any) => !flashMap.has(book.id));

        if (isLoadMore) {
          setNewBooks(prev => [...prev, ...content]);
        } else {
          setNewBooks(content);
        }
        setNewBooksTotalPages(totalPages);
      }
    } catch (err) {
      console.error("Fetch new books error:", err);
    } finally {
      setLoadingNewBooks(false);
    }
  };

  const fetchBestSellers = async (page: number, isLoadMore = false) => {
    try {
      setLoadingBestSellers(true);
      const res = await fetch(`${API_URL}/api/books/best-sellers?page=${page}&size=10`);
      let books: any[] = [];
      let totalPages = 0;
      if (res.ok) {
        const data = await res.json();
        books = data.content ?? (Array.isArray(data) ? data : []);
        books = books.filter((b: any) => b.active !== false);
        totalPages = data.totalPages ?? 1;
      }

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

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await fetch(`${API_URL}/api/books/flash-sale`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        let fBooks = Array.isArray(data) ? data : [];
        fBooks = fBooks.filter((b: any) => b.active !== false);
        fBooks.sort((a: any, b: any) => (Number(b.discountValue) || 0) - (Number(a.discountValue) || 0));
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
        console.error("Flash sale error:", err);
      }
    };
    fetchFlashSale();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setTopCategories(categories.slice(0, 6));
    }
  }, [categories]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchActiveBanners(),
        fetchNewBooks(0, false),
        fetchBestSellers(0, false),
        fetchAudioBooks(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const id = setInterval(() => {
      setCurrentBannerIndex(s => (s + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(id);
  }, [activeBanners]);

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

  const scrollAudio = (direction: "left" | "right") => {
    if (audioScrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      audioScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleLoadMoreNew = () => {
    if (newBooksPage + 1 < newBooksTotalPages) {
      fetchNewBooks(newBooksPage + 1, true);
      newBooksPage !== undefined && setNewBooksPage(prev => prev + 1);
    }
  };

  const handleLoadMoreBest = () => {
    if (bestSellersPage + 1 < bestSellersTotalPages) {
      fetchBestSellers(bestSellersPage + 1, true);
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

  const currentBanner = activeBanners.length > 0 ? activeBanners[currentBannerIndex] : null;

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

        {/* MỤC 1: Dynamic Hero Banner */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
          <div 
            onClick={() => {
              const targetLink = currentBanner?.link && currentBanner.link.trim() !== "" ? currentBanner.link : "/user/category/1";
              if (targetLink.startsWith("http")) {
                window.open(targetLink, "_blank");
              } else {
                router.push(targetLink);
              }
            }}
            className="relative rounded-3xl overflow-hidden aspect-auto w-full h-auto min-h-[300px] max-h-[500px] group shadow-2xl bg-[#191c1e] cursor-pointer"
          >
            {currentBanner ? (
              <>
                <img
                  alt="Promotion Banner"
                  className="w-full h-auto max-h-full object-contain object-center brightness-105 transition-transform duration-[1500ms] ease-out group-hover:scale-[1.01]"
                  src={currentBanner.image_url.startsWith("http") ? currentBanner.image_url : `${API_URL}${currentBanner.image_url}`}
                  loading="lazy"
                />

                <div className="absolute bottom-6 left-6 md:left-10 z-30 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetLink = currentBanner?.link && currentBanner.link.trim() !== "" ? currentBanner.link : "/user/category/1";
                      if (targetLink.startsWith("http")) {
                        window.open(targetLink, "_blank");
                      } else {
                        router.push(targetLink);
                      }
                    }}
                    className="relative inline-flex items-center gap-2.5 bg-gradient-to-r from-[#b70011] to-[#e61e2a] hover:from-[#dc2626] hover:to-[#ff2e3d] text-white px-6 py-3 rounded-2xl font-black text-xs md:text-sm tracking-wide uppercase shadow-[0_10px_25px_rgba(183,0,17,0.5)] border border-white/30 backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 group/btn overflow-hidden cursor-pointer"
                  >
                    <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover/btn:translate-x-[300%] transition-transform duration-1000 ease-out" />

                    <span className="material-symbols-outlined text-lg md:text-xl font-bold animate-bounce">
                      shopping_cart
                    </span>
                    <span className="drop-shadow-md">Mua Ngay</span>
                    <span className="material-symbols-outlined text-base font-bold transition-transform duration-300 group-hover/btn:translate-x-1.5">
                      arrow_forward
                    </span>
                  </button>
                </div>

                {activeBanners.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBannerIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-[#b70011] text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 cursor-pointer shadow-lg"
                      aria-label="Banner trước"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-[#b70011] text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 cursor-pointer shadow-lg"
                      aria-label="Banner tiếp theo"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 bg-[#191c1e]">
                <span className="material-symbols-outlined text-6xl mb-3 text-gray-600">collections</span>
                <p className="text-base font-semibold text-gray-300">Chào mừng bạn đến với Libris BookStore</p>
              </div>
            )}

            {activeBanners.length > 1 && (
              <div className="absolute bottom-6 right-6 md:right-10 flex items-center gap-2 z-30 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-lg">
                {activeBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex(index);
                    }}
                    aria-label={`Chuyển tới slide ${index + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      index === currentBannerIndex ? "w-6 bg-[#b70011]" : "w-2 bg-white/40 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            )}
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
            <div className="bg-[#f25841] rounded-[8px] p-4 relative shadow-md">
              <div className="bg-white rounded-[8px] flex flex-col md:flex-row justify-between items-center px-4 py-3 mb-4 shadow-sm w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className="flex items-center">
                    <span className="italic font-black text-2xl text-[#f25841] tracking-tighter flex items-center">
                      FL<span className="material-symbols-outlined text-[#ffc107] text-[28px] mx-[-2px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>SH SALE
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

                <button
                  onClick={() => {
                    const container = document.getElementById('flash-sale-carousel');
                    if (container) {
                      container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
                    }
                  }}
                  className="text-[#0066cc] font-medium text-[13px] md:text-sm flex items-center hover:underline mt-3 md:mt-0 self-end md:self-auto cursor-pointer"
                >
                  Xem tất cả <span className="material-symbols-outlined text-[14px] ml-0.5 font-bold">chevron_right</span>
                </button>
              </div>

              <div id="flash-sale-carousel" className="flex overflow-x-auto gap-3 md:gap-4 relative z-10 scroll-smooth no-scrollbar pb-2 snap-x snap-mandatory">
                {flashSaleBooks.map(book => (
                  <div key={book.id} className="min-w-[160px] w-[calc(50%-6px)] md:min-w-[200px] md:w-[calc(25%-12px)] lg:min-w-[220px] lg:w-[calc(20%-13px)] shrink-0 snap-start">
                    <BookCard b={book} onAddToCart={addToCart} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Trending Best Sellers Section */}
        {bestSellers.length > 0 && (
          <section id="best-sellers-section" className="max-w-7xl mx-auto px-4 md:px-8">
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
                {bestSellers.map(book => (
                  <BookCard key={book.id} b={book} onAddToCart={addToCart} />
                ))}
              </div>

              {bestSellersPage + 1 < bestSellersTotalPages && (
                <div className="flex justify-center mt-10 pt-4">
                  <button
                    onClick={handleLoadMoreBest}
                    disabled={loadingBestSellers}
                    className="px-8 py-3 bg-[#f2f4f6] hover:bg-[#b70011] text-[#191c1e] hover:text-white rounded-full text-xs font-bold transition-all duration-300 shadow-sm border border-transparent hover:shadow-md cursor-pointer"
                  >
                    {loadingBestSellers ? "Đang tải..." : "Xem Thêm Siêu Phẩm"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4.5. Audio Books Section */}
        {audioBooksList.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-gradient-to-br from-[#191c1e] to-[#2c3e50] rounded-[28px] border border-[#191c1e]/5 p-6 md:p-8 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/10 relative z-10">
                <div>
                  <h2 className="font-extrabold text-2xl md:text-3xl text-white font-headline-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#ffc107] text-[32px] fill-1" style={{fontVariationSettings: "'FILL' 1"}}>headphones</span>
                    Sách Nói Mới Nhất
                  </h2>
                  <div className="w-12 h-1 bg-[#b70011] mt-2 rounded-full"></div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => scrollAudio('left')}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#b70011] text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 border border-white/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button 
                    onClick={() => scrollAudio('right')}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#b70011] text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 border border-white/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>

              <div 
                ref={audioScrollRef}
                className="flex overflow-x-auto gap-3 md:gap-4 relative z-10 scroll-smooth no-scrollbar pb-2 snap-x snap-mandatory"
              >
                {audioBooksList.map((book) => (
                  <div key={book.id} className="min-w-[160px] w-[calc(50%-6px)] md:min-w-[200px] md:w-[calc(25%-12px)] lg:min-w-[220px] lg:w-[calc(20%-13px)] shrink-0 snap-start">
                    <BookCard b={book} onAddToCart={addToCart} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. New Books Section */}
        {newBooks.length > 0 && (
          <section id="new-books-section" className="max-w-7xl mx-auto px-4 md:px-8">
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
                    className="px-8 py-3 bg-[#f2f4f6] hover:bg-[#b70011] text-[#191c1e] hover:text-white rounded-full text-xs font-bold transition-all duration-300 shadow-sm border border-transparent hover:shadow-md cursor-pointer"
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
    </div>
  );
}
