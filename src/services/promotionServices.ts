/*
 * promotionServices.ts
 * Lop service xu ly cac thao tac CRUD doi voi chuong trinh khuyen mai (Promotion).
 * Admin co the tao khuyen mai ap dung cho toan bo sach, theo tung cuon sach, hoac theo the loai.
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend
const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Kieu du lieu cua mot chuong trinh khuyen mai
export interface PromotionDTO {
  id?: number;                              // Ma khuyen mai
  name: string;                             // Ten chuong trinh khuyen mai
  discountValue: number;                    // Phan tram giam gia (0-100)
  startDate?: string;                       // Ngay bat dau (YYYY-MM-DD)
  endDate?: string;                         // Ngay ket thuc (YYYY-MM-DD)
  status: boolean;                          // Trang thai kich hoat (true/false)
  applyType: "ALL" | "BOOK" | "CATEGORY";  // Pham vi ap dung: toan bo, theo sach, theo the loai
  computedStatus?: string;                  // Trang thai tinh toan: UPCOMING (sap dien ra), ACTIVE (dang chay), EXPIRED (het han)
  bookIds?: number[];                       // Danh sach ma sach duoc ap dung (khi applyType = BOOK)
  bookTitles?: string[];                    // Ten cac sach duoc ap dung (dung de hien thi)
  categoryIds?: number[];                   // Danh sach ma the loai (khi applyType = CATEGORY)
  categoryNames?: string[];                 // Ten cac the loai (dung de hien thi)
}

// Kieu du lieu cho form tao/sua khuyen mai (danh sach sach va the loai de chon)
export interface FormData {
  books:      { id: number; title: string }[];
  categories: { id: number; name: string  }[];
}

// Ham tao header xac thuc - hien tai dung Cookie-Only nen khong can Authorization header
function authHeader(): Record<string, string> {
  return {};
}

// Lay toan bo danh sach khuyen mai tu backend
export async function getAllPromotions(): Promise<PromotionDTO[]> {
  const res = await authFetch(`${API_URL}/api/admin/promotions`, {
    method: "GET",
    cache: "no-store",
    headers: {
      
    },
  });

  if (!res.ok) {
    throw new Error(`Lỗi tải danh sách khuyến mãi (${res.status})`);
  }

  // Backend tra ve truc tiep mang PromotionDTO (khong co wrapper object)
  const data: PromotionDTO[] = await res.json();
  return data;
}

// Lay chi tiet 1 chuong trinh khuyen mai theo ma ID
export async function getPromotionById(id: number): Promise<PromotionDTO> {
  const res = await authFetch(`${API_URL}/api/admin/promotions/${id}`, {
    cache: "no-store",
    headers: {
      
    },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Không tìm thấy chương trình khuyến mãi.");
    throw new Error(`Lỗi khi lấy thông tin khuyến mãi (${res.status})`);
  }

  return res.json();
}

// Lay du lieu phuc vu form tao/sua khuyen mai (danh sach sach va the loai)
export async function getPromotionFormData(): Promise<FormData> {
  const res = await authFetch(`${API_URL}/api/admin/promotions/form-data`, {
    cache: "no-store",
    headers: {
      
    },
  });

  if (!res.ok) throw new Error(`Lỗi tải form data (${res.status})`);
  return res.json();
}

// Tao moi mot chuong trinh khuyen mai
export async function createPromotion(
  payload: Omit<PromotionDTO, "id" | "computedStatus" | "bookTitles" | "categoryNames">): Promise<string> {
  const res = await authFetch(`${API_URL}/api/admin/promotions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Tạo khuyến mãi thất bại.");
  }

  // Backend tra ve chuoi thong bao dang text (khong phai JSON)
  return res.text();
}

// Cap nhat chuong trinh khuyen mai theo ma ID
export async function updatePromotion(
  id: number,
  payload: Omit<PromotionDTO, "id" | "computedStatus" | "bookTitles" | "categoryNames">): Promise<string> {
  const res = await authFetch(`${API_URL}/api/admin/promotions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Cập nhật khuyến mãi thất bại.");
  }

  return res.text();
}

// Xoa chuong trinh khuyen mai theo ma ID
export async function deletePromotion(id: number): Promise<void> {
  const res = await authFetch(`${API_URL}/api/admin/promotions/${id}`, {
    method: "DELETE",
    headers: {
      
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Xóa chương trình khuyến mãi thất bại.");
  }
}