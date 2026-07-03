/*
 * authorsService.ts
 * Lop service xu ly cac thao tac CRUD doi voi du lieu tac gia (Author) tren he thong Admin.
 * Giao tiep voi backend Spring Boot thong qua cac endpoint /api/admin/authors.
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend, doc tu bien moi truong
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Kieu du lieu cua mot tac gia, tuong ung voi AuthorDTO ben backend
export interface Author {
  id?: number;     // Ma tac gia (tu dong sinh boi database)
  name: string;    // Ten tac gia
  email?: string;  // Email cua tac gia (khong bat buoc)
}

// Lay toan bo danh sach tac gia tu backend
export async function getAllAuthors(): Promise<Author[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể tải danh sách tác giả.");
  return res.json();
}

// Lay thong tin chi tiet cua 1 tac gia theo ma ID
export async function getAuthorById(id: number): Promise<Author> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không tìm thấy tác giả.");
  return res.json();
}

// Tao moi mot tac gia - gui thong tin ten va email len backend
export async function createAuthor(data: Omit<Author, "id">): Promise<Author> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo tác giả thất bại.");
  return res.json();
}

// Cap nhat thong tin tac gia theo ma ID
export async function updateAuthor(id: number, data: Omit<Author, "id">): Promise<Author> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật tác giả thất bại.");
  return res.json();
}

// Xoa mot tac gia khoi database theo ma ID
export async function deleteAuthor(id: number): Promise<void> {
  const res = await authFetch(`${BASE_URL}/api/admin/authors/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Xóa tác giả thất bại.");
}