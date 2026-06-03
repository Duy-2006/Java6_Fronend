"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { Mail, Lock, Eye, EyeOff, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra trống trường ở client
    let hasError = false;
    const tempFieldErrors: Record<string, string> = {};

    if (!usernameOrEmail.trim()) {
      tempFieldErrors.usernameOrEmail = "Tên đăng nhập không được để trống";
      hasError = true;
    }

    if (!password) {
      tempFieldErrors.password = "Mật khẩu không được để trống";
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
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setError(data.message || "Sai tên đăng nhập hoặc mật khẩu");
        }
        return;
      }

      // Lưu token và user
      localStorage.setItem("token", data.token);
      if (data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.name || data.user.fullName,
          role: data.user.role,
          username: data.user.username,
          email: data.user.email,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userId", data.user.id.toString());
      }

      // Chuyển hướng sau khi đăng nhập
      if (data.user?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push(redirect);
      }
    } catch (err) {
      setError("Lỗi kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#fdfbfb] via-[#f7f2f2] to-[#ffdad6]/20">
      <Navbar />

      <div className="flex-grow flex items-center justify-center py-16 px-4 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#ffdad6]/40 blur-3xl -z-10" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#ffdad6]/25 blur-3xl -z-10" />

        <div className="w-full max-w-md bg-white border border-[#e6bdb8]/30 rounded-2xl shadow-xl overflow-hidden animate__animated animate__fadeIn relative z-10">
          {/* Header block with red accent line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#b70011] via-[#d63031] to-[#b70011]" />

          <div className="p-8 md:p-10 font-sans">
            {/* Logo and title */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#b70011] flex items-center justify-center shadow-inner mb-4 hover:scale-105 transition-transform duration-300">
                <BookOpen className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Đăng Nhập
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-1 uppercase tracking-wider">
                Chào mừng bạn đến với BOOKSTORE
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#b70011] text-[#991b1b] rounded-r-xl text-sm flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Đăng nhập thất bại</span>
                  <p className="text-xs text-red-700/90 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email / Username</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value);
                      if (fieldErrors.usernameOrEmail) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.usernameOrEmail;
                          return updated;
                        });
                      }
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${fieldErrors.usernameOrEmail ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
                      } rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-200 text-sm placeholder-slate-400 font-medium text-slate-800`}
                    placeholder="Nhập email hoặc tên tài khoản"
                  />
                </div>
                {fieldErrors.usernameOrEmail && (
                  <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{fieldErrors.usernameOrEmail}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mật khẩu</span>
                  </label>
                  <Link
                    href="/user/forgot-password"
                    className="text-xs font-bold text-[#b70011] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.password;
                          return updated;
                        });
                      }
                    }}
                    className={`w-full pl-4 pr-12 py-2.5 bg-slate-50/50 hover:bg-slate-50 border ${fieldErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-[#b70011] focus:ring-[#ffdad6]/30"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-[#b70011] to-[#91000a] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <span>Đăng Nhập</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                <span className="px-3 bg-white text-slate-400">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Google OAuth Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 hover:bg-slate-50 transition-colors duration-150 cursor-pointer font-semibold text-sm text-slate-700 shadow-sm"
            >
              <FcGoogle className="w-5 h-5" />
              <span>Đăng nhập bằng Google</span>
            </button>

            {/* Signup Link */}
            <p className="text-center text-xs text-slate-500 font-semibold mt-8 border-t border-slate-100 pt-6">
              Bạn mới biết đến BOOKSTORE?{" "}
              <Link href="/auth/register" className="text-[#b70011] font-bold hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#fdfbfb] to-[#ffdad6]/20">
        <Loader2 className="h-10 w-10 animate-spin text-[#b70011] mb-4" />
        <p className="text-slate-500 font-bold text-sm">Đang tải trang đăng nhập...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}