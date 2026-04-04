"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

interface Category { id: number; name: string }
interface User { fullName: string; role: string }

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginFormRef = useRef<HTMLFormElement>(null);
  const registerFormRef = useRef<HTMLFormElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const googleAuthUrl = `${API_URL}/oauth2/authorization/google`;
  console.log("Redirecting to:", googleAuthUrl); // Debug

  // Xử lý Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      alert('Đăng nhập Google thất bại!');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        setUser(userData);
        // Xóa params trên URL
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('Google login successful:', userData);

        // Đóng modal nếu đang mở
        setShowModal(false);

        // Redirect nếu là admin
        if (userData.role === "ADMIN") {
          window.location.href = "/admin/dashboard";
        }
      } catch (err) {
        console.error('Failed to parse user data:', err);
        alert('Có lỗi xảy ra khi đăng nhập bằng Google');
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then(data => {
        const userData = {
          fullName: data.name,
          role: data.role
        };
        setUser(userData);

        if (pathname === "/login") {
          if (data.role === "ADMIN") {
            router.push("/admin/dashboard");
          } else {
            router.push("/");
          }
        }
      })
      .catch(() => setUser(null));

    fetch(`${API_URL}/api/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => { });

    fetch(`${API_URL}/api/cart/count`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setCartCount(d.count ?? 0))
      .catch(() => { });
  }, [API_URL, pathname, router]);

  const isUser = user?.role === "USER";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) router.push(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  // Google Login handler
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  const handleAuthSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    type: "login" | "register"
  ) => {
    e.preventDefault();
    setIsLoading(true);

    let body: any;

    if (type === "login") {
      body = {
        usernameOrEmail: (e.currentTarget.usernameOrEmail as HTMLInputElement).value,
        password: (e.currentTarget.password as HTMLInputElement).value,
      };
    } else {
      const password = (e.currentTarget.password as HTMLInputElement).value;
      body = {
        username: (e.currentTarget.username as HTMLInputElement).value,
        name: (e.currentTarget.fullName as HTMLInputElement).value,
        email: (e.currentTarget.email as HTMLInputElement).value,
        phone: (e.currentTarget.phone as HTMLInputElement).value,
        password: password,
        confirmPassword: password,
      };
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || data.errors || "Sai thông tin!";
        if (typeof errorMsg === 'object') {
          alert(Object.values(errorMsg).join(", "));
        } else {
          alert(errorMsg);
        }
        setIsLoading(false);
        return;
      }

      if (type === "login") {
        localStorage.removeItem("token");
        localStorage.setItem("token", data.token);

        console.log("Token đã lưu:", data.token);
        console.log("User role:", data.user.role);

        setShowModal(false);

        if (loginFormRef.current) {
          loginFormRef.current.reset();
        }

        if (data.user.role === "ADMIN") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/";
        }
      } else {
        alert(data.message || "Đăng ký thành công! Hãy đăng nhập.");
        setActiveTab("login");
        if (registerFormRef.current) {
          registerFormRef.current.reset();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-[1000]">
        <div className="w-full bg-[#C92127] h-[48px] flex justify-center items-center overflow-hidden cursor-pointer">
          <p className="text-white text-sm font-bold animate-pulse">🎉 MIỄN PHÍ GIAO HÀNG cho đơn từ 500K — Ưu đãi có hạn!</p>
        </div>

        <div className="bg-white text-gray-700">
          <div className="max-w-[1230px] mx-auto flex items-center gap-6 px-4 py-3">

            <div className="flex items-center gap-4">
              <Link href="/" className="block">
                <span className="text-2xl font-black text-[#C92127] tracking-tight">📚 BOOKSTORE</span>
              </Link>

              <div className="relative group/mega">
                <button className="flex items-center hover:text-red-600 transition">
                  <span className="material-symbols-outlined text-3xl text-gray-500 group-hover/mega:text-red-600 transition">widgets</span>
                </button>
                <div className="absolute top-[calc(100%+8px)] left-0 w-[900px] bg-white shadow-2xl rounded-xl border border-gray-100
                  invisible opacity-0 group-hover/mega:visible group-hover/mega:opacity-100 transition-all duration-200 flex z-[2000]">
                  <div className="w-[260px] bg-gray-50 border-r rounded-l-xl overflow-hidden py-2">
                    {categories.map(c => (
                      <Link key={c.id} href={`/category/${c.id}`}
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
            </div>

            <div className="flex-1">
              <form onSubmit={handleSearch} style={{ position: "relative" }}>
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    border: "2px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "0 48px 0 14px",
                    fontSize: 14,
                    outline: "none",
                    background: "#fff",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    display: "block",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#C92127")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                  placeholder="Tìm kiếm sách, tác giả..."
                />
                <button
                  type="submit"
                  style={{
                    position: "absolute",
                    right: 5, top: 5, bottom: 5,
                    width: 30,
                    backgroundColor: "#C92127",
                    color: "#fff",
                    borderRadius: 5,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#a01e1e")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#C92127")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    search
                  </span>
                </button>
              </form>
            </div>

            <div className="flex items-center gap-5">
              <Link href="/cart" onClick={handleCartClick}
                className="flex flex-col items-center hover:text-red-600 transition relative text-gray-500">
                <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                <span className="text-[11px] font-bold">Giỏ hàng</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 right-1 bg-orange-500 text-white text-[10px] px-1.5 rounded-full border border-white font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative group/user text-gray-500">
                  <button className="flex flex-col items-center hover:text-red-600 transition">
                    <span className="material-symbols-outlined text-2xl">person</span>
                    <span className="text-[11px] font-bold whitespace-nowrap max-w-[70px] truncate">
                      {user.fullName}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl
                    invisible group-hover/user:visible opacity-0 group-hover/user:opacity-100 transition-all duration-200 z-[100]">

                    <div className="px-4 py-3 bg-gray-50 rounded-t-xl border-b text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Xin chào,</p>
                      <p className="text-sm font-bold truncate text-red-600">{user.fullName}</p>
                    </div>

                    <Link href="/profile" className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-gray-700 border-b">
                      <span className="text-lg">👤</span>
                      Thông tin tài khoản
                    </Link>
                    <Link href="/my-orders" className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-gray-700 border-b">
                      <span className="text-lg">📦</span>
                      Đơn hàng của tôi
                    </Link>
                    <Link href="/wishlist" className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-gray-700 border-b">
                      <span className="text-lg">❤️</span>
                      Sách yêu thích
                    </Link>
                    <Link href="/change-password" className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-gray-700 border-b">
                      <span className="text-lg">🔒</span>
                      Đổi mật khẩu
                    </Link>

                    <div className="border-t">
                      <button onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-bold rounded-b-xl">
                        <span className="text-lg">🚪</span>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setShowModal(true); setActiveTab("login"); }}
                  className="flex flex-col items-center hover:text-red-600 transition text-gray-500">
                  <span className="material-symbols-outlined text-2xl">person</span>
                  <span className="text-[11px] font-bold">Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

            <div className="flex border-b">
              {(["login", "register"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-sm font-bold uppercase transition border-b-2
                    ${activeTab === tab ? "border-red-600 text-red-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {tab === "login" ? "Đăng nhập" : "Đăng ký"}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === "login" && (
                <>
                  <form ref={loginFormRef} onSubmit={e => handleAuthSubmit(e, "login")} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Email / Số điện thoại</label>
                      <input name="usernameOrEmail" required placeholder="Nhập email hoặc số điện thoại"
                        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-red-600 transition" />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Mật khẩu</label>
                      <input name="password" type={showPass ? "text" : "password"} required placeholder="Nhập mật khẩu"
                        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-red-600 transition pr-14" />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 bottom-3 text-[11px] text-blue-600 font-bold cursor-pointer uppercase hover:underline">
                        {showPass ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                    <div className="text-right">
                      <Link
                        href="/user/forgot-password"
                        onClick={() => setShowModal(false)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <button type="submit" disabled={isLoading}
                      className="w-full bg-[#C92127] text-white py-3.5 rounded-xl font-bold text-sm uppercase hover:bg-red-700 transition active:scale-95 disabled:opacity-50">
                      {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)}
                      className="w-full border border-red-600 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 transition uppercase">
                      Bỏ qua
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500">Hoặc đăng nhập với</span>
                    </div>
                  </div>

                  {/* Google Login Button */}
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 hover:bg-gray-50 transition duration-200"
                  >
                    <FcGoogle size={22} />
                    <span className="text-sm font-medium text-gray-700">Google</span>
                  </button>
                </>
              )}

              {activeTab === "register" && (
                <form ref={registerFormRef} onSubmit={e => handleAuthSubmit(e, "register")} className="space-y-4" noValidate>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Username</label>
                      <input name="username" required placeholder="Tên đăng nhập"
                        className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-600 transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Họ và tên</label>
                      <input name="fullName" required placeholder="Họ tên"
                        className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-600 transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Email</label>
                    <input name="email" type="email" required placeholder="example@gmail.com"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-600 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Số điện thoại</label>
                    <input name="phone" required placeholder="0901 234 567"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-600 transition" />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Mật khẩu</label>
                    <input name="password" type={showPass ? "text" : "password"} required placeholder="Tạo mật khẩu"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-600 transition pr-14" />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 bottom-3 text-[11px] text-blue-600 font-bold cursor-pointer uppercase hover:underline">
                      {showPass ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full bg-[#C92127] text-white py-3.5 rounded-xl font-bold text-sm uppercase hover:bg-red-700 transition active:scale-95 disabled:opacity-50">
                    {isLoading ? "Đang xử lý..." : "Đăng ký tài khoản"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}