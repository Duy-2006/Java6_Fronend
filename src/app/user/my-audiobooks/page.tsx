/*
 * page.tsx (My Audiobooks Page)
 * Trang hien thi danh sach cac sach noi (audiobooks) ma nguoi dung da so huu (mua thanh cong).
 * Chuc nang:
 * - Lay danh sach sach noi tu API theo ID nguoi dung.
 * - Hien thi duoi dang luoi (grid) voi thong tin co ban (Hinh anh, Ten sach, Tac gia).
 * - Cung cap nut "Nghe ngay" de chuyen sang trang Audio Player.
 */

"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

const getUserIdFromToken = (): number | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null;
};


const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return "/images/book-default.jpg";
  let cleanUrl = imagePath;
  if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
  if (cleanUrl.startsWith("/")) cleanUrl = cleanUrl.substring(1);
  return `${BASE_URL}/uploads/books/${cleanUrl}`;
};

export default function MyAudiobooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile data for sidebar
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/auth/login");
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserName(u.name || u.username || "");
        setUserRole(u.role || "USER");
      } catch {}
    }

    authFetch(`${BASE_URL}/api/profile`, {
      headers: { },
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.name) {
          setUserName(data.name);
        }
      })
      .catch((err) => console.error("Error fetching profile name:", err));
  }, []);

  const fetchAudiobooks = async () => {
    if (!isLoggedIn()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${BASE_URL}/api/user/books/my-audiobooks`, {
        headers: { },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      if (!res.ok) throw new Error("Không thể tải danh sách sách nói");

      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudiobooks();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-5 shadow-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f4f6]">
              <div className="w-12 h-12 rounded-full bg-[#b70011]/8 text-[#b70011] flex items-center justify-center text-xl font-bold border-2 border-white ring-4 ring-[#b70011]/5 select-none font-mono">
                {userName ? userName.trim().charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#b70011] truncate">{userName || "Người dùng"}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{userRole || "USER"}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1 mt-6">
              <Link
                href="/user/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                <span>Thông tin tài khoản</span>
              </Link>
              <Link
                href="/user/my-orders"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg [font-variation-settings:'FILL'_1]">history</span>
                <span>Lịch sử mua hàng</span>
              </Link>
              <Link
                href="/user/my-audiobooks"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-[#ffdad6]/40 text-[#b70011]"
              >
                <span className="material-symbols-outlined text-lg [font-variation-settings:'FILL'_1]">headphones</span>
                <span>Sách nói của tôi</span>
              </Link>
              <Link
                href="/user/cart"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">shopping_cart</span>
                <span>Giỏ hàng của tôi</span>
              </Link>
            </nav>

            <div className="border-t border-[#e0e3e5] mt-5 pt-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-[#b70011] hover:bg-[#ffdad6]/20 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#191c1e] tracking-tight">Sách nói của tôi</h1>
              <p className="text-gray-500 text-xs mt-1">Danh sách các sách nói bạn đã sở hữu, có thể nghe ngay lập tức.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e0e3e5] text-gray-700 hover:text-[#b70011] hover:border-[#b70011] rounded-full text-xs font-bold transition-all duration-200 self-start"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Khám phá thêm sách
            </Link>
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="bg-white rounded-2xl border border-[#e0e3e5] p-16 text-center shadow-sm">
                <div className="w-8 h-8 border-4 border-[#b70011] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-xs font-semibold">Đang tải tủ sách của bạn...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-[#b70011]">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p className="font-bold text-sm tracking-tight">{error}</p>
                <button
                  onClick={fetchAudiobooks}
                  className="mt-4 px-6 py-2 bg-[#b70011] text-white rounded-full font-bold text-xs hover:bg-[#93000b] transition active:scale-95"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && books.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#e0e3e5] p-16 text-center max-w-xl mx-auto shadow-sm">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">headphones</span>
                <p className="text-base font-bold text-[#191c1e] mb-1">Tủ sách nói của bạn đang trống</p>
                <p className="text-gray-500 text-xs mb-5">Bạn chưa sở hữu cuốn sách nói nào. Hãy mua ngay để trải nghiệm nhé!</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#b70011] text-white rounded-full font-bold text-xs hover:bg-[#93000b] transition active:scale-95 shadow-sm"
                >
                  Tìm sách nói
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            )}

            {!loading && !error && books.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {books.map((book) => (
                  <div key={book.id} className="bg-white rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md border border-[#191c1e]/5 flex flex-col group relative">
                    <Link href={`/user/books/${book.id}/audiobook`} className="relative aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-[#f2f4f6] flex items-center justify-center p-2 block group/cover">
                      <img 
                        src={getImageUrl(book.imageUrl)} 
                        alt={book.title} 
                        className="w-full h-full object-contain transition-transform duration-500 group-hover/cover:scale-110" 
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }} 
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover/cover:bg-black/20 transition-colors" />
                      
                      <button className="absolute inset-0 m-auto w-12 h-12 bg-white/90 hover:bg-white text-[#b70011] rounded-full flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-all duration-300 shadow-lg transform hover:scale-105 z-20">
                        <span className="material-symbols-outlined text-2xl fill-1">play_arrow</span>
                      </button>
                    </Link>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={`/user/books/${book.id}/audiobook`} className="block">
                          <h3 className="font-semibold text-sm mb-1 truncate text-[#191c1e] group-hover:text-[#b70011] transition-colors">
                            {book.title}
                          </h3>
                        </Link>
                        <p className="text-gray-500 text-xs truncate">{book.authorName || "—"}</p>
                      </div>
                      <Link
                        href={`/user/books/${book.id}/audiobook`}
                        className="mt-3 w-full bg-[#f2f4f6] text-[#b70011] group-hover:bg-[#b70011] group-hover:text-white py-2 rounded-xl text-xs font-bold transition-all duration-300 text-center inline-flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">headphones</span>
                        Nghe ngay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
