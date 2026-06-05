"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const BANNERS = ["/uploads/s1.webp", "/uploads/s2.webp", "/uploads/s3.webp", "/uploads/s4.webp"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const BANNER_CONTENT = [
  {
    badge: "SÁCH MỚI NHẤT",
    title: "Khám Phá Thế Giới Qua Từng Trang Sách",
    sub: "Hàng ngàn đầu sách mới cập nhật mỗi ngày với ưu đãi độc quyền lên tới 25%."
  },
  {
    badge: "BEST SELLERS",
    title: "Tác Phẩm Bán Chạy Nhất Tuần",
    sub: "Tìm đọc các tác phẩm dẫn đầu xu hướng và được độc giả yêu thích đánh giá cao."
  },
  {
    badge: "FLASH SALE GIỜ VÀNG",
    title: "Đọc Sách Thả Ga Không Lo Về Giá",
    sub: "Cơ hội sở hữu những cuốn sách chất lượng cao với mức giá ưu đãi cực sốc hôm nay."
  },
  {
    badge: "DỊCH VỤ PREMIUM",
    title: "Trải Nghiệm Mua Sắm Hoàn Hảo",
    sub: "Giao hàng thần tốc, hỗ trợ đổi trả miễn phí 30 ngày bảo vệ người tiêu dùng."
  }
];

const getToken = () => {
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

// BookCard component
function BookCard({ b, onAddToCart }: { b: any; onAddToCart: (book: any, redirect?: boolean) => void }) {
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
          const avg =
            reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            reviews.length;
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
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(hasDiscount ? discountPriceRaw : price);
  const formattedOriginal = hasDiscount ? new Intl.NumberFormat("vi-VN").format(price) : null;

  const handleImageError = () => { if (!imgError) setImgError(true); };

  return (
    <div className="bg-white p-5 rounded-[32px] border border-[rgba(10,19,23,0.08)] hover:border-[rgba(10,19,23,0.18)] hover:shadow-lg transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden">
      {hasDiscount && (
        <div className="absolute top-3 left-3 z-10 bg-[#ffc700] text-[#0a1317] text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
          -{b.discountValue}%
        </div>
      )}
      <Link href={`user/books/${b.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[20px] bg-[#f4f6f8] flex items-center justify-center p-4">
          <img src={getImageSrc()} alt={b.title} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" onError={handleImageError} />
          {b.quantity <= 0 && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-[#C92127] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-full shadow-md tracking-wider">
                Hết hàng
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-[#0a1317] line-clamp-2 leading-snug mb-1 group-hover:text-[#C92127] transition-colors">
              {b.title}
            </h3>
            {b.authorName && <p className="text-[12px] text-gray-500 line-clamp-1 mb-2 font-medium">{b.authorName}</p>}
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              {hasDiscount ? (
                <>
                  <span className="text-[#C92127] font-black text-base">{formattedPrice} ₫</span>
                  <span className="text-gray-400 text-xs line-through">{formattedOriginal} ₫</span>
                </>
              ) : (
                <span className="text-[#0a1317] font-black text-base">{formattedPrice} ₫</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mb-3 text-[10px]">
              <div className="flex text-[#ffc700] gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>
                    {rating !== null && i < Math.round(rating) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              {reviewCount > 0 && (
                <span className="text-gray-400 font-medium">({reviewCount})</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-auto pt-2">
        <button
          onClick={(e) => { e.preventDefault(); if (b.quantity === undefined || b.quantity > 0) onAddToCart(b, false); }}
          disabled={b.quantity !== undefined && b.quantity <= 0}
          className="w-full bg-[#C92127] hover:bg-[#A8171C] text-white text-[13px] font-bold py-2.5 px-4 rounded-full transition duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {b.quantity !== undefined && b.quantity <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  // Sách mới
  const [newBooks, setNewBooks] = useState<any[]>([]);
  const [newBooksPage, setNewBooksPage] = useState(0);
  const [newBooksTotalPages, setNewBooksTotalPages] = useState(0);
  const [loadingNewBooks, setLoadingNewBooks] = useState(false);
  // Sách bán chạy
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [bestSellersPage, setBestSellersPage] = useState(0);
  const [bestSellersTotalPages, setBestSellersTotalPages] = useState(0);
  const [loadingBestSellers, setLoadingBestSellers] = useState(false);
  // Flash sale, categories
  const [flashSaleBooks, setFlashSaleBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Banner & timer
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

  // Lấy sách mới (phân trang)
  const fetchNewBooks = async (page: number, isLoadMore = false) => {
    try {
      setLoadingNewBooks(true);
      const res = await fetch(`${API_URL}/api/books/new?page=${page}&size=12`);
      if (res.ok) {
        const data = await res.json();
        const content = data.content || (Array.isArray(data) ? data : []);
        const totalPages = data.totalPages || 1;
        if (isLoadMore) {
          setNewBooks(prev => [...prev, ...content]);
        } else {
          setNewBooks(content);
        }
        setNewBooksTotalPages(totalPages);
      } else {
        // fallback
        const allRes = await fetch(`${API_URL}/api/books/new`);
        let allBooks = await allRes.json();
        if (!Array.isArray(allBooks)) allBooks = [];
        const sorted = [...allBooks].sort((a, b) => b.id - a.id);
        const pageSize = 12;
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

  // Lấy sách bán chạy (phân trang)
  const fetchBestSellers = async (page: number, isLoadMore = false) => {
    try {
      setLoadingBestSellers(true);
      const res = await fetch(`${API_URL}/api/books/new?page=${page}&size=10`);
      let books: any[] = [];
      let totalPages = 0;
      if (res.ok) {
        const data = await res.json();
        books = data.content ?? (Array.isArray(data) ? data : []);
        totalPages = data.totalPages ?? 1;
      } else {
        // fallback client-side
        const allRes = await fetch(`${API_URL}/api/books/new`);
        if (!allRes.ok) throw new Error();
        let allBooks = await allRes.json();
        if (!Array.isArray(allBooks)) allBooks = [];
        const pageSize = 10;
        const start = page * pageSize;
        books = allBooks.slice(start, start + pageSize);
        totalPages = Math.ceil(allBooks.length / pageSize);
      }
      // Gắn thông tin flash sale
      let flashMap = new Map();
      try {
        const flashRes = await fetch(`${API_URL}/api/books/new`);
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

  // Lấy flash sale
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await fetch(`${API_URL}/api/books/new`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setFlashSaleBooks(Array.isArray(data) ? data : []);
      } catch (err) {
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
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Tính top 5 danh mục bán chạy dựa trên bestSellers
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
        .slice(0, 5)
        .map(entry => entry[0]);
      let top = categories.filter(cat => sortedCatIds.includes(cat.id));
      if (top.length < 5) {
        const remaining = categories.filter(cat => !sortedCatIds.includes(cat.id)).slice(0, 5 - top.length);
        top = [...top, ...remaining];
      }
      setTopCategories(top.slice(0, 5));
    } else if (categories.length > 0) {
      setTopCategories(categories.slice(0, 5));
    }
  }, [bestSellers, categories]);

  // Khởi tạo dữ liệu
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

  // Banner & countdown
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % BANNERS.length), 4000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 3600 * 2));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
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

  if (loading) {
    return (
      <div className="bg-[#ffffff] min-h-screen font-sans">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-[#C92127] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-sm">Đang tải dữ liệu từ hệ thống...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#ffffff] min-h-screen font-sans">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center bg-[#f4f6f8] p-8 rounded-[32px] border border-[rgba(10,19,23,0.08)] max-w-md">
            <p className="text-[#0a1317] font-bold text-lg mb-2">Đã xảy ra lỗi kết nối</p>
            <p className="text-gray-500 text-sm mb-6">Không thể thiết lập liên kết đến máy chủ tại {API_URL}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#0a1317] hover:bg-[#202528] text-white rounded-full text-sm font-bold shadow-md transition">
              Thử lại ngay
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white font-sans text-[#0a1317] antialiased">
      <Navbar />
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#008a00] text-white px-5 py-3 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span> {toast}
        </div>
      )}
      
      <main className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6 space-y-16 pb-20">
        
        {/* Cinematic Hero Slider */}
        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-12 lg:col-span-8 relative rounded-[32px] overflow-hidden border border-[rgba(10,19,23,0.08)] h-[240px] md:h-[340px] lg:h-[380px] bg-[#f4f6f8] shadow-sm">
            <div className="relative h-full w-full">
              {BANNERS.map((src, i) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                  <img src={src} className="w-full h-full object-cover" alt={`Banner ${i + 1}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/1200x380/0a1317/white?text=BookStore+Banner+${i + 1}`; }} />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
                  
                  {/* Cinematic Typography Overlaid */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 md:p-10 select-none">
                    <span className="bg-[#ffc700] text-[#0a1317] text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full w-fit mb-3 uppercase">
                      {BANNER_CONTENT[i]?.badge}
                    </span>
                    <h1 className="text-white text-2xl md:text-4xl lg:text-[40px] font-black tracking-tight mb-2 max-w-xl leading-[1.15]">
                      {BANNER_CONTENT[i]?.title}
                    </h1>
                    <p className="text-white/80 text-[13px] md:text-[15px] max-w-md mb-6 leading-relaxed hidden md:block">
                      {BANNER_CONTENT[i]?.sub}
                    </p>
                    <div className="flex gap-3">
                      <button className="bg-white hover:bg-gray-100 text-[#0a1317] font-bold text-[13px] px-6 py-2.5 rounded-full shadow-sm transition duration-200">
                        Khám phá ngay
                      </button>
                      <button className="border-2 border-white/60 hover:border-white text-white hover:bg-white/10 font-bold text-[13px] px-5 py-2.5 rounded-full transition duration-200 bg-transparent hidden sm:block">
                        Xem danh mục
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Custom Dot Indicators */}
            <div className="absolute bottom-4 right-6 flex gap-2 z-20">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} className="h-1.5 rounded-full transition-all duration-300 bg-white"
                  style={{ width: i === slide ? 24 : 8, opacity: i === slide ? 1 : 0.4 }} />
              ))}
            </div>
          </section>
          
          {/* Vertical Promo Cards */}
          <div className="hidden lg:col-span-4 lg:flex flex-col gap-4 h-[380px]">
            {["/uploads/d1.webp", "/uploads/d2.webp"].map((src, i) => (
              <div key={i} className="flex-1 rounded-[32px] overflow-hidden border border-[rgba(10,19,23,0.08)] bg-[#f4f6f8] relative group cursor-pointer shadow-sm">
                <img src={src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x180/0a1317/white?text=Promo+Accessory+${i + 1}`; }} />
                <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Flash Sale Section */}
        {flashSaleBooks.length > 0 && (
          <section className="bg-white rounded-[32px] overflow-hidden border border-[rgba(10,19,23,0.08)] shadow-sm">
            <div className="bg-[#0a1317] p-5 md:p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="bg-[#ffc700] text-[#0a1317] text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  ⚡ FLASH SALE
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-white/90">
                  <span>Kết thúc trong:</span>
                  <div className="flex gap-1.5 items-center">
                    {[h, m, s].map((unit, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="bg-white/10 text-[#ffc700] px-2.5 py-1 rounded-lg font-mono font-bold text-[14px] border border-white/10">{unit}</span>
                        {idx < 2 && <span className="text-[#ffc700] font-black">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {flashSaleBooks.map(book => <BookCard key={book.id} b={book} onAddToCart={addToCart} />)}
              </div>
            </div>
          </section>
        )}

        {/* Trending Best Sellers Section */}
        {bestSellers.length > 0 && (
          <section className="bg-white rounded-[32px] border border-[rgba(10,19,23,0.08)] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-gray-100 pb-5">
              <span className="w-2.5 h-6 bg-[#C92127] rounded-full" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">Sách Bán Chạy Tuần Này</h2>
              <span className="text-[13px] text-gray-500 font-medium ml-auto hidden sm:block">Xu hướng mua sắm nổi bật</span>
            </div>
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {bestSellers.map(book => <BookCard key={book.id} b={book} onAddToCart={addToCart} />)}
              </div>
              {bestSellersPage + 1 < bestSellersTotalPages && (
                <div className="flex justify-center mt-8 pt-4">
                  <button onClick={handleLoadMoreBest} disabled={loadingBestSellers}
                    className="border-2 border-[#0a1317] hover:bg-[#0a1317] hover:text-white text-[#0a1317] font-bold text-[14px] px-8 py-3 rounded-full transition duration-200 shadow-sm disabled:opacity-40"
                  >
                    {loadingBestSellers ? "Đang tải thêm..." : "Xem thêm sách bán chạy"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Highlighted Categories Row */}
        <section className="bg-white rounded-[32px] border border-[rgba(10,19,23,0.08)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-gray-100 pb-5">
            <span className="w-2.5 h-6 bg-[#0a1317] rounded-full" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">Danh Mục Nổi Bật</h2>
            <span className="text-[13px] text-gray-500 font-medium ml-auto hidden sm:block">Tìm kiếm theo chủ đề ưa thích</span>
          </div>
          <div className="flex justify-between items-start gap-6 overflow-x-auto no-scrollbar py-2">
            {topCategories.length > 0 ? (
              topCategories.map((cat, i) => {
                // Image handling
                let imageSrc = `/uploads/e${(i % 10) + 1}.webp`;
                if (cat.imageUrl) {
                  if (cat.imageUrl.startsWith('http')) {
                    imageSrc = cat.imageUrl;
                  } else {
                    imageSrc = `${API_URL}${cat.imageUrl}`;
                  }
                }
                return (
                  <Link key={cat.id} href={`/user/category/${cat.id}`}
                    className="flex flex-col items-center gap-3 group cursor-pointer min-w-[110px] flex-1"
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#f4f6f8] border border-[rgba(10,19,23,0.08)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-[#C92127] group-hover:shadow-md relative overflow-hidden p-4">
                      <img
                        src={imageSrc}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `/uploads/e${(i % 10) + 1}.webp`;
                        }}
                      />
                    </div>
                    <span className="text-[13px] font-bold text-[#0a1317] text-center group-hover:text-[#C92127] transition-colors line-clamp-2 leading-snug max-w-[110px]">
                      {cat.name}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">Đang tải các danh mục...</p>
            )}
          </div>
        </section>

        {/* New Books Section */}
        {newBooksNotInFlashSale.length > 0 && (
          <section className="bg-white rounded-[32px] border border-[rgba(10,19,23,0.08)] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-gray-100 pb-5">
              <span className="w-2.5 h-6 bg-[#ffc700] rounded-full" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">Sách Mới Cập Nhật</h2>
              <span className="text-[13px] text-gray-500 font-medium ml-auto hidden sm:block">Các tác phẩm mới xuất bản</span>
            </div>
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {newBooksNotInFlashSale.map(book => <BookCard key={book.id} b={book} onAddToCart={addToCart} />)}
              </div>
              {newBooksPage + 1 < newBooksTotalPages && (
                <div className="flex justify-center mt-8 pt-4">
                  <button onClick={handleLoadMoreNew} disabled={loadingNewBooks}
                    className="border-2 border-[#0a1317] hover:bg-[#0a1317] hover:text-white text-[#0a1317] font-bold text-[14px] px-8 py-3 rounded-full transition duration-200 shadow-sm disabled:opacity-40"
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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}