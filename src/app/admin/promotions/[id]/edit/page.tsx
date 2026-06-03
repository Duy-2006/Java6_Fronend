"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PromotionForm from "@/app/admin/promotions/_components/PromotionForm";
import { getPromotionById, getPromotionFormData } from "@/services/promotionServices";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

interface Book     { id: number; title: string }
interface Category { id: number; name:  string }

export default function EditPromotionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [promo,       setPromo]       = useState<any>(null);
  const [books,       setBooks]       = useState<Book[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token")      ||
      "";

    if (!token) {
      setError("Chưa đăng nhập hoặc phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    Promise.all([
      getPromotionById(Number(params.id), token),
      getPromotionFormData(token),
    ])
      .then(([promoData, formData]) => {
        setPromo(promoData);
        setBooks(formData.books);
        setCategories(formData.categories);
      })
      .catch(err => setError(err.message || "Không thể tải dữ liệu chương trình khuyến mãi."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[400px] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#b70011] animate-spin" />
        <p className="text-sm font-semibold text-[#5c403c] animate-pulse">
          Đang tải dữ liệu chương trình khuyến mãi...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-bold text-red-800">Đã xảy ra lỗi</h3>
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/admin/promotions")}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!promo) return null;

  const selectedBookIds:     number[] = promo.bookIds     ?? [];
  const selectedCategoryIds: number[] = promo.categoryIds ?? [];

  return (
    <PromotionForm
      promotion={{ ...promo, bookIds: selectedBookIds, categoryIds: selectedCategoryIds }}
      books={books}
      categories={categories}
      selectedBookIds={selectedBookIds}
      selectedCategoryIds={selectedCategoryIds}
    />
  );
}