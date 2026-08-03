const API_URL = process.env.API_URL || "http://localhost:8080";

// ==================== INTERFACES ====================
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
  usageLimit?: number;                      // Gioi han luot dung
  usedCount?: number;                       // So luot da dung
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