import { authFetch } from "@/lib/authFetch";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

export interface Category {
  id?: number;
  name: string;
  books?: any[];
}

export async function getAllCategories(): Promise<Category[]> {
  // SỬA: bỏ "admin/" khỏi URL
  const res = await authFetch(`${BASE_URL}/api/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải danh sách thể loại.");
  return res.json();
}

export async function getCategoryById(id: number): Promise<Category> {
  // SỬA: bỏ "admin/" khỏi URL
  const res = await authFetch(`${BASE_URL}/api/categories/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tìm thấy thể loại.");
  return res.json();
}

export async function createCategory(name: string): Promise<Category> {
  // SỬA: bỏ "admin/" khỏi URL
  const res = await authFetch(`${BASE_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Tạo thể loại thất bại.");
  return res.json();
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  // SỬA: bỏ "admin/" khỏi URL
  const res = await authFetch(`${BASE_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Cập nhật thể loại thất bại.");
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  // SỬA: bỏ "admin/" khỏi URL
  const res = await authFetch(`${BASE_URL}/api/categories/${id}`, { 
    method: "DELETE" 
  });
  if (!res.ok) throw new Error("Xóa thể loại thất bại.");
}