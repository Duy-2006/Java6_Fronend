import BookForm from "@/app/admin/books/_components/BooksForm";
import { getAllAuthors } from "@/services/authorsService";
import { getAllCategories } from "@/services/categoriesService";

export const metadata = { title: "Nhập Sách Mới" };

export default async function NewBookPage() {
  const [authors, categories] = await Promise.all([
    getAllAuthors().catch(() => []),
    getAllCategories().catch(() => []),
  ]);

  return <BookForm authors={authors} categories={categories} />;
}