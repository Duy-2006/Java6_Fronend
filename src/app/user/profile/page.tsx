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
    `w-full border rounded-xl px-4 py-3 text-sm outline-none transition ${
      errors[field]
        ? "border-red-400 bg-red-50"
        : "border-gray-200 focus:border-red-500"
    }`;

  if (loading)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Toast hiển thị trong vùng nội dung, căn trái, không bị lệch */}
        {toast && (
          <div className="mb-4 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg font-medium text-sm flex items-center gap-2 w-full md:w-auto md:min-w-[300px]">
            <span className="material-symbols-outlined text-base">check_circle</span> {toast}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Avatar card */}
          <div className="md:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="w-28 h-28 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-5xl font-black">
                {form.name.charAt(0).toUpperCase() || "U"}
              </div>
              <h4 className="mt-4 font-bold text-lg">{form.name || "Tên người dùng"}</h4>
              <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                {role}
              </span>
              <p className="text-gray-400 text-sm mt-2 font-mono">{username}</p>
            </div>
          </div>

          {/* Form chỉnh sửa trực tiếp */}
          <div className="md:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h4 className="mb-6 font-bold text-xl">Thông tin cá nhân</h4>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                    Họ tên
                  </label>
                  <input
                    className={inputCls("name")}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                    Email
                  </label>
                  <input
                    className={inputCls("email")}
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                    Số điện thoại
                  </label>
                  <input
                    className={inputCls("phone")}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="0901 234 567"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                    Username
                  </label>
                  <input
                    className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                    value={username}
                    readOnly
                  />
                  <p className="text-gray-400 text-xs mt-1">Username không thể thay đổi.</p>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#C92127] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition active:scale-95 disabled:opacity-60"
                  >
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