/*
 * Navbar.tsx
 * Component thanh dieu huong (Navigation bar) chinh cua phan khach hang.
 * Chuc nang:
 * - Hien thi logo, menu danh muc san pham (Mega menu).
 * - Thanh tim kiem nang cao (ho tro tim kiem bang van ban va hinh anh).
 * - Quan ly trang thai dang nhap, hien thi gio hang (kem so luong) va menu ca nhan (dropdown).
 * - Tu dong cap nhat thong tin tu localStorage va kiem tra token backend.
 */

"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import BookCard from "@/components/BookCard";

interface Category { id: number; name: string }
interface User { id: number; name: string; role: string; username?: string; email?: string; avatar?: string; }

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // States for Integrated Image Search
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageSearch, setIsImageSearch] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  // Lấy user, categories, cart count
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
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

  // Sync URL search keyword param and image search status
  useEffect(() => {
    const kw = searchParams.get("keyword") ?? "";
    setKeyword(kw);

    const syncImageSearch = () => {
      const active = sessionStorage.getItem("isImageSearchActive") === "true";
      const preview = sessionStorage.getItem("searchImageBase64");
      setIsImageSearch(active);
      setImagePreview(preview);
    };

    syncImageSearch();
    window.addEventListener("imageSearchUpdated", syncImageSearch);
    return () => {
      window.removeEventListener("imageSearchUpdated", syncImageSearch);
    };
  }, [searchParams]);

  // Debounced search for Autocomplete suggestions
  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await authFetch(`${API_URL}/api/search?keyword=${encodeURIComponent(keyword.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const booksArray = Array.isArray(data) ? data : (data?.data || data?.content || []);
          // Extract unique titles
          const titles = Array.from(new Set(booksArray.map((b: any) => b.title))) as string[];
          setSuggestions(titles.slice(0, 8));
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, API_URL]);

  // Click outside to close Autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/user/search?keyword=${encodeURIComponent(keyword.trim())}`);
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
        sessionStorage.removeItem("searchImageBase64");
        sessionStorage.removeItem("isImageSearchActive");
        window.dispatchEvent(new Event("imageSearchUpdated"));
        setUser(null);
        router.push("/");
        router.refresh();
      });
  };

  const clearImageSearch = () => {
    sessionStorage.removeItem("searchImageBase64");
    sessionStorage.removeItem("isImageSearchActive");
    window.dispatchEvent(new Event("imageSearchUpdated"));
    if (pathname === "/user/search") {
      router.push("/user/search");
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        sessionStorage.setItem("searchImageBase64", base64String);
        sessionStorage.setItem("isImageSearchActive", "true");
        window.dispatchEvent(new Event("imageSearchUpdated"));
        router.push("/user/search");
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
          <div ref={searchContainerRef} className="flex-1 max-w-[650px] hidden md:block relative">
            <form onSubmit={handleSearch} className="relative w-full flex items-center">
              {/* Image Preview Thumbnail (Shopee style) */}
              {isImageSearch && imagePreview ? (
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg overflow-hidden border border-[#b70011] shrink-0 group z-10">
                  <img src={imagePreview} alt="Search source" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      clearImageSearch();
                    }}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    title="Xoá ảnh"
                  >
                    <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                  </button>
                </div>
              ) : (
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#b70011] text-xl">search</span>
              )}

              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onFocus={() => {
                  if (keyword.trim() && suggestions.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowDropdown(false);
                  }
                }}
                className={`!py-2.5 !pr-12 bg-[#f2f4f6] border border-transparent rounded-full focus:ring-1 focus:ring-[#b70011] focus:bg-white w-full text-sm outline-none transition-all duration-300 placeholder:text-gray-400 ${
                  isImageSearch && imagePreview ? "!pl-14" : "!pl-12"
                }`}
                placeholder={isImageSearch && imagePreview ? "Thêm từ khóa cho hình ảnh..." : "Tìm kiếm sách, tác giả..."}
                type="text"
              />

              {/* Camera Icon to upload/change image search */}
              <label className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#b70011] transition-all duration-300 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-xl">photo_camera</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
              </label>
            </form>

            {/* Suggestions Dropdown */}
            {showDropdown && (suggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute top-[105%] left-0 right-0 bg-white rounded-2xl border border-[#eceef0] shadow-2xl overflow-hidden z-[70] animate-fade-in">
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center py-5 gap-3">
                    <div className="w-4 h-4 border-2 border-[#b70011]/20 border-t-[#b70011] rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-500 font-medium">Đang tìm kiếm...</span>
                  </div>
                ) : (
                  <div className="flex flex-col py-2">
                    {suggestions.map((title: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setKeyword(title);
                          setShowDropdown(false);
                          router.push(`/user/search?keyword=${encodeURIComponent(title)}`);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer text-sm text-[#191c1e] font-medium"
                      >
                        <span className="material-symbols-outlined text-gray-400 text-[18px]">search</span>
                        <span className="truncate">{title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
    </>
  );
}