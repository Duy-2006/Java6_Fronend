import { notFound } from "next/navigation";
import PromotionForm from "@/app/admin/promotions/_components/PromotionForm";
import { getAllBooks } from "@/services/booksService";
import { getAllCategories } from "@/services/categoriesService";

interface Props { params: { id: string } }

async function getPromotion(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/promotions/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: Props) {
  const p = await getPromotion(params.id);
  return { title: p ? `Sửa: ${p.name}` : "Sửa Khuyến mãi" };
}

export default async function EditPromotionPage({ params }: Props) {
  const [promo, books, categories] = await Promise.all([
    getPromotion(params.id),
    getAllBooks().catch(() => []),
    getAllCategories().catch(() => []),
  ]);
  if (!promo) notFound();

  const selectedBookIds:     number[] = promo.books?.map((b: any) => b.id)     ?? [];
  const selectedCategoryIds: number[] = promo.categories?.map((c: any) => c.id) ?? [];

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