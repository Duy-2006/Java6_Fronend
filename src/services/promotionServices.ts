import { authFetch } from "@/lib/authFetch";
const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// ==================== INTERFACES ====================
export interface PromotionDTO {
  id?: number;
  name: string;
  discountValue: number;          // % giảm giá (0-100)
  startDate?: string;             // YYYY-MM-DD
  endDate?: string;               // YYYY-MM-DD
  status: boolean;
  applyType: "ALL" | "BOOK" | "CATEGORY";
  computedStatus?: string;        // UPCOMING | ACTIVE | EXPIRED | UNKNOWN
  bookIds?: number[];
  bookTitles?: string[];
  categoryIds?: number[];
  categoryNames?: string[];
}

export interface FormData {
  books:      { id: number; title: string }[];
  categories: { id: number; name: string  }[];
}

// ==================== HELPER ====================
/**
 * Cookie-Only: Xác thực tự động qua HTTP-Only cookie (authFetch).
 * Không cần header Authorization.
 */
function authHeader(): Record<string, string> {
  return {};
}

// ==================== GET ALL PROMOTIONS ====================
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

  // BE trả thẳng List<PromotionDTO> — không có wrapper object
  const data: PromotionDTO[] = await res.json();
  return data;
}

// ==================== GET PROMOTION BY ID ====================
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

// ==================== GET FORM DATA (books + categories) ====================
export async function getPromotionFormData(): Promise<FormData> {
  const res = await authFetch(`${API_URL}/api/admin/promotions/form-data`, {
    cache: "no-store",
    headers: {
      
    },
  });

  if (!res.ok) throw new Error(`Lỗi tải form data (${res.status})`);
  return res.json();
}

// ==================== CREATE PROMOTION ====================
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

  return res.text(); // BE trả về string "Tạo khuyến mãi thành công"
}

// ==================== UPDATE PROMOTION ====================
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

  return res.text(); // BE trả về string "Cập nhật thành công"
}

// ==================== DELETE PROMOTION ====================
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