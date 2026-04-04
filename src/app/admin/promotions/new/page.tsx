import PromotionForm from "@/app/admin/promotions/_components/PromotionForm";
import { getAllBooks } from "@/services/booksService";
import { getAllCategories } from "@/services/categoriesService";

export const metadata = { title: "Tạo Khuyến mãi" };

export default async function NewPromotionPage() {
  const [books, categories] = await Promise.all([
    getAllBooks().catch(() => []),
    getAllCategories().catch(() => []),
  ]);
  return <PromotionForm books={books} categories={categories} />;
}