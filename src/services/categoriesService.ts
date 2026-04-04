const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Category {
  id?: number;
  name: string;
  books?: any[];
}

export async function getAllCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/api/admin/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải danh sách thể loại.");
  return res.json();
}

export async function getCategoryById(id: number): Promise<Category> {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tìm thấy thể loại.");
  return res.json();
}

export async function createCategory(name: string): Promise<Category> {
  const res = await fetch(`${BASE_URL}/api/admin/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Tạo thể loại thất bại.");
  return res.json();
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Cập nhật thể loại thất bại.");
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa thể loại thất bại.");
}