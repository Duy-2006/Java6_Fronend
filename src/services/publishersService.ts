/*
 * publishersService.ts
 * Lop service xu ly cac thao tac CRUD doi voi du lieu nha xuat ban (Publisher) tren he thong Admin.
 * Giao tiep voi backend Spring Boot thong qua cac endpoint /api/admin/publishers.
 */

import { authFetch } from "@/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

export interface Publisher {
  id?: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
}

// Lay toan bo danh sach nha xuat ban tu backend
export async function getAllPublishers(): Promise<Publisher[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/publishers`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể tải danh sách nhà xuất bản.");
  return res.json();
}

// Lay thong tin chi tiet cua 1 nha xuat ban theo ma ID
export async function getPublisherById(id: number): Promise<Publisher> {
  const res = await authFetch(`${BASE_URL}/api/admin/publishers/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không tìm thấy nhà xuất bản.");
  return res.json();
}

// Tao moi mot nha xuat ban
export async function createPublisher(data: Omit<Publisher, "id">): Promise<Publisher> {
  const res = await authFetch(`${BASE_URL}/api/admin/publishers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo nhà xuất bản thất bại.");
  return res.json();
}

// Cap nhat thong tin nha xuat ban theo ma ID
export async function updatePublisher(id: number, data: Omit<Publisher, "id">): Promise<Publisher> {
  const res = await authFetch(`${BASE_URL}/api/admin/publishers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật nhà xuất bản thất bại.");
  return res.json();
}

// Xoa mot nha xuat ban khoi database theo ma ID
export async function deletePublisher(id: number): Promise<void> {
  const res = await authFetch(`${BASE_URL}/api/admin/publishers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Xóa nhà xuất bản thất bại.");
}
