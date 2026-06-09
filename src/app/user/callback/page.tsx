"use client";
import { isLoggedIn } from "@/lib/authFetch";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Lấy params từ URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userParam = params.get("user");
    const error = params.get("error");

    if (error) {
      alert("Đăng nhập Google thất bại!");
      router.push("/");
      return;
    }

    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        // Token đã được backend gắn vào HTTP-Only cookie trong OAuth handler
        // Chỉ lưu metadata hiển thị (tên, role, id) vào localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        if (userData.id) {
          localStorage.setItem("userId", userData.id.toString());
        }
        
        // Reload trang để cập nhật Navbar
        window.location.href = "/";
      } catch (err) {
        console.error(err);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}