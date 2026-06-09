import { authFetch } from "@/lib/authFetch";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

export interface Author {
  id?: number;
  name: string;
  email?: string;
}

export async function getAllAuthors(): Promise<Author[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể tải danh sách tác giả.");
  return res.json();
}

export async function getAuthorById(id: number): Promise<Author> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không tìm thấy tác giả.");
  return res.json();
}

export async function createAuthor(data: Omit<Author, "id">): Promise<Author> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo tác giả thất bại.");
  return res.json();
}

export async function updateAuthor(id: number, data: Omit<Author, "id">): Promise<Author> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật tác giả thất bại.");
  return res.json();
}

export async function deleteAuthor(id: number): Promise<void> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Xóa tác giả thất bại.");
}