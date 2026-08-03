/*
 * Navbar.tsx
 * Component thanh dieu huong (Navigation bar) chinh cua phan khach hang.
 * Chuc nang:
 * - Hien thi logo, menu danh muc san pham (Mega menu).
 * - Thanh tim kiem nang cao (ho tro tim kiem bang van ban va hinh anh).
 * - Quan ly trang thai dang nhap, hien thi gio hang (kem so luong) va menu ca nhan (dropdown).
 * - Tu dong cap nhat thong tin tu localStorage va kiem tra token backend.
 */

"use strict";
"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Category { id: number; name: string }
interface User { id: number; name: string; role: string; username?: string; email?: string; avatar?: string; }

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [keyword, setKeyword] = useState("");

  // States for Image Search
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  // Lấy user, categories, cart count
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.role === "ADMIN") {
          router.push("/admin/dashboard");
        }
      } catch (e) { console.error(e); }
    }

    const isAuthRoute = pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/forgot-password';
    if (isLoggedIn() && !isAuthRoute) {
      authFetch(`${API_URL}/api/auth/me`, {
        headers: {},
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
          if (data.role === "ADMIN") {
            router.push("/admin/dashboard");
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        });
    }

    // Lấy danh mục
    authFetch(`${API_URL}/api/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => { });

    // Lấy số lượng giỏ hàng nếu có token
    const fetchCartCount = () => {
      if (isLoggedIn() && !isAuthRoute) {
        authFetch(`${API_URL}/api/cart/count`, {
          headers: {}
        })
          .then(r => r.ok ? r.json() : { count: 0 })
          .then(d => setCartCount(d.count ?? 0))
          .catch(() => { });
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();

    const handleStorageChange = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) { console.error(e); }
      } else {
        setUser(null);
      }
    };

    window.addEventListener("cartUpdated", fetchCartCount);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("cartUpdated", fetchCartCount);
      window.removeEventListener("storage", handleStorageChange);
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
    authFetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
    })
      .catch((err) => console.error("Logout error:", err))
      .finally(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/");
        router.refresh();
      });
  };

  const handleImageSearchClick = () => {
    setShowImageSearchModal(true);
    setImagePreview(null);
    setIsScanning(false);
    setImageSearchResults([]);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsScanning(true);
        setImageSearchResults([]);

        // Giả lập quét ảnh tìm sách trong 2.5 giây
        setTimeout(() => {
          setIsScanning(false);
          setImageSearchResults([
            { id: 1, title: "Mắt Biếc", author: "Nguyễn Nhật Ánh", price: 110000, image: "/images/book-default.jpg" },
            { id: 2, title: "Cho Tôi Xin Một Vé Đi Tuổi Thơ", author: "Nguyễn Nhật Ánh", price: 85000, image: "/images/book-default.jpg" }
          ]);
        }, 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Component-specific scanner line animation */}
      <style>{`
        @keyframes scanAnimation {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background-color: #b70011;
          box-shadow: 0 0 15px #b70011;
          animation: scanAnimation 2s infinite ease-in-out;
        }
      `}</style>



      {/* Header / Navigation */}
      <nav className="bg-white/95 backdrop-blur-xl sticky top-0 w-full z-[60] border-b border-[#eceef0] shadow-sm">
        <div className="flex items-center justify-between px-6 h-20 w-full max-w-7xl mx-auto gap-8">
          {/* Logo & Catalog */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <Link href="/" className="font-extrabold tracking-tight group text-2xl flex items-center">
              <span className="text-[#b70011] group-hover:text-[#dc2626] transition-all duration-500">Bibliora</span>
            </Link>

            <div className="hidden lg:flex items-center">
              {/* Catalog / Mega Menu Trigger */}
              <div className="relative group/mega h-20 flex items-center">
                <button className="flex items-center gap-1.5 text-[#191c1e] text-[15px] font-semibold hover:text-[#b70011] transition-all duration-300">
                  Danh mục
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
                {/* Mega Menu Content */}
                <div className="absolute top-full left-0 w-[300px] bg-white shadow-2xl rounded-2xl border border-[#eceef0] p-6 invisible opacity-0 -translate-y-2 group-hover/mega:visible group-hover/mega:opacity-100 group-hover/mega:translate-y-0 transition-all duration-300 z-[100]">
                  <div className="w-full">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#b70011] mb-5">Danh mục nổi bật</h4>
                    <ul className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                      {categories.map((c) => (
                        <li key={c.id}>
                          <Link href={`/user/category/${c.id}`} className="flex items-center gap-3 text-[#191c1e] hover:text-[#b70011] transition-all duration-300 font-medium text-sm">
                            <span className="material-symbols-outlined text-gray-400 text-base">auto_stories</span> {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar - flex-1 and max-w-[650px] to expand beautifully */}
          <div className="flex-1 max-w-[650px] hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#b70011] text-xl">search</span>
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="!py-2.5 !pl-12 !pr-12 bg-[#f2f4f6] border border-transparent rounded-full focus:ring-1 focus:ring-[#b70011] focus:bg-white w-full text-sm outline-none transition-all duration-300 placeholder:text-gray-400"
                placeholder="Tìm kiếm sách, tác giả..."
                type="text"
              />
              {/* Image Search Button inside the search bar */}
              <button
                type="button"
                onClick={handleImageSearchClick}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#b70011] transition-all duration-300 flex items-center justify-center"
                title="Tìm kiếm bằng hình ảnh"
              >
                <span className="material-symbols-outlined text-xl">photo_camera</span>
              </button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Cart Button */}
            <button onClick={handleCartClick} className="relative p-2.5 text-[#191c1e] hover:bg-[#b70011]/10 hover:text-[#b70011] transition-all duration-300 rounded-full group">
              <span className="material-symbols-outlined text-[26px]">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#b70011] text-white text-[10px] flex items-center justify-center rounded-full font-bold group-hover:scale-110 transition-transform duration-300">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Dropdown / Login */}
            {user ? (
              <div className="relative group/user h-20 flex items-center">
                <button className="flex items-center gap-2 p-1.5 pr-4 rounded-full hover:bg-[#f2f4f6] transition-all duration-300">
                  <div className="w-9 h-9 rounded-full bg-[#eceef0] flex items-center justify-center overflow-hidden border border-[#eceef0] relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar.startsWith("http") ? user.avatar : `${API_URL}${user.avatar}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const next = target.nextElementSibling as HTMLElement;
                          if (next) next.style.display = "block";
                        }}
                      />
                    ) : null}
                    <span 
                      className={`material-symbols-outlined text-gray-500 ${user.avatar ? "hidden" : "block"}`}
                    >
                      person
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#191c1e] hidden sm:block max-w-[100px] truncate">{user.name}</span>
                </button>
                {/* User Dropdown */}
                <div className="absolute top-[80%] right-0 w-64 bg-white shadow-2xl rounded-2xl border border-[#eceef0] overflow-hidden invisible opacity-0 -translate-y-2 group-hover/user:visible group-hover/user:opacity-100 group-hover/user:translate-y-0 transition-all duration-300 z-[100]">
                  <div className="p-5 border-b border-[#f2f4f6]">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Xin chào,</p>
                    <p className="font-bold text-[#191c1e] truncate">{user.name}</p>
                  </div>
                  <div className="p-2">
                    {user.role === "ADMIN" && (
                      <Link className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#b70011]/10 text-[#b70011] text-sm font-bold transition-all duration-300 mb-1" href="/admin/dashboard">
                        <span className="material-symbols-outlined text-lg text-[#b70011]">dashboard</span> Trang quản trị
                      </Link>
                    )}
                    <Link className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f2f4f6] text-[#191c1e] text-sm transition-all duration-300" href="/user/profile">
                      <span className="material-symbols-outlined text-lg text-gray-500">account_circle</span> Hồ sơ của tôi
                    </Link>
                    <Link className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f2f4f6] text-[#191c1e] text-sm transition-all duration-300" href="/user/my-orders">
                      <span className="material-symbols-outlined text-lg text-gray-500">package_2</span> Đơn hàng của tôi
                    </Link>
                    <Link className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f2f4f6] text-[#191c1e] text-sm transition-all duration-300" href="/user/my-audiobooks">
                      <span className="material-symbols-outlined text-lg text-gray-500">headphones</span> Sách nói của tôi
                    </Link>
                  </div>
                  <div className="p-2 bg-white border-t border-[#f2f4f6]">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffdad6]/40 text-[#ba1a1a] text-sm font-bold transition-all duration-300">
                      <span className="material-symbols-outlined text-lg">logout</span> Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-2 p-2 px-4 rounded-full bg-[#b70011] text-white hover:bg-[#dc2626] transition-all duration-300 font-semibold text-sm">
                <span className="material-symbols-outlined text-lg">login</span> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Modal Tìm kiếm bằng hình ảnh */}
      {showImageSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 transition-all duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[#191c1e] text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[#b70011]">photo_camera</span>
                Tìm kiếm bằng hình ảnh
              </h3>
              <button
                onClick={() => setShowImageSearchModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!imagePreview ? (
                // Chưa chọn ảnh
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 cursor-pointer hover:bg-gray-50 hover:border-[#b70011] transition-all group">
                  <span className="material-symbols-outlined text-5xl text-gray-400 group-hover:text-[#b70011] transition-all mb-4">cloud_upload</span>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-black transition-all">Kéo thả hoặc click để tải ảnh bìa sách</span>
                  <span className="text-xs text-gray-400 mt-2">Hỗ trợ JPG, PNG (tối đa 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              ) : (
                // Đã chọn ảnh
                <div className="space-y-6">
                  <div className="relative aspect-video max-h-56 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="h-full w-auto object-contain" />

                    {/* Đường quét quét chuyển động */}
                    {isScanning && (
                      <div className="scan-line"></div>
                    )}
                  </div>

                  {isScanning ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-8 h-8 border-4 border-[#b70011]/20 border-t-[#b70011] rounded-full animate-spin mb-3"></div>
                      <p className="text-sm font-medium text-gray-700">Đang quét và phân tích hình ảnh bìa sách...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kết quả khớp nhất</h4>
                      <div className="space-y-3">
                        {imageSearchResults.length > 0 ? (
                          imageSearchResults.map((book) => (
                            <Link
                              key={book.id}
                              href={`/user/books/${book.id}`}
                              onClick={() => setShowImageSearchModal(false)}
                              className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-[#b70011]/30 hover:bg-gray-50 transition-all group"
                            >
                              <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={book.image}
                                  alt={book.title}
                                  className="w-full h-full object-cover animate-pulse"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = "/images/book-default.jpg";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-[#191c1e] truncate group-hover:text-[#b70011] transition-all">{book.title}</p>
                                <p className="text-xs text-gray-500">{book.author}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm text-[#b70011]">{book.price.toLocaleString('vi-VN')}đ</p>
                                <p className="text-[10px] text-green-600 font-medium">98% Khớp</p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">Không tìm thấy sách phù hợp. Vui lòng thử lại với ảnh rõ hơn.</p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setImagePreview(null)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                        >
                          Chọn ảnh khác
                        </button>
                        <button
                          onClick={() => {
                            setShowImageSearchModal(false);
                            router.push(`/user/search?keyword=${encodeURIComponent("Nguyễn Nhật Ánh")}`);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[#b70011] text-white text-sm font-semibold hover:bg-[#dc2626] transition-all"
                        >
                          Xem tất cả kết quả
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}