const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Book {
  id?: number;
  title: string;
  isbn?: string;
  authorId?: number;
  publisher?: string;
  categoryId?: number;
  price: number;
  quantity: number;
  active: boolean;
  description?: string;
  imageUrl?: string;
}

export async function getAllBooks(): Promise<Book[]> {
  const res = await fetch(`${BASE_URL}/api/admin/books`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải danh sách sách.");
  return res.json();
}

export async function getBookById(id: number): Promise<Book> {
  const res = await fetch(`${BASE_URL}/api/admin/books/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tìm thấy sách.");
  return res.json();
}

export async function deleteBook(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/books/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa sách thất bại.");
}