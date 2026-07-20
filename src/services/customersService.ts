/*
 * customersService.ts
 * Lop service xu ly cac thao tac lien quan den quan ly khach hang trong trang Admin.
 * Bao gom: xem danh sach khach hang, xem lich su mua hang, khoa/mo tai khoan.
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend Spring Boot
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Kieu du lieu tom tat thong tin khach hang (hien thi trong bang danh sach)
export interface CustomerSummary {
  username: string;       // Ten dang nhap
  fullName: string;       // Ho va ten day du
  email: string;          // Dia chi email
  phone: string;          // So dien thoai
  active: boolean;        // Trang thai tai khoan (true = hoat dong, false = bi khoa)
  totalSpending: number;  // Tong tien da chi tieu (VND)
  customerType: string;   // Phan loai khach hang (VIP, thuong, ...)
  avatar?: string;        // Duong dan anh dai dien
}

// Kieu du lieu chi tiet khach hang kem lich su don hang
export interface CustomerHistory extends CustomerSummary {
  orders: any[];  // Danh sach cac don hang da dat
}

// Kieu du lieu tra ve khi bat/tat trang thai tai khoan
export interface ToggleStatusResponse {
  message: string;    // Thong bao ket qua tu backend
  active: boolean;    // Trang thai moi sau khi thay doi
  username: string;   // Ten dang nhap cua tai khoan vua thay doi
}

// Tao header xac thuc cho cac request API
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// Ham xu ly chung cho response tu backend:
// Doc du lieu dang text roi chuyen sang JSON, xu ly loi 401 (het han dang nhap)
async function handleResponse(response: Response) {
  const text = await response.text();
  console.log('[handleResponse] Raw response (first 500 chars):', text.substring(0, 500));

  // Neu backend tra ve 401 (Unauthorized) thi xoa token va chuyen ve trang dang nhap
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
  }

  // Neu co loi khac (400, 403, 500...) thi nem ra loi voi thong tin chi tiet
  if (!response.ok) {
    throw new Error(`Lỗi ${response.status}: ${text || response.statusText}`);
  }

  // Parse JSON tu text da doc, bat loi neu backend tra ve du lieu khong hop le
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('JSON parse error. Full response text:', text);
    throw new Error('Dữ liệu từ server không đúng định dạng JSON');
  }
}

// Lay toan bo danh sach khach hang (dung cho trang Admin > Quan ly khach hang)
export async function getAllCustomers(): Promise<CustomerSummary[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/customers`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

// Lay lich su mua hang chi tiet cua 1 khach hang theo username
export async function getCustomerHistory(username: string): Promise<CustomerHistory> {
  const res = await authFetch(`${BASE_URL}/api/admin/customers/history/${username}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

// Bat/tat trang thai hoat dong cua tai khoan khach hang (khoa hoac mo khoa)
export async function toggleCustomerStatus(username: string): Promise<ToggleStatusResponse> {
  const res = await authFetch(`${BASE_URL}/api/admin/customers/toggle/${username}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse(res);
}

export function getCustomerClassification(totalSpending: number) {
  if (totalSpending >= 2000000) {
    return {
      rank: "VIP Diamond",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: "",
      isVip: true
    };
  }
  if (totalSpending >= 1000000) {
    return {
      rank: "VIP Gold",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "",
      isVip: true
    };
  }
  if (totalSpending >= 500000) {
    return {
      rank: "Thành viên thân thiết",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "",
      isVip: false
    };
  }
  return {
    rank: "Mới đăng ký",
    color: "bg-slate-50 text-slate-700 border-slate-200",
    icon: "",
    isVip: false
  };
}