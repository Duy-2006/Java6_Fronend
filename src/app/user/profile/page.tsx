"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
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
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const decoded = parseJwt(token);
    if (decoded) {
      setUsername(decoded.username || "");
      setRole(decoded.role || "");
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    fetch(`${apiUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
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

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      const res = await fetch(`${apiUrl}/api/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const setField = (field: keyof ProfileUpdateRequest, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const inputCls = (field: keyof ProfileUpdateRequest) =>
    `w-full border rounded-lg px-4 py-3 h-[46px] text-sm outline-none transition-all duration-150 tracking-tight ${
      errors[field]
        ? "border-[#C92127] bg-[#C92127]/5 text-[#C92127] placeholder-[#C92127]/40 focus:ring-2 focus:ring-[#C92127]/10"
        : "border-[#e5e5e7] bg-white text-[#1c1c1e] placeholder-gray-400 focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10"
    }`;

  if (loading)
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C92127] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="bg-[#f5f5f7] min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0a1317] text-white px-6 py-3.5 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 border border-[#e5e5e7]/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined text-[#34c759] text-lg">check_circle</span>
            <span className="tracking-tight">{toast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Avatar card */}
          <div className="md:col-span-4">
            <div className="bg-white rounded-[32px] border border-[#e5e5e7] p-8 text-center transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <div className="w-28 h-28 rounded-full bg-[#C92127]/8 text-[#C92127] flex items-center justify-center mx-auto text-4xl font-semibold border-2 border-white ring-4 ring-[#C92127]/5 select-none font-mono">
                {form.name ? form.name.trim().charAt(0).toUpperCase() : "U"}
              </div>
              <h4 className="mt-5 font-bold text-xl text-[#0a1317] tracking-tight truncate max-w-full">
                {form.name || "Tên người dùng"}
              </h4>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#0066cc]/8 text-[#0066cc] text-xs font-bold tracking-tight rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-pulse"></span>
                {role || "USER"}
              </div>
              <p className="text-[#86868b] text-sm mt-3 font-medium tracking-tight font-mono">{username}</p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-8">
            <div className="bg-white rounded-[32px] border border-[#e5e5e7] p-8 md:p-10 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <h4 className="mb-8 font-bold text-2xl text-[#0a1317] tracking-tight">Thông tin cá nhân</h4>
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#86868b] mb-2 uppercase tracking-widest">
                    Họ tên
                  </label>
                  <input
                    className={inputCls("name")}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.name && (
                    <p className="text-[#C92127] text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#86868b] mb-2 uppercase tracking-widest">
                    Email
                  </label>
                  <input
                    className={inputCls("email")}
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-[#C92127] text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#86868b] mb-2 uppercase tracking-widest">
                    Số điện thoại
                  </label>
                  <input
                    className={inputCls("phone")}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="0901 234 567"
                  />
                  {errors.phone && (
                    <p className="text-[#C92127] text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#86868b] mb-2 uppercase tracking-widest">
                    Username
                  </label>
                  <input
                    className="w-full border border-[#f5f5f7] bg-[#f5f5f7] rounded-lg px-4 py-3 h-[46px] text-sm text-[#86868b] cursor-not-allowed font-medium tracking-tight"
                    value={username}
                    readOnly
                  />
                  <p className="text-[#86868b] text-[11px] font-medium mt-2 tracking-tight">Username không thể thay đổi.</p>
                </div>

                <div className="pt-4 border-t border-[#e5e5e7]/80">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#C92127] text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-tight hover:bg-[#A8171C] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2"
                  >
                    {saving && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {saving ? "Đang lưu..." : "Cập nhật thông tin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}