"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Category { id: number; name: string }
interface User { id: number; name: string; role: string; username?: string; email?: string; }

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [keyword, setKeyword] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Lấy user, categories, cart count
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) { console.error(e); }
    }

    // Nếu đang ở route auth (login, register, forgot-password...) thì không gọi API /me
    const isAuthRoute = pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/forgot-password';
    if (token && !isAuthRoute) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        })
        .catch(() => { });
    }

    // Lấy danh mục (public)
    fetch(`${API_URL}/api/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => { });

    // Lấy số lượng giỏ hàng nếu có token
    const fetchCartCount = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken && !isAuthRoute) {
        fetch(`${API_URL}/api/cart/count`, {
          headers: { "Authorization": `Bearer ${currentToken}` }
        })
          .then(r => r.ok ? r.json() : { count: 0 })
          .then(d => setCartCount(d.count ?? 0))
          .catch(() => { });
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();

    window.addEventListener("cartUpdated", fetchCartCount);
    return () => {
      window.removeEventListener("cartUpdated", fetchCartCount);
    };
  }, [API_URL, pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) router.push(`/user/search?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  const handleCartClick = () => {
    if (!user) {
      router.push("/auth/login");
    } else {
      router.push("/user/cart");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Banner quảng cáo */}
      <div className="w-full bg-[#C92127] h-[48px] flex justify-center items-center overflow-hidden cursor-pointer">
        <p className="text-white text-sm font-bold animate-pulse">🎉 MIỄN PHÍ GIAO HÀNG cho đơn từ 500K — Ưu đãi có hạn!</p>
      </div>

      <header className="bg-white shadow-sm sticky top-0 z-[1000]">
        <div className="max-w-[1230px] mx-auto flex items-center gap-6 px-4 py-3">
          {/* Logo */}
          <Link href="/" className="block">
            <span className="text-2xl font-black text-[#C92127] tracking-tight">📚 BOOKSTORE</span>
          </Link>

          {/* Mega menu danh mục */}
          <div className="relative group/mega">
            <button className="flex items-center hover:text-red-600 transition">
              <span className="material-symbols-outlined text-3xl text-gray-500 group-hover/mega:text-red-600 transition">widgets</span>
            </button>
            <div className="absolute top-[calc(100%+8px)] left-0 w-[900px] bg-white shadow-2xl rounded-xl border border-gray-100
              invisible opacity-0 group-hover/mega:visible group-hover/mega:opacity-100 transition-all duration-200 flex z-[2000]">
              <div className="w-[260px] bg-gray-50 border-r rounded-l-xl overflow-hidden py-2">
                {categories.map(c => (
                  <Link key={c.id} href={`/user/category/${c.id}`}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-white hover:text-red-600 cursor-pointer transition text-sm font-medium">
                    {c.name}
                    <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
                  </Link>
                ))}
              </div>
              <div className="flex-1 p-6 bg-white rounded-r-xl">
                <p className="text-xs text-gray-400 italic">Chọn danh mục để khám phá sách...</p>
              </div>
            </div>
          </div>

          {/* Thanh tìm kiếm */}
          <div className="flex-1">
            <form onSubmit={handleSearch} className="relative">
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="w-full h-10 border-2 border-gray-100 rounded-lg pl-4 pr-12 text-sm outline-none focus:border-red-600"
                placeholder="Tìm kiếm sách, tác giả..."
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 w-8 bg-[#C92127] text-white rounded-md flex items-center justify-center hover:bg-red-300"
              >
                <span className="material-symbols-outlined text-base">search</span>
              </button>
            </form>
          </div>

          {/* Giỏ hàng */}
          <button onClick={handleCartClick} className="flex flex-col items-center hover:text-red-600 transition relative text-gray-500">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            <span className="text-[11px] font-bold">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-1 bg-orange-500 text-white text-[10px] px-1.5 rounded-full border border-white font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* User menu */}
          {user ? (
            <div className="relative group/user text-gray-500">
              <button className="flex flex-col items-center hover:text-red-600 transition">
                <span className="material-symbols-outlined text-2xl">person</span>
                <span className="text-[11px] font-bold whitespace-nowrap max-w-[70px] truncate">
                  {user.name}
                </span>
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl
                invisible group-hover/user:visible opacity-0 group-hover/user:opacity-100 transition-all duration-200 z-[100]">
                <div className="px-4 py-3 bg-gray-50 rounded-t-xl border-b text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Xin chào,</p>
                  <p className="text-sm font-bold truncate text-red-600">{user.name}</p>
                </div>
                <Link href="/user/profile" className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-gray-700 border-b">
                  Thông tin tài khoản
                </Link>
                <Link href="/user/my-orders" className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-gray-700 border-b">
                  Đơn hàng của tôi
                </Link>
                
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-bold rounded-b-xl">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth/login" className="flex flex-col items-center hover:text-red-600 transition text-gray-500">
              <span className="material-symbols-outlined text-2xl">person</span>
              <span className="text-[11px] font-bold">Đăng nhập</span>
            </Link>
          )}
        </div>
      </header>
    </>
  );
}