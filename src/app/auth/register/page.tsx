/*
 * page.tsx (Register Page)
 * Trang dang ky tai khoan moi cho nguoi dung.
 * Bao gom form nhap thong tin (username, ten, email, sdt, mat khau, xac nhan mat khau).
 * Xu ly kiem tra loi phia client (validate) truoc khi gui request len backend.
 * Neu dang ky thanh cong, thong bao va chuyen huong ve trang dang nhap.
 */

"use client";
import { authFetch } from "@/lib/authFetch";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Lock, Eye, EyeOff, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Xóa lỗi của trường đó khi người dùng đang nhập
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    // Nếu đổi tên đầy đủ, xóa cả lỗi trường "name" do backend map về
    if (name === "fullName" && fieldErrors.name) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.name;
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phía client
    let hasError = false;
    const tempFieldErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      tempFieldErrors.username = "Tên đăng nhập không được để trống";
      hasError = true;
    }
    if (!formData.fullName.trim()) {
      tempFieldErrors.fullName = "Họ và tên không được để trống";
      hasError = true;
    }
    if (!formData.email.trim()) {
      tempFieldErrors.email = "Email không được để trống";
      hasError = true;
    }
    if (!formData.phone.trim()) {
      tempFieldErrors.phone = "Số điện thoại không được để trống";
      hasError = true;
    }
    if (!formData.password) {
      tempFieldErrors.password = "Mật khẩu không được để trống";
      hasError = true;
    }
    if (!formData.confirmPassword) {
      tempFieldErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      hasError = true;
    } else if (formData.password !== formData.confirmPassword) {
      tempFieldErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(tempFieldErrors);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const res = await authFetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.trim(),
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setError(data.message || data.error || "Đăng ký thất bại");
        }
        return;
      }

      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      router.push("/auth/login");
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#fdfbfb] via-[#f7f2f2] to-[#ffdad6]/20">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center py-16 px-4 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#ffdad6]/40 blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#ffdad6]/25 blur-3xl -z-10" />
        
        <div className="w-full max-w-2xl bg-white border border-[#e6bdb8]/30 rounded-2xl shadow-xl overflow-hidden animate__animated animate__fadeIn relative z-10">
          {/* Header block with red accent line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#b70011] via-[#d63031] to-[#b70011]" />
          
          <div className="p-8 md:p-10 font-sans">
            {/* Logo and title */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#b70011] flex items-center justify-center shadow-inner mb-4 hover:scale-105 transition-transform duration-300">
                <BookOpen className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Đăng Ký Tài Khoản
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-1 uppercase tracking-wider">
                Chào mừng bạn đến với BOOKSTORE
              </p>
            </div>

            {/* General Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#b70011] text-[#991b1b] rounded-r-xl text-sm flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Đăng ký thất bại</span>
                  <p className="text-xs text-red-700/90 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tên đăng nhập</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${
                      fieldErrors.username ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
                    } rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-sm placeholder-slate-400 font-medium text-slate-800`}
                    placeholder="Nhập tên tài khoản"
                  />
                  {fieldErrors.username && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.username}</span>
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Họ và tên</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${
                      fieldErrors.fullName || fieldErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
                    } rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-sm placeholder-slate-400 font-medium text-slate-800`}
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                  {(fieldErrors.fullName || fieldErrors.name) && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.fullName || fieldErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${
                      fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
                    } rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-sm placeholder-slate-400 font-medium text-slate-800`}
                    placeholder="example@email.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Số điện thoại</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${
                      fieldErrors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
                    } rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-sm placeholder-slate-400 font-medium text-slate-800`}
                    placeholder="0xxxxxxxxx"
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mật khẩu</span>
                  </label>
                  <div className="relative group">
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-4 pr-12 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${
                        fieldErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
                      } rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-sm placeholder-slate-400 font-medium text-slate-800`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#b70011] transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Xác nhận mật khẩu</span>
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-4 pr-12 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${
                        fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
                      } rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-sm placeholder-slate-400 font-medium text-slate-800`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#b70011] transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-[#b70011] to-[#91000a] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý đăng ký...</span>
                  </>
                ) : (
                  <span>Đăng Ký</span>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 font-semibold mt-6 border-t border-slate-100 pt-4">
              Đã có tài khoản?{" "}
              <Link href="/auth/login" className="text-[#b70011] font-bold hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}