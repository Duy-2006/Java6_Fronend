import BookForm from "@/app/admin/books/_components/BooksForm";
import { getAllAuthors } from "@/services/authorsService";
import { getAllCategories } from "@/services/categoriesService";
import { authFetch } from "@/lib/authFetch"; // Đảm bảo import hàm fetch gắn token bảo mật

export const metadata = { title: "Nhập Sách Mới" };

// Hàm gọi trực tiếp đến API Backend thực tế của bạn
async function getPublishersDirectly() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    // Gọi đúng endpoint không có /admin/ đã check trong Controller Java của bạn
    const res = await authFetch(`${API_BASE}/api/publishers`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Lỗi khi fetch nhà xuất bản:", error);
    return [];
  }
}

export default async function NewBookPage() {
  // Thực hiện lấy dữ liệu thật từ Database cho cả 3 mục
  const [authors, categories, publishers] = await Promise.all([
    getAllAuthors().catch(() => []),
    getAllCategories().catch(() => []),
    getPublishersDirectly(),
  ]);

  return (
    <BookForm 
      authors={authors as any} 
      categories={categories as any} 
      publishers={publishers as any} 
    />
  );
}