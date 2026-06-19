"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BookCard from "@/components/BookCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

interface CategoryBookListProps {
  initialBooks: any[];
}

export default function CategoryBookList({ initialBooks }: CategoryBookListProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = async (book: any, redirectToCheckout: boolean = false) => {
    if (!isLoggedIn()) {
      showToast("Vui lòng đăng nhập để thêm vào giỏ hàng", true);
      router.push("/auth/login");
      return;
    }
    try {
      const response = await authFetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Thêm vào giỏ thất bại");
      showToast(`Đã thêm "${book.title}" vào giỏ hàng!`);
      window.dispatchEvent(new Event("cartUpdated"));
      if (redirectToCheckout) router.push("/user/cart");
    } catch (error: any) {
      console.error("Add to cart error:", error);
      showToast(error.message, true);
    }
  };

  return (
    <>
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 animate-fade-in ${
          toast.isError ? "bg-[#ba1a1a] text-white" : "bg-emerald-600 text-white"
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.isError ? "error" : "check_circle"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {initialBooks.map((book) => (
          <BookCard key={book.id} b={book} onAddToCart={addToCart} />
        ))}
      </div>
    </>
  );
}
