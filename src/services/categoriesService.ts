/*
 * categoriesService.ts
 * Lop service xu ly cac thao tac CRUD doi voi du lieu the loai sach (Category).
 * Giao tiep voi backend Spring Boot thong qua cac endpoint /api/categories (API cong khai).
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Kieu du lieu cua mot the loai sach
export interface Category {
  id?: number;     // Ma the loai (tu dong sinh boi database)
  name: string;    // Ten the loai (vi du: "Tiểu thuyết", "Khoa học")
  books?: any[];   // Danh sach sach thuoc the loai nay (quan he 1-N)
}

// Lay toan bo danh sach the loai tu backend
export async function getAllCategories(): Promise<Category[]> {
  const res = await authFetch(`${BASE_URL}/api/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải danh sách thể loại.");
  return res.json();
}

// Lay thong tin chi tiet cua 1 the loai theo ma ID
export async function getCategoryById(id: number): Promise<Category> {
  const res = await authFetch(`${BASE_URL}/api/categories/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tìm thấy thể loại.");
  return res.json();
}

// Tao moi mot the loai - chi can truyen ten the loai
export async function createCategory(name: string): Promise<Category> {
  const res = await authFetch(`${BASE_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Tạo thể loại thất bại.");
  return res.json();
}

// Cap nhat ten the loai theo ma ID
export async function updateCategory(id: number, name: string): Promise<Category> {
  const res = await authFetch(`${BASE_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Cập nhật thể loại thất bại.");
  return res.json();
}

// Xoa mot the loai khoi database theo ma ID
export async function deleteCategory(id: number): Promise<void> {
  const res = await authFetch(`${BASE_URL}/api/categories/${id}`, { 
    method: "DELETE" 
  });
  if (!res.ok) throw new Error("Xóa thể loại thất bại.");
}