// app/user/search/page.tsx
"use client";
import { authFetch } from "@/lib/authFetch";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Book {
  id: number;
  title: string;
  price: number;
  imageUrl?: string;
}

// Component ảnh riêng để xử lý fallback tránh vòng lặp vô tận
function BookImage({ book, baseUrl }: { book: Book; baseUrl: string }) {
  const [imgError, setImgError] = useState(false);

  const getImageSrc = () => {
    if (imgError) return "/images/book-default.jpg";
    if (book.imageUrl && book.imageUrl.trim()) {
      let cleanUrl = book.imageUrl;
      // Xử lý nếu DB lưu cả "books/..." thì cắt bỏ phần "books/"
      if (cleanUrl.startsWith("books/")) {
        cleanUrl = cleanUrl.substring(6);
      }
      // Đảm bảo không có dấu / thừa
      return `${baseUrl}/uploads/books/${cleanUrl}`;
    }
    return "/images/book-default.jpg";
  };

  return (
    <img
      src={getImageSrc()}
      alt={book.title}
      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
      onError={() => {
        if (!imgError) setImgError(true); // chỉ set lỗi một lần, tránh vòng lặp
      }}
    />
  );
}

import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((b) => (
              <Link
                key={b.id}
                href={`/user/books/${b.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 p-3 flex items-center justify-center">
                  <BookImage book={b} baseUrl={baseUrl} />
                </div>
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <p className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-snug flex-1">
                    {b.title}
                  </p>
                  <span className="text-red-600 font-bold text-[15px] mt-1">
                    {fmt(b.price ?? 0)} ₫
                  </span>
                </div>
              </Link>
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