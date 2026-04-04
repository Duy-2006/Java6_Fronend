"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Category { id: number; name: string }
interface User { fullName: string; role: string }

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setUser)
      .catch(() => setUser(null));

    fetch(`${API_URL}/api/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => {});

    fetch(`${API_URL}/api/cart/count`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setCartCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) router.push(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    if (!user) { e.preventDefault(); setShowModal(true); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const handleAuthSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    type: "login" | "register"
  ) => {
    e.preventDefault();

    let body: any;

    if (type === "login") {
      body = {
        usernameOrEmail: (e.currentTarget.usernameOrEmail as HTMLInputElement).value,
        password: (e.currentTarget.password as HTMLInputElement).value,
      };
    } else {
      body = {
        username: (e.currentTarget.username as HTMLInputElement).value,
        name: (e.currentTarget.fullName as HTMLInputElement).value, // backend nhận "name"
        email: (e.currentTarget.email as HTMLInputElement).value,
        phone: (e.currentTarget.phone as HTMLInputElement).value,
        password: (e.currentTarget.password as HTMLInputElement).value,
      };
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Sai thông tin!");
        return;
      }

      const data = await res.json();

      if (type === "login") {
        localStorage.setItem("token", data.token);
        setUser(data.user);
      } else {
        alert("Đăng ký thành công! Hãy đăng nhập.");
        setActiveTab("login");
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    }
  };

  return (
    <>
      {/* Header code giữ nguyên như trước, chỉ logic login/register đã fix */}
      {/* ... phần giao diện Navbar, mega menu, search, cart ... */}

      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

            {/* Tabs */}
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
              {/* Login Form */}
              {activeTab === "login" && (
                <form onSubmit={e => handleAuthSubmit(e, "login")} className="space-y-4" noValidate>
                  <input name="usernameOrEmail" required placeholder="Email / Số điện thoại" className="w-full border rounded-xl px-4 py-3" />
                  <input name="password" type={showPass ? "text" : "password"} required placeholder="Mật khẩu" className="w-full border rounded-xl px-4 py-3" />
                  <button type="submit" className="w-full bg-[#C92127] text-white py-3.5 rounded-xl font-bold text-sm uppercase hover:bg-red-700">Đăng nhập</button>
                </form>
              )}

              {/* Register Form */}
              {activeTab === "register" && (
                <form onSubmit={e => handleAuthSubmit(e, "register")} className="space-y-4" noValidate>
                  <input name="username" required placeholder="Tên đăng nhập" className="w-full border rounded-xl px-4 py-2.5" />
                  <input name="fullName" required placeholder="Họ tên" className="w-full border rounded-xl px-4 py-2.5" />
                  <input name="email" type="email" required placeholder="Email" className="w-full border rounded-xl px-4 py-2.5" />
                  <input name="phone" required placeholder="Số điện thoại" className="w-full border rounded-xl px-4 py-2.5" />
                  <input name="password" type={showPass ? "text" : "password"} required placeholder="Mật khẩu" className="w-full border rounded-xl px-4 py-2.5" />
                  <button type="submit" className="w-full bg-[#C92127] text-white py-3.5 rounded-xl font-bold text-sm uppercase hover:bg-red-700">Đăng ký tài khoản</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}