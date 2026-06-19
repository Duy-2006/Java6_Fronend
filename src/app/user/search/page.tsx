// app/user/search/page.tsx
"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BookCard from "@/components/BookCard";

interface Book {
  id: number;
  title: string;
  price: number;
  quantity?: number;
  imageUrl?: string;
  authorName?: string;
  audioPrice?: number;
  soldCount?: number;
  tempDiscountPercent?: number;
  discountPrice?: number;
  discountValue?: number;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

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
      const response = await authFetch(`${baseUrl}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Thêm vào giỏ thất bại");
      showToast(`Đã thêm "${book.title}" vào giỏ hàng!`);
      window.dispatchEvent(new Event("cartUpdated"));
      if (redirectToCheckout) router.push("/user/cart");
    } catch (error: any) {
      console.error("Add to cart error:", error);
      showToast(error.message, true);
    }
  };

  useEffect(() => {
    async function searchBooks() {
      if (!keyword.trim()) {
        setBooks([]);
        setLoading(false);
        return;
      }
      try {
        const url = `${baseUrl}/api/search?keyword=${encodeURIComponent(keyword.trim())}`;
        const res = await authFetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        const booksArray = Array.isArray(data) ? data : (data?.data || data?.content || []);
        setBooks(booksArray);
      } catch (error) {
        console.error("Search error:", error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }
    searchBooks();
  }, [keyword, baseUrl]);

  if (loading) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen">
        <Navbar />
        <main className="max-w-[1280px] mx-auto px-4 sm:px-6 mt-6 pb-16">
          <div className="text-center py-20">Đang tìm kiếm...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen">
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

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 mt-6 pb-16">
        <h2 className="text-xl font-bold mb-6">
          Kết quả tìm kiếm cho:{" "}
          <span className="text-primary">"{keyword}"</span>
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({books.length} kết quả)
          </span>
        </h2>

        {books.length === 0 ? (
          <div className="bg-white rounded-2xl p-20 text-center text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-bold text-lg mb-2">Không tìm thấy sách phù hợp</p>
            <p className="text-sm mb-6">Hãy thử tìm kiếm với từ khóa khác.</p>
            <Link
              href="/"
              className="bg-red-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {books.map((b) => (
              <BookCard key={b.id} b={b} onAddToCart={addToCart} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}