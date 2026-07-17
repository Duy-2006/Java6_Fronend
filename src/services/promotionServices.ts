const API_URL = process.env.API_URL || "http://localhost:8080";

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
  usageLimit?: number;
  usedCount?: number;
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
 * Trả về header Authorization chỉ khi token hợp lệ.
 * Tránh gửi "Bearer null" / "Bearer undefined" → 401.
 */
function authHeader(token: string): Record<string, string> {
  return token && token !== "null" && token !== "undefined"
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// ==================== GET ALL PROMOTIONS ====================
export async function getAllPromotions(token: string): Promise<PromotionDTO[]> {
  const res = await fetch(`${API_URL}/api/admin/promotions`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...authHeader(token),
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
export async function getPromotionById(
  id: number,
  token: string
): Promise<PromotionDTO> {
  const res = await fetch(`${API_URL}/api/admin/promotions/${id}`, {
    cache: "no-store",
    headers: {
      ...authHeader(token),
    },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Không tìm thấy chương trình khuyến mãi.");
    throw new Error(`Lỗi khi lấy thông tin khuyến mãi (${res.status})`);
  }

  return res.json();
}

// ==================== GET FORM DATA (books + categories) ====================
export async function getPromotionFormData(token: string): Promise<FormData> {
  const res = await fetch(`${API_URL}/api/admin/promotions/form-data`, {
    cache: "no-store",
    headers: {
      ...authHeader(token),
    },
  });

  if (!res.ok) throw new Error(`Lỗi tải form data (${res.status})`);
  return res.json();
}

// ==================== CREATE PROMOTION ====================
export async function createPromotion(
  payload: Omit<PromotionDTO, "id" | "computedStatus" | "bookTitles" | "categoryNames">,
  token: string
): Promise<string> {
  const res = await fetch(`${API_URL}/api/admin/promotions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
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
  payload: Omit<PromotionDTO, "id" | "computedStatus" | "bookTitles" | "categoryNames">,
  token: string
): Promise<string> {
  const res = await fetch(`${API_URL}/api/admin/promotions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
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
export async function deletePromotion(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/promotions/${id}`, {
    method: "DELETE",
    headers: {
      ...authHeader(token),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Xóa chương trình khuyến mãi thất bại.");
  }
}