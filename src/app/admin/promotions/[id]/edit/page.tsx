"use client";

// ⚠️ Phải là client component vì cần localStorage để lấy token
// Server component không thể đọc localStorage

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import PromotionForm from "@/app/admin/promotions/_components/PromotionForm";
import { getPromotionById, getPromotionFormData } from "@/services/promotionServices";

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
      setError("Chưa đăng nhập. Vui lòng đăng nhập lại.");
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
      .catch(err => setError(err.message || "Không thể tải dữ liệu."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontSize: 15 }}>
      Đang tải dữ liệu...
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 500, margin: "60px auto", background: "#fee2e2",
      color: "#991b1b", padding: "20px 24px", borderRadius: 12, fontSize: 14 }}>
      ⚠️ {error}
      <br />
      <button
        onClick={() => router.push("/admin/promotions")}
        style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8,
          border: "none", background: "#991b1b", color: "#fff", cursor: "pointer", fontSize: 13 }}
      >
        Quay lại danh sách
      </button>
    </div>
  );

  if (!promo) return null;

  // ✅ DTO trả về bookIds / categoryIds — KHÔNG phải promo.books / promo.categories
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