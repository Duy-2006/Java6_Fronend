"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { isBlank, isValidEmail } from "@/services/validation";

interface ProfileResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface ProfileUpdateRequest {
  name: string;
  email: string;
  phone: string;
}



export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileUpdateRequest>({ name: "", email: "", phone: "" });
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Partial<ProfileUpdateRequest>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
        if (!isLoggedIn()) {
      router.push("/auth/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUsername(u.username || "");
        setRole(u.role || "");
      } catch (e) {}
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

    authFetch(`${apiUrl}/api/profile`, {
      headers: { },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/auth/login");
          return null;
        }
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Profile error ${res.status}:`, errorText);
          throw new Error(`HTTP ${res.status} - ${errorText}`);
        }
        return res.json();
      })
      .then((data: ProfileResponse | null) => {
        if (data) {
          setForm({
            name: data.name ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
          });
        }
      })
      .catch((err) => {
        console.error("Fetch profile failed:", err);
        setToast("Không thể tải thông tin cá nhân");
        setTimeout(() => setToast(null), 3000);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const validate = (): Partial<ProfileUpdateRequest> => {
    const e: Partial<ProfileUpdateRequest> = {};
    if (isBlank(form.name)) e.name = "Họ tên không được để trống.";
    if (!isValidEmail(form.email)) e.email = "Email không đúng định dạng.";
    if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone))
      e.phone = "Số điện thoại không hợp lệ.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);

        if (!isLoggedIn()) {
      router.push("/auth/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

    try {
      const res = await authFetch(`${apiUrl}/api/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      if (res.ok) {
        setToast("Cập nhật thông tin thành công!");
        setTimeout(() => setToast(null), 3000);
      } else {
        const text = await res.text();
        alert(text || "Cập nhật thất bại.");
      }
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const setField = (field: keyof ProfileUpdateRequest, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const inputCls = (field: keyof ProfileUpdateRequest) =>
    `w-full bg-[#f2f4f6] border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:bg-white transition-all duration-300 outline-none h-[46px] ${
      errors[field]
        ? "border-[#b70011] focus:ring-[#b70011]"
        : "border-transparent focus:border-transparent"
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#b70011] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#191c1e] text-white px-6 py-3.5 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined text-[#34c759] text-lg">check_circle</span>
            <span className="tracking-tight">{toast}</span>
          </div>
        )}

        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          {/* User profile card */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-5 shadow-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f4f6]">
              <div className="w-12 h-12 rounded-full bg-[#b70011]/8 text-[#b70011] flex items-center justify-center text-xl font-bold border-2 border-white ring-4 ring-[#b70011]/5 select-none font-mono">
                {form.name ? form.name.trim().charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#b70011] truncate">{form.name || "Người dùng"}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{role || "USER"}</p>
              </div>
            </div>
            
            <nav className="flex flex-col gap-1 mt-6">
              <Link 
                href="/user/profile" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-[#ffdad6]/40 text-[#b70011]"
              >
                <span className="material-symbols-outlined text-lg [font-variation-settings:'FILL'_1]">person</span>
                <span>Thông tin tài khoản</span>
              </Link>
              <Link 
                href="/user/my-orders" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">history</span>
                <span>Lịch sử mua hàng</span>
              </Link>
              <Link 
                href="/user/my-audiobooks" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#b70011] hover:bg-[#f2f4f6] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">headphones</span>
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
          
          {/* Cover Info Section */}
          <section className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-sm flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[#b70011]/8 text-[#b70011] flex items-center justify-center text-3xl font-bold border-4 border-[#e0e3e5] shadow-sm select-none font-mono">
                {form.name ? form.name.trim().charAt(0).toUpperCase() : "U"}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-[#b70011] text-white rounded-full shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer">
                <span className="material-symbols-outlined text-sm block">photo_camera</span>
              </div>
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 mb-1.5">
                <h1 className="text-xl font-bold text-[#191c1e] truncate max-w-full">{form.name || "Người dùng"}</h1>
                <span className="px-2.5 py-0.5 bg-[#b70011] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Premium Member</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Tài khoản chính thức hoạt động • Hệ thống Crimson Books</p>
            </div>
          </section>

          {/* Form and Activity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Account Details Form */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] border-b border-[#e0e3e5] pb-3 mb-5">Hồ sơ cá nhân</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Username (Không thể thay đổi)</label>
                  <input 
                    id="username"
                    className="w-full bg-[#f2f4f6] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed outline-none h-[46px] font-semibold"
                    value={username} 
                    readOnly 
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-[10px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Họ tên</label>
                  <input 
                    id="name"
                    className={inputCls("name")}
                    value={form.name} 
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Nguyễn Văn A" 
                  />
                  {errors.name && (
                    <p className="text-[#b70011] text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Email</label>
                  <input 
                    id="email"
                    className={inputCls("email")}
                    value={form.email} 
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="example@email.com" 
                    type="email"
                  />
                  {errors.email && (
                    <p className="text-[#b70011] text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[10px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Số điện thoại</label>
                  <input 
                    id="phone"
                    className={inputCls("phone")}
                    value={form.phone} 
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="0912 345 678" 
                  />
                  {errors.phone && (
                    <p className="text-[#b70011] text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#e0e3e5] flex gap-3">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-[#b70011] text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-[#93000b] active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-gray-500 hover:text-gray-800 px-4 py-3 rounded-full font-semibold text-sm transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar widgets */}
            <div className="flex flex-col gap-6">
              {/* Premium alert */}
              <div className="bg-[#b70011] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <h4 className="font-bold text-base mb-1.5">Gói Thành Viên</h4>
                    <p className="text-xs opacity-90 leading-relaxed">Thời hạn thành viên của bạn sẽ được tự động gia hạn khi có ưu đãi mới nhất.</p>
                  </div>
                  <button className="mt-4 bg-white text-[#b70011] hover:bg-gray-100 transition-all font-bold text-xs py-2 px-4 rounded-xl self-start shadow-sm">
                    Gia hạn ngay
                  </button>
                </div>
                {/* Background Decor */}
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-[100px] [font-variation-settings:'FILL'_1]">auto_stories</span>
                </div>
              </div>

              {/* Recent activity list */}
              <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-sm">
                <h4 className="font-bold text-sm text-[#191c1e] mb-4">Sách gần đây</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 bg-gray-200 rounded border border-[#e0e3e5] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 text-lg">book</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-[#191c1e] truncate">The Crimson Legacy</p>
                      <p className="text-[10px] text-gray-500">Đã mua 2 ngày trước</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 bg-gray-200 rounded border border-[#e0e3e5] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 text-lg">book</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-[#191c1e] truncate">Minimalist Wisdom</p>
                      <p className="text-[10px] text-gray-500">Đã mua 12 ngày trước</p>
                    </div>
                  </div>
                </div>
                <Link href="/user/my-orders" className="block text-center mt-5 text-xs font-bold text-[#b70011] hover:underline">
                  Xem tất cả đơn hàng
                </Link>
              </div>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
}